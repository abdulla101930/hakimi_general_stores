import { db, isConfigured } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { OWNER_PHONE_DISPLAY } from './constants';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  timestampMs: number;
  action:
    | 'PRODUCT_ADDED'
    | 'PRODUCT_UPDATED'
    | 'PRODUCT_DELETED'
    | 'ORDER_STATUS_CHANGED'
    | 'DELIVERY_THRESHOLD_UPDATED'
    | 'DELIVERY_SETTINGS_UPDATED'
    | 'MAINTENANCE_MODE_TOGGLED'
    | 'OWNER_LOGIN';
  actor: string;
  details: Record<string, unknown>;
}

const LOCAL_LOGS_KEY = 'hakimi_dev_audit_logs';

const nowIso = () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

export const logOwnerAction = async (
  action: AuditLogEntry['action'],
  details: Record<string, unknown>,
  actor: string = OWNER_PHONE_DISPLAY
): Promise<void> => {
  const now = new Date();
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: nowIso(),
    timestampMs: now.getTime(),
    action,
    actor,
    details
  };

  try {
    const existing = getLocalAuditLogs();
    const updated = [entry, ...existing].slice(0, 500);
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updated));
  } catch {
    /* noop */
  }

  if (isConfigured) {
    try {
      await addDoc(collection(db, 'audit_logs'), entry);
    } catch {
      /* noop */
    }
  }

  console.log(`%c[DEVELOPER AUDIT LOG] %c${action}`, 'color: #3b82f6; font-weight: bold;', 'color: #10b981; font-weight: bold;', {
    actor,
    timestamp: entry.timestamp,
    details
  });
};

export const getLocalAuditLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const fetchRemoteAuditLogs = async (): Promise<AuditLogEntry[]> => {
  if (!isConfigured) return getLocalAuditLogs();
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestampMs', 'desc'), limit(200));
    const querySnapshot = await getDocs(q);
    const logs: AuditLogEntry[] = [];
    querySnapshot.forEach((doc) => {
      logs.push(doc.data() as AuditLogEntry);
    });
    return logs.length > 0 ? logs : getLocalAuditLogs();
  } catch {
    return getLocalAuditLogs();
  }
};

export const clearLocalAuditLogs = (): void => {
  try {
    localStorage.removeItem(LOCAL_LOGS_KEY);
  } catch {
    /* noop */
  }
};
