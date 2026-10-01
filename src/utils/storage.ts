// Safe Storage, Image Optimization & IndexedDB Integration
// Solves browser LocalStorage quota limits permanently by offloading large image data to IndexedDB

import { DefaultSKParams, SKDocument } from "../types";
import {
  saveKopToIndexedDB,
  getKopFromIndexedDB,
  saveAppMasterDefaultKop,
  getAppMasterDefaultKop,
  removeKopFromIndexedDB,
} from "./kopImageDB";

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;

    // JIKA MENYIMPAN KOP SURAT BERUKURAN BESAR, ALIHAKAN KE INDEXEDDB
    if (key === "sd_default_kop_surat") {
      if (value && value.length > 500) {
        // Simpan ke IndexedDB yang memiliki kuota ratusan MB
        saveKopToIndexedDB(value).catch(() => {});
        // Di localStorage cukup simpan penanda ringan agar tidak memenuhi kuota
        try {
          window.localStorage.setItem(key, "indexeddb:active");
        } catch {
          // Abaikan jika quota tetap ketat
        }
        return true;
      }
    }

    // JIKA MENYIMPAN PROFIL SEKOLAH, PASTIKAN KOP TIDAK MEMBEBANI LOCALSTORAGE
    if (key === "sd_school_profile") {
      try {
        const parsed = JSON.parse(value);
        if (parsed.kopSuratUrl && parsed.kopSuratUrl.length > 500) {
          saveKopToIndexedDB(parsed.kopSuratUrl).catch(() => {});
          // Ringankan profil di localStorage
          const lightweightProfile = { ...parsed, kopSuratUrl: "indexeddb:active" };
          window.localStorage.setItem(key, JSON.stringify(lightweightProfile));
          return true;
        }
      } catch {
        // Lanjutkan simpan normal jika bukan JSON
      }
    }

    window.localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[safeStorage] Kuota LocalStorage penuh untuk '${key}', mengalihkan...`);
    try {
      // Bersihkan entri duplikat lama yang membengkak
      cleanupLegacyStorageBloat();
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

export function safeRemoveItem(key: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * Membersihkan data lama berukuran besar di localStorage
 * dan memindahkannya ke IndexedDB agar kuota localStorage kembali lega.
 */
export function cleanupLegacyStorageBloat(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;

    // 1. Cek sd_default_kop_surat
    const oldKop = window.localStorage.getItem("sd_default_kop_surat");
    if (oldKop && oldKop.length > 500 && !oldKop.startsWith("indexeddb:")) {
      saveKopToIndexedDB(oldKop).catch(() => {});
      window.localStorage.setItem("sd_default_kop_surat", "indexeddb:active");
    }

    // 2. Cek sd_school_profile
    const oldProfileStr = window.localStorage.getItem("sd_school_profile");
    if (oldProfileStr) {
      try {
        const prof = JSON.parse(oldProfileStr);
        if (prof.kopSuratUrl && prof.kopSuratUrl.length > 500 && !prof.kopSuratUrl.startsWith("indexeddb:")) {
          saveKopToIndexedDB(prof.kopSuratUrl).catch(() => {});
          prof.kopSuratUrl = "indexeddb:active";
          window.localStorage.setItem("sd_school_profile", JSON.stringify(prof));
        }
      } catch {
        // Ignore
      }
    }

    // 3. Cek sd_custom_default_data
    const oldMasterStr = window.localStorage.getItem("sd_custom_default_data");
    if (oldMasterStr) {
      try {
        const master = JSON.parse(oldMasterStr);
        if (
          master?.schoolProfile?.kopSuratUrl &&
          master.schoolProfile.kopSuratUrl.length > 500 &&
          !master.schoolProfile.kopSuratUrl.startsWith("indexeddb:")
        ) {
          saveKopToIndexedDB(master.schoolProfile.kopSuratUrl).catch(() => {});
          master.schoolProfile.kopSuratUrl = "indexeddb:active";
          window.localStorage.setItem("sd_custom_default_data", JSON.stringify(master));
        }
      } catch {
        // Ignore
      }
    }
  } catch {
    // Ignore
  }
}

/**
 * Mengambil kop surat aktif secara cerdas:
 * 1. Periksa IndexedDB (kop aktif pengguna).
 * 2. Periksa IndexedDB (kop master default bawaan aplikasi yang dikunci pengguna).
 * 3. Periksa localStorage / custom master data.
 * 4. Fallback ke gambar standar jika belum ada kop yang diunggah.
 */
export async function loadActiveKopImage(fallbackDefault = ""): Promise<string> {
  // 1. Coba ambil dari master default bawaan yang disimpan pengguna di IndexedDB (Prioritas Tertinggi)
  try {
    const fromMasterIdb = await getAppMasterDefaultKop();
    if (fromMasterIdb && fromMasterIdb.length > 50) {
      saveKopToIndexedDB(fromMasterIdb).catch(() => {});
      return fromMasterIdb;
    }
  } catch {
    // Lanjutkan
  }

  // 2. Coba ambil dari IndexedDB (kop aktif pengguna)
  try {
    const fromIdb = await getKopFromIndexedDB();
    if (fromIdb && fromIdb.length > 50) {
      return fromIdb;
    }
  } catch {
    // Lanjutkan
  }

  // 3. Coba ambil dari server API bawaan jika ada custom kop tersimpan
  try {
    const res = await fetch("/api/kop/default");
    if (res.ok) {
      const data = await res.json();
      if (data.kopSuratUrl && data.kopSuratUrl.length > 50) {
        saveKopToIndexedDB(data.kopSuratUrl).catch(() => {});
        saveAppMasterDefaultKop(data.kopSuratUrl).catch(() => {});
        return data.kopSuratUrl;
      }
    }
  } catch {
    // Lanjutkan
  }

  // 4. Coba ambil dari localStorage jika berupa data valid (bukan penanda idb)
  const fromStorage = safeGetItem("sd_default_kop_surat");
  if (fromStorage && !fromStorage.startsWith("indexeddb:") && fromStorage.length > 50) {
    saveKopToIndexedDB(fromStorage).catch(() => {});
    saveAppMasterDefaultKop(fromStorage).catch(() => {});
    safeSetItem("sd_default_kop_surat", "indexeddb:active");
    return fromStorage;
  }

  // 5. Cek sd_custom_default_data
  const customDataRaw = safeGetItem("sd_custom_default_data");
  if (customDataRaw) {
    try {
      const custom = JSON.parse(customDataRaw);
      if (
        custom?.schoolProfile?.kopSuratUrl &&
        !custom.schoolProfile.kopSuratUrl.startsWith("indexeddb:") &&
        custom.schoolProfile.kopSuratUrl.length > 50
      ) {
        saveKopToIndexedDB(custom.schoolProfile.kopSuratUrl).catch(() => {});
        saveAppMasterDefaultKop(custom.schoolProfile.kopSuratUrl).catch(() => {});
        return custom.schoolProfile.kopSuratUrl;
      }
    } catch {}
  }

  return fallbackDefault;
}

/**
 * Menyimpan gambar kop surat ke IndexedDB secara aman dan sinkronkan penanda.
 */
export async function saveActiveKopImage(dataUrl: string): Promise<void> {
  try {
    await saveKopToIndexedDB(dataUrl);
    safeSetItem("sd_default_kop_surat", "indexeddb:active");
  } catch (err) {
    console.warn("Gagal menyimpan ke IndexedDB:", err);
  }
}

/**
 * Menyimpan gambar kop surat sebagai bawaan aplikasi permanen (Master Default Kop).
 * Menyimpan ke IndexedDB, LocalStorage, dan ke Server Codebase agar menjadi bawaan resmi aplikasi.
 */
export async function saveKopAsAppDefault(dataUrl: string): Promise<boolean> {
  try {
    // 1. Simpan ke IndexedDB untuk aktif dan master bawaan
    await saveKopToIndexedDB(dataUrl);
    await saveAppMasterDefaultKop(dataUrl);

    // 2. Tandai di localStorage
    safeSetItem("sd_default_kop_surat", "indexeddb:active");
    safeSetItem("sd_has_custom_default_kop", "true");

    // 3. Sinkronkan ke master data bawaan sd_custom_default_data
    const masterRaw = safeGetItem("sd_custom_default_data");
    let master: any = {};
    if (masterRaw) {
      try {
        master = JSON.parse(masterRaw);
      } catch {}
    }
    if (!master.schoolProfile) {
      master.schoolProfile = {};
    }
    master.schoolProfile.kopSuratUrl = "indexeddb:active";
    master.schoolProfile.kopMode = "gambar";
    master.hasCustomKop = true;
    safeSetItem("sd_custom_default_data", JSON.stringify(master));

    // 4. Sinkronkan ke server endpoint agar tersimpan permanen di codebase
    if (dataUrl && dataUrl.length > 50) {
      try {
        await fetch("/api/kop/set-default", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kopSuratUrl: dataUrl }),
        });
      } catch (e) {
        console.warn("Gagal sinkronisasi kop ke server:", e);
      }
    }

    return true;
  } catch (err) {
    console.error("Gagal menyimpan kop sebagai bawaan aplikasi:", err);
    return false;
  }
}

/**
 * Mengambil kop master default bawaan aplikasi yang tersimpan
 */
export async function getAppMasterKopImage(): Promise<string | null> {
  try {
    const fromMasterIdb = await getAppMasterDefaultKop();
    if (fromMasterIdb && fromMasterIdb.length > 50) {
      return fromMasterIdb;
    }
  } catch {}
  return null;
}

/**
 * Mengoptimalkan ukuran gambar Kop Surat (JPG/PNG).
 * Menyesuaikan resolusi agar tajam untuk cetak A4 (lebar 1200px)
 * namun menjaga ukuran data base64 tetap kecil (~50KB-120KB).
 */
export async function optimizeKopImage(
  fileOrBase64: File | string,
  maxWidth = 1200,
  maxHeight = 350
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Jika input adalah string SVG, tidak perlu kompresi canvas
    if (typeof fileOrBase64 === "string" && fileOrBase64.includes("image/svg+xml")) {
      resolve(fileOrBase64);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(width, 100);
        canvas.height = Math.max(height, 50);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          if (typeof fileOrBase64 === "string") resolve(fileOrBase64);
          else {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = reject;
            r.readAsDataURL(fileOrBase64);
          }
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const optimizedUrl = canvas.toDataURL("image/png");
        resolve(optimizedUrl);
      } catch (err) {
        console.warn("Gagal optimasi canvas, menggunakan gambar asli:", err);
        if (typeof fileOrBase64 === "string") {
          resolve(fileOrBase64);
        } else {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(fileOrBase64);
        }
      }
    };

    img.onerror = () => {
      reject(new Error("Gagal membaca berkas gambar"));
    };

    if (typeof fileOrBase64 === "string") {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
    }
  });
}

export const initialDefaultSKParams: DefaultSKParams = {
  tahunAjaran: "2025/2026",
  tanggalTetap: "19 Juni 2025",
  tempatTetap: "Loloan Timur",
  tanggalRapat: "18 Juni 2025 tentang Pembagian Tugas Guru dalam kegiatan proses belajar mengajar atau bimbingan dan tugas tenaga kependidikan di SD Negeri 3 Loloan Timur Tahun Ajaran 2025/2026",
  memperhatikan: "Saran, usul dan Keputusan Rapat Dewan Guru SD Negeri 3 Loloan Timur tanggal 18 Juni 2025 tentang Pembagian Tugas Guru dalam kegiatan proses belajar mengajar atau bimbingan dan tugas tenaga kependidikan di SD Negeri 3 Loloan Timur Tahun Ajaran 2025/2026",
};

/**
 * Mengambil parameter bawaan SK (Tahun Ajaran, Tanggal Penetapan, Tanggal & Rapat Dewan Guru)
 * dengan urutan prioritas:
 * 1. sd_default_sk_params di localStorage
 * 2. sd_custom_default_data jika pernah disimpan pengguna
 * 3. fallbackDoc (dokumen SK pertama pengguna yang ada di sistem)
 * 4. initialDefaultSKParams
 */
export function getSavedDefaultSKParams(fallbackDoc?: SKDocument): DefaultSKParams {
  // 1. Cek penyimpanan parameter bawaan spesifik
  const raw = safeGetItem("sd_default_sk_params");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.tahunAjaran || parsed.tanggalTetap || parsed.tanggalRapat) {
        return {
          ...initialDefaultSKParams,
          ...parsed,
        };
      }
    } catch {}
  }

  // 2. Cek dari master default (sd_custom_default_data)
  const masterRaw = safeGetItem("sd_custom_default_data");
  if (masterRaw) {
    try {
      const master = JSON.parse(masterRaw);
      if (master.defaultSKParams) {
        return {
          ...initialDefaultSKParams,
          ...master.defaultSKParams,
        };
      }
      if (master.documents && master.documents.length > 0) {
        const d0 = master.documents[0];
        return {
          tahunAjaran: d0.tahunAjaran || initialDefaultSKParams.tahunAjaran,
          tanggalTetap: d0.tanggalTetap || initialDefaultSKParams.tanggalTetap,
          tempatTetap: d0.tempatTetap || initialDefaultSKParams.tempatTetap,
          tanggalRapat: d0.tanggalRapat || d0.memperhatikan || initialDefaultSKParams.tanggalRapat,
          memperhatikan: d0.memperhatikan || initialDefaultSKParams.memperhatikan,
        };
      }
    } catch {}
  }

  // 3. Cek dari dokumen pertama user yang tersimpan di sd_sk_documents
  if (fallbackDoc) {
    return {
      tahunAjaran: fallbackDoc.tahunAjaran || initialDefaultSKParams.tahunAjaran,
      tanggalTetap: fallbackDoc.tanggalTetap || initialDefaultSKParams.tanggalTetap,
      tempatTetap: fallbackDoc.tempatTetap || initialDefaultSKParams.tempatTetap,
      tanggalRapat: fallbackDoc.tanggalRapat || fallbackDoc.memperhatikan || initialDefaultSKParams.tanggalRapat,
      memperhatikan: fallbackDoc.memperhatikan || initialDefaultSKParams.memperhatikan,
    };
  }

  return initialDefaultSKParams;
}

/**
 * Menyimpan parameter bawaan SK secara persisten agar selalu menjadi nilai bawaan
 * saat membuat SK baru maupun saat reset ke default.
 */
export function saveDefaultSKParams(params: Partial<DefaultSKParams>): void {
  const current = getSavedDefaultSKParams();
  const updated: DefaultSKParams = {
    ...current,
    ...params,
  };
  safeSetItem("sd_default_sk_params", JSON.stringify(updated));

  // Sinkronkan ke sd_custom_default_data jika ada
  const masterRaw = safeGetItem("sd_custom_default_data");
  if (masterRaw) {
    try {
      const master = JSON.parse(masterRaw);
      master.defaultSKParams = updated;
      safeSetItem("sd_custom_default_data", JSON.stringify(master));
    } catch {}
  }
}

/**
 * Mengirim seluruh data aplikasi ke server untuk disimpan sebagai data bawaan resmi aplikasi
 */
export async function saveAppDefaultsToServer(payload: {
  schoolProfile?: any;
  employees?: any[];
  documents?: any[];
  numberingConfig?: any;
  defaultSKParams?: any;
  kopSuratUrl?: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/save-app-defaults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn("Gagal sinkronisasi data bawaan ke server:", err);
    return false;
  }
}

/**
 * Mengambil data bawaan aplikasi dari server
 */
export async function loadAppDefaultsFromServer(): Promise<any | null> {
  try {
    const res = await fetch("/api/app-defaults");
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.defaults) {
        return data.defaults;
      }
    }
  } catch (err) {
    console.warn("Gagal memuat data bawaan dari server:", err);
  }
  return null;
}

/**
 * Menyimpan seluruh data hasil pengisian & penghapusan pengguna (Profil Sekolah, GTK, Dokumen SK, Penomoran, Kop)
 * sebagai DATA BAWAAN RESMI APLIKASI (Master Default).
 * Menyimpan ke localStorage, IndexedDB, dan ke Server (appDefaults.json & defaultKopImage.ts).
 */
export async function saveAllStateAsAppMasterDefault(params: {
  schoolProfile: any;
  employees: any[];
  documents: any[];
  numberingConfig: any;
  defaultSKParams?: any;
}): Promise<boolean> {
  try {
    // 1. Ambil data gambar kop surat aktif
    const activeKop = await loadActiveKopImage(params.schoolProfile?.kopSuratUrl || "");
    if (activeKop && activeKop.length > 50 && !activeKop.startsWith("indexeddb:")) {
      await saveKopAsAppDefault(activeKop);
    }

    const masterData = {
      savedAt: new Date().toISOString(),
      schoolProfile: {
        ...params.schoolProfile,
        kopSuratUrl: "indexeddb:active",
        kopMode: "gambar",
      },
      employees: params.employees,
      documents: params.documents,
      numberingConfig: params.numberingConfig,
      defaultSKParams: params.defaultSKParams,
    };

    // 2. Simpan ke local storage
    safeSetItem("sd_custom_default_data", JSON.stringify(masterData));
    safeSetItem("sd_school_profile", JSON.stringify(params.schoolProfile));
    safeSetItem("sd_employees", JSON.stringify(params.employees));
    safeSetItem("sd_sk_documents", JSON.stringify(params.documents));
    safeSetItem("sd_numbering_config", JSON.stringify(params.numberingConfig));

    // 3. Simpan ke server
    await saveAppDefaultsToServer({
      ...params,
      kopSuratUrl: activeKop,
    });

    return true;
  } catch (err) {
    console.error("Gagal menyimpan seluruh state sebagai default aplikasi:", err);
    return false;
  }
}

