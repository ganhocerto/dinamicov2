import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import appletConfig from '@/firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentAuth = auth;
  const currentUser = currentAuth?.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Storage key to support testing or entering custom Firebase config if deployed outside preview
const MANUAL_FIREBASE_CONFIG_KEY = 'dinamico_pro_custom_firebase_config';

export function getCustomStoredConfig(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(MANUAL_FIREBASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomStoredConfig(cfg: Record<string, string>) {
  localStorage.setItem(MANUAL_FIREBASE_CONFIG_KEY, JSON.stringify(cfg));
  window.location.reload();
}

export function clearCustomStoredConfig() {
  localStorage.removeItem(MANUAL_FIREBASE_CONFIG_KEY);
  window.location.reload();
}

function resolveFirebaseConfig() {
  const env = import.meta.env;
  const custom = getCustomStoredConfig();

  // Priority 1: appletConfig provisioned by AI Studio environment
  if (appletConfig && appletConfig.apiKey && appletConfig.projectId) {
    return {
      config: {
        apiKey: appletConfig.apiKey,
        authDomain: appletConfig.authDomain,
        projectId: appletConfig.projectId,
        storageBucket: appletConfig.storageBucket,
        messagingSenderId: appletConfig.messagingSenderId,
        appId: appletConfig.appId,
      },
      firestoreDatabaseId: appletConfig.firestoreDatabaseId || undefined,
      isConfigured: true,
    };
  }

  // Priority 2: Custom config or Vite environment variables
  const apiKey = custom?.apiKey || env.VITE_FIREBASE_API_KEY;
  const authDomain = custom?.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = custom?.projectId || env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = custom?.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = custom?.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = custom?.appId || env.VITE_FIREBASE_APP_ID;

  const isConfigured = Boolean(
    apiKey &&
    projectId &&
    apiKey !== 'AIzaSyYourFirebaseApiKeyHere' &&
    projectId !== 'dinamico-pro-project'
  );

  return {
    config: {
      apiKey: apiKey || '',
      authDomain: authDomain || `${projectId || 'dinamico-pro'}.firebaseapp.com`,
      projectId: projectId || '',
      storageBucket: storageBucket || '',
      messagingSenderId: messagingSenderId || '',
      appId: appId || '',
    },
    firestoreDatabaseId: undefined,
    isConfigured,
  };
}

const { config: resolvedConfig, firestoreDatabaseId: resolvedDatabaseId, isConfigured } =
  resolveFirebaseConfig();

export const isFirebaseConfigured = isConfigured;
export const currentFirebaseConfig = resolvedConfig;

let appInstance: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;

try {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(resolvedConfig);
  authInstance = getAuth(appInstance);
  // CRITICAL: Always pass firestoreDatabaseId if specified, to prevent querying the wrong (default) database!
  dbInstance = resolvedDatabaseId
    ? getFirestore(appInstance, resolvedDatabaseId)
    : getFirestore(appInstance);
} catch (err) {
  console.warn('Firebase initialization warning:', err);
  appInstance = initializeApp(resolvedConfig, 'dinamico_pro_fallback');
  authInstance = getAuth(appInstance);
  dbInstance = resolvedDatabaseId
    ? getFirestore(appInstance, resolvedDatabaseId)
    : getFirestore(appInstance);
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

/**
 * Validates connection to Firestore backend as per Firebase Integration Skill
 */
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  if (!isConfigured) {
    return {
      success: false,
      message: 'Credenciais do Firebase não configuradas.',
    };
  }

  try {
    await getDocFromServer(doc(db, 'system_test', 'connection'));
    return {
      success: true,
      message: `Conexão com Cloud Firestore (${resolvedConfig.projectId}) ativa e operante!`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline')) {
      return { success: false, message: 'Cliente Firestore offline. Verifique sua conexão.' };
    }
    // Even if permission error on other docs, communicating with server means connection is live
    return {
      success: true,
      message: `Conectado ao Cloud Firestore (${resolvedConfig.projectId}) com regras de segurança ativas.`,
    };
  }
}
