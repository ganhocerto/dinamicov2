import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types';
import {
  fetchUserProfile,
  verifyAdminPrivileges,
  bootstrapAdminRecord,
  logoutUser,
  INITIAL_ADMIN_EMAIL,
} from '../services/authService';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isFirebaseConfigured: boolean;
  isInitialAdminEmail: boolean;
  bootstrapAdmin: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isAdmin: false,
  loading: true,
  isFirebaseConfigured: false,
  isInitialAdminEmail: false,
  bootstrapAdmin: async () => {},
  refreshProfile: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const isInitialAdminEmail = Boolean(
    user?.email && user.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase()
  );

  const refreshProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setIsAdmin(false);
      return;
    }
    const profile = await fetchUserProfile(user.uid, user.email);
    setUserProfile(profile);
    const adminCheck = await verifyAdminPrivileges(user);
    setIsAdmin(adminCheck || isInitialAdminEmail);
  };

  const bootstrapAdmin = async () => {
    if (!user) return;
    await bootstrapAdminRecord(user);
    await refreshProfile();
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Initial fetch
        const profile = await fetchUserProfile(currentUser.uid, currentUser.email);
        setUserProfile(profile);
        const adminCheck = await verifyAdminPrivileges(currentUser);
        const matchInitial = Boolean(
          currentUser.email &&
          currentUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase()
        );
        setIsAdmin(adminCheck || matchInitial);

        // Attach real-time snapshot listener on user profile
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          unsubscribeSnapshot = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              const updatedProfile = snap.data() as UserProfile;
              setUserProfile(updatedProfile);
              if (updatedProfile.role === 'admin' || matchInitial) {
                setIsAdmin(true);
              }
            }
          }, (err) => {
            console.warn('Profile snapshot notice:', err);
          });
        } catch (err) {
          console.warn('Could not set profile snapshot:', err);
        }
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        setUserProfile(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        loading,
        isFirebaseConfigured,
        isInitialAdminEmail,
        bootstrapAdmin,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
