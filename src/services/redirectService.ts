import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { RedirectRecord } from '../types';

export interface RedirectLookupResult {
  found: boolean;
  targetUrl?: string;
  active?: boolean;
  error?: string;
}

/**
 * Sanitizes and validates a redirection destination URL
 */
export function sanitizeRedirectUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Block javascript: or data: dangerous protocols
  if (
    trimmed.toLowerCase().startsWith('javascript:') ||
    trimmed.toLowerCase().startsWith('data:') ||
    trimmed.toLowerCase().startsWith('vbscript:')
  ) {
    return null;
  }

  // Ensure standard protocol
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed;
  }

  // Prepend https:// if user provided plain domain (e.g. instagram.com/user)
  if (trimmed.includes('.') && !trimmed.includes('://')) {
    return `https://${trimmed}`;
  }

  return null;
}

/**
 * Public dynamic redirect resolver
 * Doesn't require user login!
 */
export async function resolveDynamicRedirect(
  publicId: string
): Promise<RedirectLookupResult> {
  if (!publicId || !isFirebaseConfigured) {
    return {
      found: false,
      error: 'Serviço de redirecionamento temporariamente indisponível.',
    };
  }

  try {
    const redirectRef = doc(db, 'redirects', publicId);
    const snap = await getDoc(redirectRef);

    if (!snap.exists()) {
      return {
        found: false,
        error: 'QR Code não encontrado ou identificador inválido.',
      };
    }

    const data = snap.data() as RedirectRecord;

    if (data.active === false) {
      return {
        found: false,
        error: 'Este QR Code foi temporariamente desativado pelo proprietário.',
      };
    }

    const validUrl = sanitizeRedirectUrl(data.targetUrl);
    if (!validUrl) {
      return {
        found: false,
        error: 'O destino cadastrado para este QR Code é inválido.',
      };
    }

    // Safely increment click counter in background
    try {
      updateDoc(redirectRef, {
        clicks: increment(1),
        lastClickAt: new Date().toISOString(),
      }).catch(() => {});
    } catch {
      // Fire and forget
    }

    return {
      found: true,
      targetUrl: validUrl,
      active: true,
    };
  } catch (err) {
    console.error('Error resolving dynamic redirect:', err);
    return {
      found: false,
      error: 'Falha na comunicação com o banco de redirecionamento.',
    };
  }
}
