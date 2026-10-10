import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types';

export const INITIAL_ADMIN_EMAIL =
  import.meta.env.VITE_INITIAL_ADMIN_EMAIL || 'jeannmkt2@gmail.com';

/**
 * Checks if the email matches the authorized administrator identities
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === INITIAL_ADMIN_EMAIL.toLowerCase() ||
    clean === 'biofacilsistema@gmail.com'
  );
}

/**
 * Register a new user account.
 * Regular buyers start as 'pending'. The platform admin starts as 'approved'.
 */
export async function registerBuyer(
  name: string,
  email: string,
  pass: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  if (!isFirebaseConfigured) {
    throw new Error('O Firebase ainda não foi configurado pelo administrador.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const isAdmin = isAuthorizedAdminEmail(cleanEmail);

  // 1. Create Firebase Auth account
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  const uid = cred.user.uid;
  const now = new Date().toISOString();

  // 2. Prepare user profile document
  const profile: UserProfile = {
    uid,
    name: name.trim(),
    email: cleanEmail,
    status: isAdmin ? 'approved' : 'pending',
    role: isAdmin ? 'admin' : 'buyer',
    createdAt: now,
    updatedAt: now,
    approvedAt: isAdmin ? now : null,
  };

  // 3. Persist to Firestore users/{uid}
  try {
    await setDoc(doc(db, 'users', uid), {
      ...profile,
      serverCreatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }

  // 4. If this is an authorized admin, also provision /admins/{uid}
  if (isAdmin) {
    try {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        email: cleanEmail,
        assignedAt: now,
      });
    } catch {
      // Ignored
    }
  }

  return { user: cred.user, profile };
}

/**
 * Login with email and password
 */
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  if (!isFirebaseConfigured) {
    throw new Error('O Firebase ainda não foi configurado.');
  }
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  if (!isFirebaseConfigured) return;
  await firebaseSignOut(auth);
}

/**
 * Send password reset email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (!isFirebaseConfigured) {
    throw new Error('O Firebase ainda não foi configurado.');
  }
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Fetch or self-heal user profile from Firestore
 */
export async function fetchUserProfile(uid: string, email?: string | null): Promise<UserProfile | null> {
  if (!isFirebaseConfigured) return null;

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    // Self-healing: If user exists in Auth but document was missing
    if (email) {
      const now = new Date().toISOString();
      const isAdmin = isAuthorizedAdminEmail(email);
      const fallbackProfile: UserProfile = {
        uid,
        name: email.split('@')[0] || 'Comprador',
        email: email.toLowerCase(),
        status: isAdmin ? 'approved' : 'pending',
        role: isAdmin ? 'admin' : 'buyer',
        createdAt: now,
        updatedAt: now,
        approvedAt: isAdmin ? now : null,
      };

      await setDoc(userDocRef, fallbackProfile);

      if (isAdmin) {
        await setDoc(doc(db, 'admins', uid), {
          uid,
          email: email.toLowerCase(),
          assignedAt: now,
        });
      }

      return fallbackProfile;
    }

    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

/**
 * Securely verify if user has admin privileges
 */
export async function verifyAdminPrivileges(user: FirebaseUser | null): Promise<boolean> {
  if (!user || !isFirebaseConfigured) return false;

  // 1. Direct authorized admin email match
  if (isAuthorizedAdminEmail(user.email)) {
    return true;
  }

  // 2. Check /admins/{uid} registry
  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (adminSnap.exists()) return true;
  } catch {
    // Continue
  }

  // 3. Check /users/{uid} role
  try {
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    if (userSnap.exists() && userSnap.data()?.role === 'admin') {
      return true;
    }
  } catch {
    // Continue
  }

  return false;
}

/**
 * Bootstraps admin record in Firestore /admins/{uid}
 */
export async function bootstrapAdminRecord(user: FirebaseUser): Promise<void> {
  if (!isFirebaseConfigured || !user.email) return;
  if (!isAuthorizedAdminEmail(user.email)) {
    throw new Error('Apenas o e-mail oficial do administrador pode executar este bootstrap.');
  }

  const now = new Date().toISOString();
  await setDoc(doc(db, 'admins', user.uid), {
    uid: user.uid,
    email: user.email.toLowerCase(),
    assignedAt: now,
  });

  // Ensure user profile also has approved and admin status
  await setDoc(
    doc(db, 'users', user.uid),
    {
      role: 'admin',
      status: 'approved',
      updatedAt: now,
      approvedAt: now,
    },
    { merge: true }
  );
}
