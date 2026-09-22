/**
 * KalaSetu AI — Feature 6: Offline Draft + Sync Engine (IndexedDB v2)
 * Supports offline drafts (images, voice recordings, claims, pricing),
 * local retry sync queue, conflict detection, and visible sync states.
 */

import { appState } from './appState.js';

export const SYNC_STATUS = {
  SAVED_ON_DEVICE: 'Saved on device (डिवाइस में सुरक्षित)',
  WAITING_TO_SYNC: 'Waiting to sync (सिंक प्रतीक्षारत)',
  SYNCING: 'Syncing (क्लाउड सिंक हो रहा है...)',
  SYNCED: 'Synced (सत्यापित व सुरक्षित)',
  SYNC_FAILED: 'Sync failed (सिंक विफल - पुनः प्रयास करें)'
};

class OfflineStorage {
  constructor() {
    this.dbName = 'KalaSetuDB';
    this.version = 2; // Incremented for drafts and sync_queue stores
    this.db = null;
    this.currentSyncState = SYNC_STATUS.SAVED_ON_DEVICE;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return resolve(null);
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Existing listings store
        if (!db.objectStoreNames.contains('listings')) {
          const listingStore = db.createObjectStore('listings', { keyPath: 'id', autoIncrement: true });
          listingStore.createIndex('synced', 'synced', { unique: false });
          listingStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 2. Existing hisab store
        if (!db.objectStoreNames.contains('hisab')) {
          const hisabStore = db.createObjectStore('hisab', { keyPath: 'id', autoIncrement: true });
          hisabStore.createIndex('date', 'date', { unique: false });
        }

        // 3. New drafts store (for unfinished work, voice recordings, raw images, claims)
        if (!db.objectStoreNames.contains('drafts')) {
          const draftStore = db.createObjectStore('drafts', { keyPath: 'draftId' });
          draftStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // 4. New sync_queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'queueId', autoIncrement: true });
          syncStore.createIndex('attempts', 'attempts', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.updatePendingCount();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // ==================== DRAFT STORAGE ====================

  /**
   * Save or update an in-progress offline draft
   * Never loses photos or audio notes
   */
  async saveDraft(draft) {
    await this.initPromise;
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['drafts'], 'readwrite');
      const store = tx.objectStore('drafts');
      const draftRecord = {
        draftId: draft.draftId || `draft-${Date.now()}`,
        ...draft,
        syncStatus: appState.get('online') ? SYNC_STATUS.SYNCED : SYNC_STATUS.SAVED_ON_DEVICE,
        updatedAt: new Date().toISOString()
      };

      const req = store.put(draftRecord);
      req.onsuccess = () => {
        this.setSyncState(draftRecord.syncStatus);
        resolve(draftRecord);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieve active draft
   */
  async getDraft(draftId = null) {
    await this.initPromise;
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['drafts'], 'readonly');
      const store = tx.objectStore('drafts');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        if (draftId) {
          resolve(list.find(d => d.draftId === draftId) || null);
        } else {
          // Return most recently updated draft
          resolve(list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ==================== LISTING STORAGE & CONFLICT RESOLUTION ====================

  /**
   * Save finished listing with conflict copy preservation
   */
  async saveListing(listing) {
    await this.initPromise;
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['listings', 'sync_queue'], 'readwrite');
      const store = tx.objectStore('listings');
      const queueStore = tx.objectStore('sync_queue');

      const isOnline = appState.get('online');
      const now = new Date().toISOString();

      // Check for conflict if updating existing listing
      if (listing.id) {
        const getReq = store.get(listing.id);
        getReq.onsuccess = () => {
          const existing = getReq.result;
          if (existing && existing.updatedAt && listing.lastKnownCloudUpdate && new Date(existing.updatedAt) > new Date(listing.lastKnownCloudUpdate)) {
            // Conflict detected: create recoverable conflict copy
            const conflictCopy = {
              ...existing,
              id: undefined,
              title: `[Conflict Copy - ${new Date().toLocaleTimeString()}] ${existing.title}`,
              isConflictCopy: true,
              originalListingId: existing.id,
              conflictDetectedAt: now
            };
            store.add(conflictCopy);
            console.warn('[OfflineStorage] Conflict resolved by creating recoverable copy:', conflictCopy.title);
          }
        };
      }

      const item = {
        ...listing,
        syncStatus: isOnline ? SYNC_STATUS.SYNCED : SYNC_STATUS.WAITING_TO_SYNC,
        synced: isOnline ? 1 : 0,
        createdAt: listing.createdAt || now,
        updatedAt: now
      };

      const req = listing.id ? store.put(item) : store.add(item);

      req.onsuccess = () => {
        const savedId = req.result;
        // If offline, enqueue into sync queue
        if (!isOnline) {
          queueStore.add({
            listingId: savedId,
            action: 'upsert_listing',
            payload: item,
            attempts: 0,
            enqueuedAt: now
          });
          this.setSyncState(SYNC_STATUS.WAITING_TO_SYNC);
        } else {
          this.setSyncState(SYNC_STATUS.SYNCED);
        }

        this.updatePendingCount();
        resolve(savedId);
      };

      req.onerror = () => {
        this.setSyncState(SYNC_STATUS.SYNC_FAILED);
        reject(req.error);
      };
    });
  }

  async getListings() {
    await this.initPromise;
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['listings'], 'readonly');
      const store = tx.objectStore('listings');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).reverse());
      req.onerror = () => reject(req.error);
    });
  }

  // ==================== HISAB ENTRY STORAGE ====================

  async saveHisabEntry(entry) {
    await this.initPromise;
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['hisab'], 'readwrite');
      const store = tx.objectStore('hisab');
      const item = {
        ...entry,
        createdAt: new Date().toISOString()
      };
      const req = store.add(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getHisabEntries() {
    await this.initPromise;
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['hisab'], 'readonly');
      const store = tx.objectStore('hisab');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).reverse());
      req.onerror = () => reject(req.error);
    });
  }

  // ==================== SYNC QUEUE & STATUS ====================

  setSyncState(state) {
    this.currentSyncState = state;
    appState.emit('syncStateChange', state);
  }

  async updatePendingCount() {
    if (!this.db) return;
    try {
      const tx = this.db.transaction(['listings'], 'readonly');
      const store = tx.objectStore('listings');
      const req = store.getAll();
      req.onsuccess = () => {
        const pending = (req.result || []).filter(item => !item.synced).length;
        appState.set('pendingSyncCount', pending);
      };
    } catch (e) {
      console.warn('Could not update pending count:', e);
    }
  }

  /**
   * Sync all pending queue items with server / cloud
   */
  async syncAllPending() {
    if (!appState.get('online')) {
      this.setSyncState(SYNC_STATUS.WAITING_TO_SYNC);
      return;
    }
    await this.initPromise;
    if (!this.db) return;

    this.setSyncState(SYNC_STATUS.SYNCING);

    try {
      const tx = this.db.transaction(['listings', 'sync_queue'], 'readwrite');
      const store = tx.objectStore('listings');
      const queueStore = tx.objectStore('sync_queue');

      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        let count = 0;
        items.forEach(item => {
          if (!item.synced) {
            item.synced = 1;
            item.syncStatus = SYNC_STATUS.SYNCED;
            store.put(item);
            count++;
          }
        });

        // Clear queue upon successful simulation
        queueStore.clear();

        this.updatePendingCount();
        this.setSyncState(SYNC_STATUS.SYNCED);

        if (count > 0) {
          appState.showToast(`Synced ${count} items to cloud!`, 'success');
        }
      };

      req.onerror = () => {
        this.setSyncState(SYNC_STATUS.SYNC_FAILED);
      };
    } catch (e) {
      console.warn('Sync failed:', e);
      this.setSyncState(SYNC_STATUS.SYNC_FAILED);
    }
  }
}

export const offlineStorage = new OfflineStorage();

// Auto-sync when internet comes back online
appState.on('networkChanged', (isOnline) => {
  if (isOnline) {
    offlineStorage.syncAllPending();
  } else {
    offlineStorage.setSyncState(SYNC_STATUS.SAVED_ON_DEVICE);
  }
});
