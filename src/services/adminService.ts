import {
  collection,
  doc,
  updateDoc,
  getDocs,
  onSnapshot,
  Unsubscribe,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile, UserStatus, PlatformStats, AdminAudit } from '../types';

/**
 * Subscribes to all registered users in real-time
 */
export function subscribeToAllUsers(
  onUsers: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    onUsers([]);
    return () => {};
  }

  const usersRef = collection(db, 'users');

  return onSnapshot(
    usersRef,
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => list.push(d.data() as UserProfile));
      // In-memory sort by creation timestamp desc
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      onUsers(list);
    },
    (error) => {
      console.error('Error on users onSnapshot:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  );
}

/**
 * Updates a user's approval status with audit logging
 */
export async function updateUserApprovalStatus(
  adminUid: string,
  adminEmail: string,
  targetUid: string,
  targetEmail: string,
  newStatus: UserStatus
): Promise<void> {
  if (!isFirebaseConfigured) return;

  const now = new Date().toISOString();
  const userRef = doc(db, 'users', targetUid);

  try {
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updatedAt: now,
    };
    if (newStatus === 'approved') {
      updatePayload.approvedAt = now;
    }

    await updateDoc(userRef, updatePayload);

    // Write audit log
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const actionType: AdminAudit['action'] =
      newStatus === 'approved' ? 'approve_user' : 'block_user';

    const auditDoc: AdminAudit = {
      id: auditId,
      adminUid,
      adminEmail,
      targetUid,
      targetEmail,
      action: actionType,
      timestamp: now,
      details: `Status alterado para ${newStatus} pelo administrador ${adminEmail}`,
    };

    await setDoc(doc(db, 'adminAudit', auditId), auditDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
  }
}

/**
 * Queries real platform statistics across collections
 */
export async function fetchPlatformStats(): Promise<PlatformStats> {
  if (!isFirebaseConfigured) {
    return {
      totalUsers: 0,
      pendingUsers: 0,
      approvedUsers: 0,
      blockedUsers: 0,
      totalBatches: 0,
      totalPlaques: 0,
      totalRedirects: 0,
    };
  }

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let pending = 0;
    let approved = 0;
    let blocked = 0;

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'pending') pending++;
      else if (data.status === 'approved') approved++;
      else if (data.status === 'blocked') blocked++;
    });

    const redirectsSnap = await getDocs(collection(db, 'redirects'));

    return {
      totalUsers: usersSnap.size,
      pendingUsers: pending,
      approvedUsers: approved,
      blockedUsers: blocked,
      totalBatches: 0,
      totalPlaques: redirectsSnap.size,
      totalRedirects: redirectsSnap.size,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'admin/stats');
    return {
      totalUsers: 0,
      pendingUsers: 0,
      approvedUsers: 0,
      blockedUsers: 0,
      totalBatches: 0,
      totalPlaques: 0,
      totalRedirects: 0,
    };
  }
}
