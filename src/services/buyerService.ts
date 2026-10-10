import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseConfigured } from '../lib/firebase';
import { Batch, Plaque, RedirectRecord } from '../types';

/**
 * Generates an immutable, short URL-friendly public identifier for the QR code
 * e.g. "dp_9x4b1z"
 */
export function generateShortPublicId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let str = 'dp_';
  for (let i = 0; i < 6; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

/**
 * Computes next sequential number for the buyer (starts at 1)
 */
export async function getNextSequentialNumber(uid: string): Promise<number> {
  if (!isFirebaseConfigured) return 1;

  const plaquesRef = collection(db, 'users', uid, 'plaques');
  const q = query(plaquesRef, orderBy('sequentialNumber', 'desc'));

  try {
    const snap = await getDocs(q);
    if (snap.empty) return 1;
    const highest = snap.docs[0].data()?.sequentialNumber;
    return typeof highest === 'number' ? highest + 1 : 1;
  } catch (err) {
    console.warn('Could not query highest sequential number:', err);
    return 1;
  }
}

/**
 * Creates a new batch of plaques atomically.
 * Writes batch record, plaques subcollection records, and public redirects collection records.
 */
export async function createBatchWithPlaques(
  uid: string,
  modelId: string,
  quantity: number,
  batchName?: string,
  defaultTargetUrl: string = 'https://instagram.com'
): Promise<{ batch: Batch; plaques: Plaque[] }> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase não está configurado.');
  }

  const startNumber = await getNextSequentialNumber(uid);
  const endNumber = startNumber + quantity - 1;
  const now = new Date().toISOString();
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const finalBatchName = batchName?.trim() || `Lote #${startNumber.toString().padStart(4, '0')} - #${endNumber.toString().padStart(4, '0')}`;

  const newBatch: Batch = {
    id: batchId,
    uid,
    name: finalBatchName,
    modelId,
    quantity,
    startNumber,
    endNumber,
    createdAt: now,
    plaqueCount: quantity,
  };

  const plaques: Plaque[] = [];
  const redirects: RedirectRecord[] = [];

  for (let i = 0; i < quantity; i++) {
    const seqNum = startNumber + i;
    const numFormatted = seqNum.toString().padStart(4, '0');
    const plaqueId = `plq_${batchId}_${numFormatted}`;
    const publicId = `${generateShortPublicId()}_${numFormatted}`;

    const plaque: Plaque = {
      id: plaqueId,
      uid,
      batchId,
      sequentialNumber: seqNum,
      numberFormatted: numFormatted,
      publicId,
      targetUrl: defaultTargetUrl,
      modelId,
      createdAt: now,
      updatedAt: now,
      clicks: 0,
    };
    plaques.push(plaque);

    const redirect: RedirectRecord = {
      publicId,
      plaqueId,
      ownerUid: uid,
      targetUrl: defaultTargetUrl,
      batchId,
      clicks: 0,
      active: true,
      updatedAt: now,
    };
    redirects.push(redirect);
  }

  // Atomically commit batch using Firestore writeBatch (supports up to 500 writes)
  // For quantities > 150, split into chunked batches
  const CHUNK_SIZE = 150; // Each plaque has 2 writes: plaque doc + redirect doc = 300 writes per chunk
  const chunks = [];
  for (let i = 0; i < plaques.length; i += CHUNK_SIZE) {
    chunks.push({
      plaquesChunk: plaques.slice(i, i + CHUNK_SIZE),
      redirectsChunk: redirects.slice(i, i + CHUNK_SIZE),
    });
  }

  try {
    // 1. Write the batch parent record first
    const firstWriteBatch = writeBatch(db);
    const batchDocRef = doc(db, 'users', uid, 'batches', batchId);
    firstWriteBatch.set(batchDocRef, newBatch);

    // Add first chunk of plaques and redirects
    const firstChunk = chunks[0];
    if (firstChunk) {
      firstChunk.plaquesChunk.forEach((plq) => {
        firstWriteBatch.set(doc(db, 'users', uid, 'plaques', plq.id), plq);
      });
      firstChunk.redirectsChunk.forEach((redir) => {
        firstWriteBatch.set(doc(db, 'redirects', redir.publicId), redir);
      });
    }
    await firstWriteBatch.commit();

    // 2. Commit subsequent chunks if quantity is large
    for (let c = 1; c < chunks.length; c++) {
      const chunkBatch = writeBatch(db);
      chunks[c].plaquesChunk.forEach((plq) => {
        chunkBatch.set(doc(db, 'users', uid, 'plaques', plq.id), plq);
      });
      chunks[c].redirectsChunk.forEach((redir) => {
        chunkBatch.set(doc(db, 'redirects', redir.publicId), redir);
      });
      await chunkBatch.commit();
    }

    return { batch: newBatch, plaques };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/batches/${batchId}`);
    throw error;
  }
}

/**
 * Updates a plaque's dynamic target destination without changing its QR code or ID
 */
export async function updatePlaqueDestination(
  uid: string,
  plaqueId: string,
  publicId: string,
  newTargetUrl: string
): Promise<void> {
  if (!isFirebaseConfigured) return;

  const cleanUrl = newTargetUrl.trim();
  const now = new Date().toISOString();

  try {
    // 1. Update plaque doc in user's subcollection
    const plaqueRef = doc(db, 'users', uid, 'plaques', plaqueId);
    await updateDoc(plaqueRef, {
      targetUrl: cleanUrl,
      updatedAt: now,
    });

    // 2. Update dynamic redirect record
    const redirectRef = doc(db, 'redirects', publicId);
    await updateDoc(redirectRef, {
      targetUrl: cleanUrl,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `redirects/${publicId}`);
  }
}

/**
 * Subscribes to buyer's batches in real time
 */
export function subscribeToBatches(
  uid: string,
  onBatches: (batches: Batch[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onBatches([]);
    return () => {};
  }

  const batchesRef = collection(db, 'users', uid, 'batches');
  const q = query(batchesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Batch[] = [];
      snapshot.forEach((d) => items.push(d.data() as Batch));
      onBatches(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/batches`);
    }
  );
}

/**
 * Subscribes to buyer's plaques in real time
 */
export function subscribeToPlaques(
  uid: string,
  onPlaques: (plaques: Plaque[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onPlaques([]);
    return () => {};
  }

  const plaquesRef = collection(db, 'users', uid, 'plaques');
  const q = query(plaquesRef, orderBy('sequentialNumber', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Plaque[] = [];
      snapshot.forEach((d) => items.push(d.data() as Plaque));
      onPlaques(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/plaques`);
    }
  );
}
