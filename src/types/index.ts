export type UserStatus = 'pending' | 'approved' | 'blocked';
export type UserRole = 'buyer' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
}

export interface Batch {
  id: string;
  uid: string;
  name: string;
  modelId: string;
  quantity: number;
  startNumber: number;
  endNumber: number;
  createdAt: string;
  plaqueCount: number;
}

export interface Plaque {
  id: string;
  uid: string;
  batchId: string;
  sequentialNumber: number;
  numberFormatted: string; // e.g. "0001"
  publicId: string; // unique short code for dynamic QR
  targetUrl: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  clicks: number;
}

export interface RedirectRecord {
  publicId: string;
  plaqueId: string;
  ownerUid: string;
  targetUrl: string;
  batchId: string;
  clicks: number;
  active: boolean;
  updatedAt: string;
}

export interface QRZoneConfig {
  x: number; // percentage 0-100 from left
  y: number; // percentage 0-100 from top
  size: number; // percentage 0-100 of total width
  coverColor: string; // background color patch to seamlessly wipe illustrative QR code
  coverPadding?: number; // extra padding in % around the cover patch
}

export interface NumberZoneConfig {
  x: number; // percentage 0-100 from left
  y: number; // percentage 0-100 from top
  fontSize: number; // in pixels relative to 1200x1200 canvas
  color: string;
  align: 'left' | 'center' | 'right';
  prefix: string; // e.g. "Nº " or "#"
}

export interface OfficialModel {
  id: string;
  name: string;
  number: number;
  description: string;
  imageUrl: string;
  qrZone: QRZoneConfig;
  numberZone: NumberZoneConfig;
}

export interface AdminAudit {
  id: string;
  adminUid: string;
  adminEmail: string;
  targetUid: string;
  targetEmail: string;
  action: 'approve_user' | 'block_user' | 'reactivate_user' | 'system_bootstrap';
  timestamp: string;
  details?: string;
}

export interface PlatformStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  blockedUsers: number;
  totalBatches: number;
  totalPlaques: number;
  totalRedirects: number;
}

export type OperationType = 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
