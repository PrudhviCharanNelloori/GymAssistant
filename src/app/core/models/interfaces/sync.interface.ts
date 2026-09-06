export type SyncStatus = 'synced' | 'pending';

/** Fields added to local entities for cloud sync */
export type Syncable = {
  userId?: string;
  dirty?: boolean;
  deletedAt?: Date | null;
  syncStatus?: SyncStatus;
};

export type SyncState = {
  id: string; // 'cloud'
  userId: string | null;
  lastSyncedAt: Date | null;
  lastError: string | null;
  claimedLocalData: boolean;
};
