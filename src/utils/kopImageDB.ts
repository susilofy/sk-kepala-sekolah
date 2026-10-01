// IndexedDB Storage for Kop Surat Image
// IndexedDB provides hundreds of megabytes of quota, preventing all LocalStorage quota errors.

const DB_NAME = "sd_sk_kop_db";
const STORE_NAME = "kop_store";
const KOP_KEY = "active_default_kop";
const APP_MASTER_KOP_KEY = "app_master_default_kop";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const req = window.indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    req.onsuccess = () => {
      resolve(req.result);
    };

    req.onerror = () => {
      reject(req.error);
    };
  });

  return dbPromise;
}

export async function saveKopToIndexedDB(dataUrl: string): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, KOP_KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.warn("[IndexedDB] Gagal menyimpan kop:", e);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn("[IndexedDB] Tidak tersedia:", err);
    return false;
  }
}

export async function getKopFromIndexedDB(): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KOP_KEY);
      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function saveAppMasterDefaultKop(dataUrl: string): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, APP_MASTER_KOP_KEY);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.warn("[IndexedDB] Gagal menyimpan master default kop:", e);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn("[IndexedDB] Tidak tersedia:", err);
    return false;
  }
}

export async function getAppMasterDefaultKop(): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(APP_MASTER_KOP_KEY);
      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function removeKopFromIndexedDB(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req1 = store.delete(KOP_KEY);
      req1.onsuccess = () => resolve();
      req1.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}
