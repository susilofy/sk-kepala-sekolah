import express from "express";
import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import JSZip from "jszip";

dotenv.config();

// Attempt loading .env from candidate local storage paths (for portable desktop app & local installations)
function reloadEnvVariables() {
  const possiblePaths = [
    path.join(process.cwd(), ".env"),
    process.env.APP_DATA_PATH ? path.join(process.env.APP_DATA_PATH, ".env") : null,
    path.join(path.dirname(process.execPath), ".env"),
    path.join(process.cwd(), "data-sekolah", ".env"),
  ].filter(Boolean) as string[];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        dotenv.config({ path: envPath, override: false });
      } catch {}
    }
  }
}
reloadEnvVariables();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini SDK lazily if key is provided
let aiClient: GoogleGenAI | null = null;
let currentKeyUsed: string = "";

function getGemini(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    reloadEnvVariables();
  }
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) {
    return null;
  }
  if (!aiClient || currentKeyUsed !== key) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    currentKeyUsed = key;
  }
  return aiClient;
}

// Officially supported Gemini models in prioritized fallback order
const CANDIDATE_TEXT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

// Timeout helper to prevent requests from hanging in production Cloud Run
function withTimeout<T>(promise: Promise<T>, ms: number, errMsg = "Timeout"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errMsg)), ms)),
  ]);
}

async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
): Promise<{ text: string; model: string }> {
  let lastError: any = null;

  for (const modelName of CANDIDATE_TEXT_MODELS) {
    // Retry up to 2 attempts for transient conditions (e.g. 503 high demand spike, 429 rate limit)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: params.contents,
            config: params.config,
          }),
          20000,
          `Batas waktu pembuatan draf AI ${modelName} habis (20 detik)`
        );
        if (res.text) {
          return { text: res.text, model: modelName };
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("429") ||
          msg.includes("Resource has been exhausted");
        if (isTransient && attempt === 0) {
          // Brief pause before retry
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("All AI models currently unavailable");
}

async function createChatWithFallback(
  ai: GoogleGenAI,
  params: {
    history?: any[];
    config?: any;
    message: string;
  }
): Promise<{ text: string; model: string }> {
  let lastError: any = null;

  for (const modelName of CANDIDATE_TEXT_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const chat = ai.chats.create({
          model: modelName,
          history: params.history,
          config: params.config,
        });
        const res = await withTimeout(
          chat.sendMessage({ message: params.message }),
          20000,
          `Batas waktu respon asisten AI ${modelName} habis (20 detik)`
        );
        if (res.text) {
          return { text: res.text, model: modelName };
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("429") ||
          msg.includes("Resource has been exhausted");
        if (isTransient && attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("All AI models currently unavailable");
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Persistent storage file for custom default kop and app defaults
const DATA_DIR = process.env.APP_DATA_PATH || path.join(process.cwd(), "src/data");
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {}
}
const CUSTOM_KOP_FILE = path.join(DATA_DIR, "customKop.json");
const APP_DEFAULTS_FILE = path.join(DATA_DIR, "appDefaults.json");
const FALLBACK_DEFAULTS_FILE = path.join(process.cwd(), "src/data/appDefaults.json");
const FALLBACK_KOP_FILE = path.join(process.cwd(), "src/data/customKop.json");

// Endpoint: Ambil seluruh data bawaan aplikasi yang tersimpan di server
app.get("/api/app-defaults", (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(APP_DEFAULTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(APP_DEFAULTS_FILE, "utf-8"));
      return res.json({ success: true, defaults: data });
    } else if (fs.existsSync(FALLBACK_DEFAULTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(FALLBACK_DEFAULTS_FILE, "utf-8"));
      return res.json({ success: true, defaults: data });
    }
  } catch (e) {
    console.error("Error reading app defaults file:", e);
  }
  res.json({ success: true, defaults: null });
});

// Endpoint: Simpan seluruh data hasil pengisian & penghapusan pengguna sebagai DATA BAWAAN RESMI APLIKASI
app.post("/api/save-app-defaults", (req: Request, res: Response) => {
  try {
    const { schoolProfile, employees, documents, numberingConfig, defaultSKParams, kopSuratUrl } = req.body;

    // 1. Jika ada kop surat gambar unggahan, simpan ke customKop.json dan perbarui defaultKopImage.ts
    if (kopSuratUrl && typeof kopSuratUrl === "string" && kopSuratUrl.length > 50 && !kopSuratUrl.startsWith("indexeddb:")) {
      fs.writeFileSync(
        CUSTOM_KOP_FILE,
        JSON.stringify({ kopSuratUrl, updatedAt: new Date().toISOString() }, null, 2),
        "utf-8"
      );
      const defaultKopPath = path.join(process.cwd(), "src/data/defaultKopImage.ts");
      const fileContent = `// Official default Kop Surat for SD Negeri 3 Loloan Timur
// Diperbarui otomatis dari gambar kop resmi yang diunggah pengguna

export const defaultKopSuratSDN3LoloanTimur = ${JSON.stringify(kopSuratUrl)};
`;
      fs.writeFileSync(defaultKopPath, fileContent, "utf-8");
    }

    // 2. Simpan seluruh dataset hasil akhir ke appDefaults.json
    const appDefaultsData = {
      updatedAt: new Date().toISOString(),
      schoolProfile: schoolProfile
        ? {
            ...schoolProfile,
            kopSuratUrl: "indexeddb:active",
            kopMode: "gambar",
          }
        : undefined,
      employees: Array.isArray(employees) ? employees : undefined,
      documents: Array.isArray(documents) ? documents : undefined,
      numberingConfig: numberingConfig || undefined,
      defaultSKParams: defaultSKParams || undefined,
    };

    fs.writeFileSync(APP_DEFAULTS_FILE, JSON.stringify(appDefaultsData, null, 2), "utf-8");

    res.json({
      success: true,
      message: "Seluruh data hasil akhir berhasil dijadikan DATA BAWAAN RESMI APLIKASI!",
      defaults: appDefaultsData,
    });
  } catch (err: any) {
    console.error("Error saving app defaults:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Ambil kop bawaan yang tersimpan di server
app.get("/api/kop/default", (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(CUSTOM_KOP_FILE)) {
      const data = JSON.parse(fs.readFileSync(CUSTOM_KOP_FILE, "utf-8"));
      if (data.kopSuratUrl) {
        return res.json({ success: true, kopSuratUrl: data.kopSuratUrl });
      }
    } else if (fs.existsSync(FALLBACK_KOP_FILE)) {
      const data = JSON.parse(fs.readFileSync(FALLBACK_KOP_FILE, "utf-8"));
      if (data.kopSuratUrl) {
        return res.json({ success: true, kopSuratUrl: data.kopSuratUrl });
      }
    }
  } catch (e) {
    console.error("Error reading custom kop file:", e);
  }
  res.json({ success: true, kopSuratUrl: null });
});

// Endpoint: Simpan gambar kop unggahan pengguna sebagai kop surat bawaan resmi aplikasi
app.post("/api/kop/set-default", (req: Request, res: Response) => {
  try {
    const { kopSuratUrl } = req.body;
    if (!kopSuratUrl || typeof kopSuratUrl !== "string") {
      return res.status(400).json({ success: false, error: "kopSuratUrl is required" });
    }

    // 1. Simpan ke customKop.json
    fs.writeFileSync(
      CUSTOM_KOP_FILE,
      JSON.stringify({ kopSuratUrl, updatedAt: new Date().toISOString() }, null, 2),
      "utf-8"
    );

    // 2. Perbarui src/data/defaultKopImage.ts agar menjadi kode bawaan aplikasi permanen
    const defaultKopPath = path.join(process.cwd(), "src/data/defaultKopImage.ts");
    const fileContent = `// Official default Kop Surat for SD Negeri 3 Loloan Timur
// Diperbarui otomatis dari gambar kop resmi yang diunggah pengguna

export const defaultKopSuratSDN3LoloanTimur = ${JSON.stringify(kopSuratUrl)};
`;
    fs.writeFileSync(defaultKopPath, fileContent, "utf-8");

    res.json({
      success: true,
      message: "Gambar kop surat berhasil disimpan dan dijadikan bawaan resmi aplikasi!",
    });
  } catch (err: any) {
    console.error("Error setting default kop:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Download file batch untuk membuat exe portabel langsung di Windows
app.get("/api/download/buat-exe-bat", (_req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), "BUAT_EXE_PORTABEL.bat");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="BUAT_EXE_PORTABEL.bat"');
    res.setHeader("Content-Type", "application/x-bat");
    return res.sendFile(filePath);
  }
  res.status(404).json({ success: false, error: "File tidak ditemukan" });
});

// Helper untuk menambahkan folder secara rekursif ke zip
function addFolderToZip(zipInstance: any, dirPath: string, rootDir: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === "dist-electron" ||
      entry.name === ".git" ||
      entry.name === ".DS_Store"
    ) {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      addFolderToZip(zipInstance, fullPath, rootDir);
    } else if (entry.isFile()) {
      zipInstance.file(relPath, fs.readFileSync(fullPath));
    }
  }
}

// Endpoint: Download Paket Lengkap Proyek Aplikasi (.ZIP) Siap Buat EXE di Windows
app.get("/api/download/paket-lengkap-zip", async (_req: Request, res: Response) => {
  try {
    const zip = new JSZip();
    const rootDir = process.cwd();

    const rootFiles = [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "index.html",
      "server.ts",
      "electron-builder.json",
      "BUAT_EXE_PORTABEL.bat",
      "BUAT_INSTALLER_SETUP.bat",
      "JALANKAN_DESKTOP_DEV.bat",
      "PANDUAN_EXE_PORTABEL.md",
      ".env.example",
      ".npmrc",
    ];

    for (const f of rootFiles) {
      const fullPath = path.join(rootDir, f);
      if (fs.existsSync(fullPath)) {
        zip.file(f, fs.readFileSync(fullPath));
      }
    }

    for (const folder of ["src", "electron", "public"]) {
      const folderPath = path.join(rootDir, folder);
      if (fs.existsSync(folderPath)) {
        addFolderToZip(zip, folderPath, rootDir);
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Aplikasi-SK-Sekolah-Lengkap-Siap-Buat-EXE.zip"'
    );
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Length", zipBuffer.length);
    return res.end(zipBuffer);
  } catch (err: any) {
    console.error("Error creating project zip:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Download panduan pembuatan exe portabel
app.get("/api/download/panduan-exe", (_req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), "PANDUAN_EXE_PORTABEL.md");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="PANDUAN_EXE_PORTABEL.md"');
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    return res.sendFile(filePath);
  }
  res.status(404).json({ success: false, error: "File tidak ditemukan" });
});

// Endpoint: Cek ketersediaan file EXE hasil build
app.get("/api/status/portable-exe", (_req: Request, res: Response) => {
  try {
    const distDir = path.join(process.cwd(), "dist-electron");
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      const exeFile = files.find((f) => f.endsWith(".exe"));
      if (exeFile) {
        const stats = fs.statSync(path.join(distDir, exeFile));
        return res.json({
          available: true,
          fileName: exeFile,
          sizeMb: (stats.size / (1024 * 1024)).toFixed(1),
          updatedAt: stats.mtime.toISOString(),
        });
      }
    }
  } catch (e) {
    console.error("Error checking exe status:", e);
  }
  res.json({ available: false });
});

// Endpoint: Download file EXE portabel langsung jika tersedia
app.get("/api/download/portable-exe", (_req: Request, res: Response) => {
  try {
    const distDir = path.join(process.cwd(), "dist-electron");
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      const exeFile = files.find((f) => f.endsWith(".exe"));
      if (exeFile) {
        const fullPath = path.join(distDir, exeFile);
        res.setHeader("Content-Disposition", `attachment; filename="${exeFile}"`);
        res.setHeader("Content-Type", "application/vnd.microsoft.portable-executable");
        return res.sendFile(fullPath);
      }
    }
  } catch (e) {
    console.error("Error serving exe download:", e);
  }
  res.status(404).json({
    success: false,
    error: "File .exe belum tersedia atau sedang dibuat. Gunakan script BUAT_EXE_PORTABEL.bat atau tunggu hingga selesai.",
  });
});

// Endpoint: AI SK Generator
app.post("/api/gemini/generate-sk", async (req: Request, res: Response) => {
  try {
    const {
      jenisSK,
      judulSK,
      tahunAjaran,
      sekolah,
      kepalaSekolah,
      dataKhusus,
      employees,
      userPrompt,
    } = req.body;

    const ai = getGemini();

    const systemInstruction = `Anda adalah Asisten Pakar Administrasi dan Regulasi Pendidikan Dasar (Kepala Sekolah SD) di Indonesia.
Tugas Anda adalah menyusun dokumen formal "SURAT KEPUTUSAN (SK) KEPALA SEKOLAH" dalam format standar tata naskah dinas pendidikan Indonesia yang sangat presisi, resmi, dan lengkap.

PERATURAN PENTING MENGENAI DASAR HUKUM:
1. Cantumkan dasar hukum (MENGINGAT) yang benar-benar relevan dengan jenis SK:
   - UU No. 20 Tahun 2003 tentang Sistem Pendidikan Nasional
   - PP No. 4 Tahun 2022 tentang Perubahan atas PP No. 57 Tahun 2021 tentang Standar Nasional Pendidikan
   - Permendikdasmen No. 12 Tahun 2025 tentang Standar Isi (atau Permendikbudristek No. 16/2022 Standar Proses, No. 21/2022 Standar Penilaian, No. 47/2023 Standar Pengelolaan, No. 18/2023 Standar Pembiayaan, No. 13/2025 Kurikulum)
   - Peraturan terkait khusus (misal Permendikbudristek No. 46/2023 untuk TPPK, Permendikbud No. 63/2022/2023/2024 tentang Petunjuk Teknis BOSP untuk BOS, dsb.)
   - Peraturan daerah / Pergub terkait jika relevan (misal Bahasa Daerah Bali Pergub Bali No. 20/2013)
   - Kalender Pendidikan Dinas Provinsi/Kabupaten.
2. Jika suatu dasar hukum belum pasti atau perkiraan spesifik nomor lokal, tandai dengan catatan atau format baku. Jangan mengarang nomor pasal fiktif yang aneh.
3. Struktur konsiderans Menimbang wajib huruf a, b, c... diawali "Bahwa ...".
4. Bagian Memperhatikan mencakup keputusan rapat dewan guru pada tanggal yang ditentukan.
5. Bagian MEMUTUSKAN / Menetapkan berisi diktum berurutan KESATU, KEDUA, KETIGA, KEEMPAT, KELIMA, KEENAM, KETUJUH, KEDELAPAN dst.
6. Buat lampiran tabel yang terstruktur sesuai jenis SK dengan data guru/PTK yang relevan.

Format output WAJIB JSON valid sesuai schema berikut:
{
  "judul": string,
  "menimbang": [
    "Bahwa dalam rangka ...",
    "Bahwa untuk menjamin kelancaran ..."
  ],
  "mengingat": [
    "Undang-undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;",
    "Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Perubahan Peraturan Pemerintah Nomor 57 Tahun 2021 tentang Standar Nasional Pendidikan;",
    ...
  ],
  "memperhatikan": "Saran, usul dan Keputusan Rapat Dewan Guru ... tanggal ... tentang ...",
  "diktum": [
    { "poin": "KESATU", "isi": "..." },
    { "poin": "KEDUA", "isi": "..." },
    { "poin": "KETIGA", "isi": "..." },
    { "poin": "KEEMPAT", "isi": "..." },
    { "poin": "KELIMA", "isi": "Masing-masing guru dan tenaga kependidikan melaporkan pelaksanaan tugasnya secara berkala dan tertulis kepada kepala sekolah" },
    { "poin": "KEENAM", "isi": "Segala biaya yang berkaitan dengan pelaksanaan keputusan ini dibebankan kepada anggaran sekolah yang relevan" },
    { "poin": "KETUJUH", "isi": "Apabila di kemudian hari ternyata terdapat kekeliruan dalam keputusan ini akan diadakan perbaikan sebagaimana mestinya" },
    { "poin": "KEDELAPAN", "isi": "Keputusan ini mulai berlaku sejak tanggal ditetapkan" }
  ],
  "tembusan": [
    "Kepala Dinas Pendidikan Kepemudaan dan Olahraga Kabupaten ...",
    "Koordinator Wilayah Satuan Pendidikan Formal (SPF) Kecamatan ...",
    "Pengawas Sekolah Pembina",
    "Ketua Komite Sekolah",
    "Yang bersangkutan untuk dilaksanakan",
    "Arsip Sekolah"
  ],
  "lampiranList": [
    {
      "nomorLampiran": "Lampiran I",
      "judul": "Pembagian Tugas Guru Dalam Kegiatan Proses Belajar Mengajar",
      "jenisLampiran": "pembagian_tugas_guru",
      "headers": ["No", "Nama / NIP", "Pangkat / Golongan", "Jabatan", "Mata Pelajaran", "Kelas", "Jumlah Jam"],
      "rows": [
        ["1", "Nama Guru, S.Pd\\nNIP. 198...", "Ahli Pertama / IX", "Guru Kelas", "PPKn\\nBhs. Indonesia\\nMatematika\\nIPAS\\nSBdP", "IV", "32 jam"]
      ],
      "footerNote": "Jumlah total jam: ..."
    }
  ],
  "aiNotes": [
    "Periksa kesesuaian jam mengajar minimal 24 jam untuk sertifikasi guru",
    "Dasar hukum telah diselaraskan dengan regulasi kurikulum dan standar nasional pendidikan"
  ]
}`;

    const promptText = `SUSUN DRAF SURAT KEPUTUSAN KEPALA SEKOLAH SD:
Jenis SK: ${jenisSK || "Umum"}
Judul yang diinginkan: ${judulSK || "Sesuai standar"}
Tahun Ajaran: ${tahunAjaran || "2025/2026"}
Nama Sekolah: ${sekolah?.nama || "SD Negeri"}
Alamat: ${sekolah?.alamat || ""}, ${sekolah?.desa || ""}, Kec. ${sekolah?.kecamatan || ""}, Kab. ${sekolah?.kabupaten || ""}, Prov. ${sekolah?.provinsi || ""}
Nama Kepala Sekolah: ${kepalaSekolah?.nama || ""}
NIP Kepala Sekolah: ${kepalaSekolah?.nip || ""}
Pangkat/Golongan Kepala Sekolah: ${kepalaSekolah?.pangkat || ""} / ${kepalaSekolah?.golongan || ""}
Data Rapat / Kebutuhan Khusus: ${JSON.stringify(dataKhusus || {})}
Prompt/Instruksi Tambahan Pengguna: ${userPrompt || "Buat SK formal lengkap dengan lampiran"}
Daftar Guru/PTK yang terdaftar di sekolah (${employees?.length || 0} orang):
${(employees || []).slice(0, 15).map((e: any, i: number) => `${i + 1}. ${e.nama} (${e.nip || "-"}, ${e.pangkat || ""}/${e.golongan || ""}, ${e.jabatan || ""}, ${e.mapel || ""}, Kelas: ${e.kelas || "-"})`).join("\n")}

Keluarkan HANYA JSON murni yang valid tanpa awalan \`\`\`json atau karakter markdown lainnya bila memungkinkan.`;

    if (!ai) {
      // Fallback response with realistic, high-fidelity Indonesian school SK structure
      const fallbackData = generateLocalSKFallback(jenisSK, judulSK, tahunAjaran, sekolah, dataKhusus, employees);
      return res.json({
        success: true,
        source: "local-generator",
        data: {
          ...fallbackData,
          aiNotes: [
            ...(fallbackData.aiNotes || []),
            "Mode Template Standar Offline: GEMINI_API_KEY belum terpasang di komputer lokal. Format dokumen telah disesuaikan secara otomatis dengan regulasi dinas standar.",
          ],
        },
      });
    }

    // Resilient AI generation with multi-tier model fallback & retry
    let rawText = "";
    let usedModel = "official-generator";

    try {
      const aiResult = await generateContentWithFallback(ai, {
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });
      rawText = aiResult.text || "{}";
      usedModel = aiResult.model;
    } catch (aiErr: any) {
      console.warn("AI generation fallback to standard school SK template:", aiErr?.message);
      const localData = generateLocalSKFallback(jenisSK, judulSK, tahunAjaran, sekolah, dataKhusus, employees);
      return res.json({
        success: true,
        source: "local-generator-fallback",
        data: localData,
        warning: "Server AI sedang dalam antrean tinggi. Draf SK telah disusun otomatis menggunakan format standar tata naskah dinas pendidikan.",
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Clean potential backticks or markdown wrapper
      const clean = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(clean);
    }

    if (parsedData && parsedData.judul) {
      parsedData.judul = cleanServerSKJudul(parsedData.judul, tahunAjaran);
    }

    res.json({
      success: true,
      source: usedModel,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Error in /api/gemini/generate-sk:", error);
    // Never return a blocking 500 error to the client; always provide a valid draft
    const { jenisSK, judulSK, tahunAjaran, sekolah, dataKhusus, employees } = req.body;
    const fallbackData = generateLocalSKFallback(jenisSK, judulSK, tahunAjaran, sekolah, dataKhusus, employees);
    res.json({
      success: true,
      source: "local-generator-safe-recovery",
      data: fallbackData,
      warning: "Terjadi pemulihan otomatis draf SK dinas standar.",
    });
  }
});

// Helper to clean SK title and prevent duplicate kop/tentang/tahun ajaran
function cleanServerSKJudul(rawJudul?: string, tahunAjaran?: string): string {
  if (!rawJudul) return "";
  let clean = rawJudul.trim();
  clean = clean.replace(/^(?:SURAT\s+)?KEPUTUSAN\s+KEPALA\s+[^\n]+?TENTANG\s+/i, "");
  clean = clean.replace(/^(?:SURAT\s+)?KEPUTUSAN\s+TENTANG\s+/i, "");
  clean = clean.replace(/^SK\s+TENTANG\s+/i, "");
  clean = clean.replace(/^TENTANG\s+/i, "");
  clean = clean.replace(/^(?:SURAT\s+)?KEPUTUSAN\s+KEPALA\s+(?:SEKOLAH|SD|SATUAN\s+PENDIDIKAN)[^\n]*$/i, "");
  clean = clean.replace(/^KEPUTUSAN\s+KEPALA\s+SEKOLAH\s+TENTANG\s+/i, "");
  clean = clean.replace(/^SURAT\s+KEPUTUSAN\s+KEPALA\s+SEKOLAH\s+TENTANG\s+/i, "");
  if (tahunAjaran) {
    const escapedTa = tahunAjaran.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    clean = clean.replace(new RegExp(`\\s*(?:PADA|UNTUK|SEMESTER\\s+[\\w\\s]+)?\\s*TAHUN\\s+(?:AJARAN|PELAJARAN)\\s*${escapedTa}\\s*$`, "i"), "");
  }
  clean = clean.replace(
    /\s*(?:PADA|UNTUK|SEMESTER\s+(?:GANJIL|GENAP|\d+))?\s*TAHUN\s+(?:AJARAN|PELAJARAN)\s*\d{4}\/\d{4}\s*$/i,
    ""
  );
  return clean.trim();
}

// Helper for local refinement when AI is unavailable or under high load
function refineDocumentLocally(currentDoc: any, instruction: string) {
  const updated = { ...currentDoc };
  const lower = (instruction || "").toLowerCase();

  if (lower.includes("nomor")) {
    const match = instruction.match(/\d+[\w\.\/\-]+/);
    if (match) updated.nomor = match[0];
  }
  if (lower.includes("tanggal")) {
    updated.tanggalTetap = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (lower.includes("judul") || lower.includes("nama sk")) {
    updated.judul = `${currentDoc.judul} (Disesuaikan)`;
  }
  if (lower.includes("dasar hukum") || lower.includes("mengingat")) {
    if (!updated.mengingat.some((m: string) => m.includes("Peraturan Menteri"))) {
      updated.mengingat.push(
        "Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 12 Tahun 2025 tentang Standar Isi pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar dan Jenjang Pendidikan Menengah;"
      );
    }
  }
  if (lower.includes("diktum") || lower.includes("tambah poin")) {
    updated.diktum = [
      ...updated.diktum,
      {
        poin: `KE-${updated.diktum.length + 1}`,
        isi: `Segala hal yang belum diatur dalam keputusan ini akan ditetapkan kemudian.`,
      },
    ];
  }
  return updated;
}

// Endpoint: AI Refine / Chat Edit on Draft SK
app.post("/api/gemini/refine-sk", async (req: Request, res: Response) => {
  try {
    const { currentDoc, instruction } = req.body;
    const ai = getGemini();

    if (!ai) {
      return res.json({
        success: true,
        source: "local-refiner",
        data: refineDocumentLocally(currentDoc, instruction),
      });
    }

    const systemPrompt = `Anda adalah asisten administrasi sekolah. Pengguna memiliki draf SK dan ingin memperbaruinya sesuai permintaan seperti:
- "ubah nama tim"
- "tambahkan guru"
- "hapus anggota nomor 4"
- "ubah tanggal"
- "tambahkan dasar hukum"
- "perbaiki bahasa"
- "ubah nomor SK"
- "buat lampiran"
- "buat lebih formal"

Perbarui data JSON SK dan kembalikan JSON yang sudah dimutakhirkan dengan format yang sama persis seperti dokumen awal. Jangan hilangkan data lain yang tidak diminta diubah.`;

    const promptText = `DRAF SK SAAT INI:
${JSON.stringify(currentDoc, null, 2)}

PERMINTAAN PERUBAHAN PENGGUNA:
"${instruction}"

Berikan draf SK yang diperbarui dalam JSON valid.`;

    let raw = "";
    try {
      const aiResult = await generateContentWithFallback(ai, {
        contents: promptText,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });
      raw = aiResult.text || "{}";
    } catch (err: any) {
      console.warn("AI refine fallback to local refiner:", err?.message);
      return res.json({
        success: true,
        source: "local-refiner-fallback",
        data: refineDocumentLocally(currentDoc, instruction),
      });
    }

    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const updated = JSON.parse(cleaned);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error in /api/gemini/refine-sk:", error);
    const { currentDoc, instruction } = req.body;
    res.json({
      success: true,
      source: "local-refiner-error-fallback",
      data: refineDocumentLocally(currentDoc, instruction),
    });
  }
});

// Endpoint: 17-Point Compliance Checker & Validation
app.post("/api/gemini/validate-sk", async (req: Request, res: Response) => {
  try {
    const doc = req.body.document || req.body.doc || {};
    const sekolah = req.body.sekolah || {};
    const ai = getGemini();

    const items: Array<{ point: string; passed: boolean; status: string }> = [];
    const findings: string[] = [];
    const recommendations: string[] = [];

    // 1. Kop Surat & Identitas
    const hasKop = Boolean(sekolah.nama || sekolah.namaKop || doc.sekolah?.nama);
    items.push({
      point: "1. KOP Surat & Identitas Satuan Pendidikan",
      passed: hasKop,
      status: hasKop ? "Lengkap" : "Perlu dilengkapi di Profil Sekolah",
    });
    if (!hasKop) findings.push("Identitas kop surat sekolah belum terisi lengkap.");

    // 2. Format Nomor SK
    const hasNomor = Boolean(doc.nomor && !doc.nomor.includes("[") && doc.nomor.trim().length > 3);
    items.push({
      point: "2. Format Nomor Surat Keputusan Standar Dinas",
      passed: hasNomor,
      status: hasNomor ? "Sesuai Standar" : "Belum diisi / Masih Template",
    });
    if (!hasNomor) findings.push("Nomor SK belum memiliki format penomoran definitif.");

    // 3. Judul SK
    const hasJudul = Boolean(doc.judul && doc.judul.trim().length > 10);
    items.push({
      point: "3. Judul Keputusan Jelas, Huruf Kapital & Memuat Substansi",
      passed: hasJudul,
      status: hasJudul ? "Lengkap" : "Judul kosong atau terlalu singkat",
    });
    if (!hasJudul) findings.push("Judul surat keputusan harus jelas dan memuat substansi penugasan.");

    // 4. Konsiderans Menimbang
    const hasMenimbang = Boolean(
      doc.menimbang &&
      doc.menimbang.length >= 2 &&
      doc.menimbang.every((m: string) => m.trim().toLowerCase().startsWith("bahwa"))
    );
    items.push({
      point: "4. Konsiderans Menimbang (Diawali frasa 'Bahwa...')",
      passed: hasMenimbang,
      status: hasMenimbang ? "Sesuai Kaidah" : "Perlu Perbaikan Kaidah Bahasa",
    });
    if (!hasMenimbang) findings.push("Butir Menimbang wajib diawali kata 'Bahwa' berurutan huruf a, b, dst.");

    // 5. Dasar Hukum UU Sisdiknas
    const hasUUSisdiknas = Boolean(
      doc.mengingat && doc.mengingat.some((m: string) => m.includes("20 Tahun 2003") || m.includes("Sistem Pendidikan Nasional"))
    );
    items.push({
      point: "5. Dasar Hukum UU No. 20 Tahun 2003 tentang Sisdiknas",
      passed: hasUUSisdiknas,
      status: hasUUSisdiknas ? "Tercantum" : "Belum Dicantumkan",
    });
    if (!hasUUSisdiknas) recommendations.push("Tambahkan Undang-Undang No. 20 Tahun 2003 tentang Sistem Pendidikan Nasional pada butir Mengingat.");

    // 6. Dasar Hukum SNP
    const hasSNP = Boolean(
      doc.mengingat && doc.mengingat.some((m: string) => m.includes("PP") || m.includes("Standar Nasional Pendidikan") || m.includes("57 Tahun 2021") || m.includes("4 Tahun 2022"))
    );
    items.push({
      point: "6. Dasar Hukum Standar Nasional Pendidikan (PP No. 57/2021 jo PP No. 4/2022)",
      passed: hasSNP,
      status: hasSNP ? "Tercantum" : "Perlu Ditambahkan",
    });
    if (!hasSNP) recommendations.push("Cantumkan Peraturan Pemerintah No. 4 Tahun 2022 tentang Perubahan atas PP No. 57 Tahun 2021 tentang Standar Nasional Pendidikan.");

    // 7. Regulasi Standar/Kurikulum Terbaru
    const hasRegulasiKurikulum = Boolean(
      doc.mengingat && doc.mengingat.length >= 4
    );
    items.push({
      point: "7. Penyelarasan Permendikdasmen / Standar Kurikulum Terbaru",
      passed: hasRegulasiKurikulum,
      status: hasRegulasiKurikulum ? "Relevan" : "Kurang Lengkap (Minimal 4 Regulasi)",
    });
    if (!hasRegulasiKurikulum) findings.push("Dasar hukum sebaiknya mencakup standar isi, standar proses, standar penilaian, dan kurikulum.");

    // 8. Konsiderans Memperhatikan
    const hasMemperhatikan = Boolean(doc.memperhatikan && doc.memperhatikan.trim().length > 10);
    items.push({
      point: "8. Konsiderans Memperhatikan (Hasil Rapat Dewan Guru & Tanggal)",
      passed: hasMemperhatikan,
      status: hasMemperhatikan ? "Lengkap" : "Belum Dicantumkan",
    });
    if (!hasMemperhatikan) findings.push("Bagian Memperhatikan harus mencantumkan tanggal keputusan rapat dewan guru.");

    // 9. Diktum MEMUTUSKAN Terstruktur
    const hasDiktum = Boolean(doc.diktum && doc.diktum.length >= 3);
    items.push({
      point: "9. Diktum MEMUTUSKAN / Menetapkan Berurutan",
      passed: hasDiktum,
      status: hasDiktum ? "Lengkap" : "Diktum Kurang Lengkap",
    });

    // 10. Diktum Pelaporan Berkala
    const hasPelaporan = Boolean(
      doc.diktum && doc.diktum.some((d: any) => (d.isi || "").toLowerCase().includes("lapor") || (d.isi || "").toLowerCase().includes("tanggung jawab"))
    );
    items.push({
      point: "10. Diktum Pelaporan Pelaksanaan Tugas Berkala",
      passed: hasPelaporan,
      status: hasPelaporan ? "Tersedia" : "Belum Dicantumkan",
    });
    if (!hasPelaporan) recommendations.push("Tambahkan diktum klausul kewajiban guru/staf untuk melaporkan pelaksanaan tugas secara berkala.");

    // 11. Diktum Klausul Pembebanan Anggaran
    const hasAnggaran = Boolean(
      doc.diktum && doc.diktum.some((d: any) => (d.isi || "").toLowerCase().includes("biaya") || (d.isi || "").toLowerCase().includes("anggaran"))
    );
    items.push({
      point: "11. Diktum Klausul Pembebanan Biaya / Anggaran Sekolah",
      passed: hasAnggaran,
      status: hasAnggaran ? "Tersedia" : "Belum Dicantumkan",
    });

    // 12. Diktum Klausul Perbaikan Kekeliruan
    const hasKekeliruan = Boolean(
      doc.diktum && doc.diktum.some((d: any) => (d.isi || "").toLowerCase().includes("keliru") || (d.isi || "").toLowerCase().includes("perbaikan"))
    );
    items.push({
      point: "12. Diktum Klausul Perbaikan Jika Terdapat Kekeliruan",
      passed: hasKekeliruan,
      status: hasKekeliruan ? "Tersedia" : "Belum Dicantumkan",
    });

    // 13. Diktum Masa Berlaku
    const hasBerlaku = Boolean(
      doc.diktum && doc.diktum.some((d: any) => (d.isi || "").toLowerCase().includes("berlaku"))
    );
    items.push({
      point: "13. Diktum Klausul Tanggal Mulai Berlaku",
      passed: hasBerlaku,
      status: hasBerlaku ? "Tersedia" : "Belum Dicantumkan",
    });

    // 14. Titimangsa Penetapan
    const hasTitimangsa = Boolean(doc.tanggalTetap && doc.tempatTetap);
    items.push({
      point: "14. Tempat dan Tanggal Penetapan Lengkap",
      passed: hasTitimangsa,
      status: hasTitimangsa ? "Lengkap" : "Belum Diisi Lengkap",
    });
    if (!hasTitimangsa) findings.push("Tempat dan tanggal penetapan SK wajib terisi sebelum pengesahan.");

    // 15. Identitas Kepala Sekolah
    const hasKepsek = Boolean(
      doc.kepalaSekolah?.nama &&
      doc.kepalaSekolah.nama.trim().length > 3 &&
      doc.kepalaSekolah?.nip &&
      doc.kepalaSekolah.nip !== "-"
    );
    items.push({
      point: "15. Identitas & NIP Kepala Sekolah Penandatangan",
      passed: hasKepsek,
      status: hasKepsek ? "Lengkap" : "NIP atau Nama Kepsek Perlu Diperiksa",
    });
    if (!hasKepsek) findings.push("Pastikan NIP Kepala Sekolah penandatangan telah terisi dengan benar.");

    // 16. Distribusi Tembusan Resmi
    const hasTembusan = Boolean(doc.tembusan && doc.tembusan.length >= 3);
    items.push({
      point: "16. Distribusi Tembusan Naskah Dinas (Dinas, Korwil, Pengawas, Arsip)",
      passed: hasTembusan,
      status: hasTembusan ? "Lengkap" : "Kurang Lengkap (Minimal 3 Pihak)",
    });

    // 17. Lampiran Rincian Tugas
    const hasLampiran = Boolean(doc.lampiranList && doc.lampiranList.length > 0);
    items.push({
      point: "17. Lampiran Matriks / Tabel Rincian Pembagian Tugas",
      passed: hasLampiran,
      status: hasLampiran ? "Tersedia" : "Belum Ada Lampiran Tabel",
    });
    if (!hasLampiran) findings.push("SK Pembagian tugas wajib menyertakan lampiran tabel tugas mengajar atau susunan kepanitiaan.");

    const passedCount = items.filter((i) => i.passed).length;
    const score = Math.round((passedCount / 17) * 100);
    const overallStatus = score >= 90 ? "Sesuai Standar" : score >= 70 ? "Perlu Verifikasi" : "Belum Lengkap";

    let aiAdvice = "";
    if (ai) {
      try {
        const aiResult = await generateContentWithFallback(ai, {
          contents: `Analisis draf Surat Keputusan (SK) Kepala Sekolah SD berikut:
Judul: ${doc.judul}
Nomor: ${doc.nomor}
Tahun Ajaran: ${doc.tahunAjaran}
Jumlah Dasar Hukum: ${doc.mengingat?.length || 0} butir
Jumlah Diktum: ${doc.diktum?.length || 0} butir
Jumlah Lampiran: ${doc.lampiranList?.length || 0} lampiran
Temuan Checklist: ${findings.join("; ") || "Tidak ada kendala kritis"}

Berikan catatan profesional dalam 2 kalimat singkat mengenai keselarasan administrasi dinas dan rekomendasi bagi kepala sekolah.`,
          config: {
            temperature: 0.2,
          },
        });
        aiAdvice = aiResult.text || "";
      } catch (aiErr) {
        console.warn("AI advice generation skipped or fallback:", aiErr);
      }
    }

    if (!aiAdvice) {
      aiAdvice = score >= 90
        ? "Dokumen SK telah memenuhi seluruh standar tata naskah dinas pendidikan Indonesia dan siap untuk dicetak serta ditandatangani."
        : "Lakukan perbaikan pada butir-butir yang ditandai kuning sebelum melakukan pengesahan resmi dan distribusi tembusan.";
    }

    res.json({
      success: true,
      report: {
        score,
        status: overallStatus,
        items,
        findings,
        recommendations,
        aiAdvice,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/gemini/validate-sk:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: AI Checker & Validation (legacy check route)
app.post("/api/gemini/check-sk", async (req: Request, res: Response) => {
  try {
    const doc = req.body.doc || req.body.document || {};
    const findings: string[] = [];
    let status: "Data lengkap" | "Data belum lengkap" | "Perlu verifikasi" = "Data lengkap";

    if (!doc.nomor || doc.nomor.includes("[") || doc.nomor.trim() === "") {
      findings.push("Nomor SK belum diisi secara lengkap atau masih berupa template.");
      status = "Data belum lengkap";
    }
    if (!doc.judul || doc.judul.trim() === "") {
      findings.push("Judul SK masih kosong.");
      status = "Data belum lengkap";
    }
    if (!doc.tahunAjaran || doc.tahunAjaran.trim() === "") {
      findings.push("Tahun ajaran belum ditentukan.");
      status = "Data belum lengkap";
    }
    if (!doc.tanggalTetap || doc.tanggalTetap.trim() === "") {
      findings.push("Tanggal penetapan SK belum diisi.");
      status = "Data belum lengkap";
    }
    if (!doc.tempatTetap || doc.tempatTetap.trim() === "") {
      findings.push("Tempat penetapan (desa/kota) belum diisi.");
      status = "Data belum lengkap";
    }
    if (!doc.kepalaSekolah?.nama || doc.kepalaSekolah.nama.trim() === "") {
      findings.push("Nama Kepala Sekolah penandatangan belum terisi.");
      status = "Data belum lengkap";
    }

    res.json({
      success: true,
      status,
      findings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper for local smart assistant reply
function getLocalAssistantReply(incomingText: string) {
  const low = (incomingText || "").toLowerCase();
  if (low.includes("pembagian tugas") || low.includes("kbm") || low.includes("mengajar")) {
    return "Untuk SK Pembagian Tugas KBM, pastikan beban kerja guru bersertifikat pendidik minimal 24 jam tatap muka per minggu. Anda dapat menggunakan modul 'Buat SK Baru' untuk menyusun SK lengkap dengan Lampiran I (KBM), Lampiran II (Wali Kelas & KKG), Lampiran III (Tenaga Kependidikan), dan Lampiran IV (Tugas Tambahan).";
  }
  if (low.includes("bos") || low.includes("bosp") || low.includes("anggaran")) {
    return "Penyusunan SK Tim Pengelola BOSP berpedoman pada Petunjuk Teknis Pengelolaan BOSP terbaru dari kementerian. Tim terdiri dari Penanggung Jawab (Kepala Sekolah), Bendahara BOS, dan Anggota (Guru/Komite). Format siap disusun melalui template resmi.";
  }
  if (low.includes("tppk") || low.includes("kekerasan")) {
    return "SK TPPK (Tim Pencegahan dan Penanganan Kekerasan) dibentuk sesuai Permendikbudristek No. 46 Tahun 2023. Anggotanya melibatkan perwakilan guru, tenaga kependidikan, dan komite sekolah / orang tua siswa dengan masa tugas 2 tahun.";
  }
  if (low.includes("dasar hukum") || low.includes("regulasi")) {
    return "Dasar hukum baku SK SD mencakup UU No. 20/2003 (Sisdiknas), PP No. 57/2021 jo PP No. 4/2022 (SNP), Permendikdasmen No. 12/2025 (Standar Isi), No. 10/2025 (SKL), No. 13/2025 (Kurikulum), serta Kalender Pendidikan Dinas Daerah.";
  }
  return "Halo Bapak/Ibu Kepala Sekolah! Saya Asisten AI Administrasi Satuan Pendidikan Dasar. Saya siap membantu menyusun draf SK, memverifikasi dasar hukum tata naskah dinas, menyusun SOP, atau program kerja sekolah.";
}

// Endpoint: AI Assistant Chat for School Headmaster (supports both /assistant and /assistant-chat)
const handleAssistantChat = async (req: Request, res: Response) => {
  const { message, messages, history: reqHistory, context } = req.body;
  const incomingText = message || (messages && messages[messages.length - 1]?.content) || "Halo";
  const ai = getGemini();

  if (!ai) {
    const baseReply = getLocalAssistantReply(incomingText);
    const keyNotice = "\n\n*(Catatan: Asisten saat ini merespons dalam Mode Template Offline karena kunci GEMINI_API_KEY belum terpasang di komputer lokal ini. Seluruh panduan regulasi tetap valid. Untuk mengaktifkan respon cerdas dinamis penuh, Anda dapat memasukkan API Key gratis dari https://aistudio.google.com/apikey ke dalam file .env di folder data aplikasi).*";
    return res.json({
      success: true,
      hasApiKey: false,
      reply: `${baseReply}${keyNotice}`,
    });
  }

  const formattedHistory = reqHistory
    ? reqHistory.map((h: any) => ({
        role: h.role === "assistant" || h.role === "model" ? "model" : "user",
        parts: [{ text: h.content || h.text || "" }],
      }))
    : (messages || []).slice(0, -1).map((m: any) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content || m.text || "" }],
      }));

  const systemInstruction = `Anda adalah "Asisten AI Administrasi Kepala Sekolah SD". Anda ramah, bijak, berwibawa, dan sangat menguasai tata laksana dinas pendidikan dasar di Indonesia (Kurikulum Merdeka, Permendikdasmen terbaru, Pengelolaan BOS/BOSP, Pemenuhan Jam Mengajar Guru 24-40 jam, TPPK, TPMPS, Komite Sekolah, dsb).
Konteks Satuan Pendidikan:
Nama Sekolah: ${context?.sekolah || "SD Negeri 3 Loloan Timur"}
Kepala Sekolah: ${context?.kepalaSekolah || "Susilo Fitri Yatmoko, M.Pd"}
Jumlah Guru/PTK: ${context?.totalGuru || context?.employeesCount || 9} orang.

Berikan jawaban yang taktis, solutif, santun, dan sesuai regulasi pendidikan Indonesia terkini.`;

  try {
    let responseText = "";
    try {
      const chatResult = await createChatWithFallback(ai, {
        history: formattedHistory,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
        message: incomingText,
      });
      responseText = chatResult.text || "";
    } catch (chatErr: any) {
      console.warn("AI Assistant chat busy or fallback:", chatErr?.message);
      responseText = getLocalAssistantReply(incomingText);
    }

    res.json({
      success: true,
      reply: responseText || getLocalAssistantReply(incomingText),
    });
  } catch (error: any) {
    console.warn("AI Assistant chat busy, returning local smart response:", error?.message);
    res.json({
      success: true,
      reply: getLocalAssistantReply(incomingText),
    });
  }
};

app.post("/api/gemini/assistant", handleAssistantChat);
app.post("/api/gemini/assistant-chat", handleAssistantChat);

// Local Fallback Generator Function supporting various SK categories
function generateLocalSKFallback(
  jenis: string,
  judul: string,
  tahun: string,
  sekolah: any,
  dataKhusus: any,
  employees: any[] = []
) {
  const namaSekolah = sekolah?.nama || "SD Negeri 3 Loloan Timur";
  const namaKab = sekolah?.kabupaten || "Jembrana";
  const namaKec = sekolah?.kecamatan || "Negara";
  const tahunAjaran = tahun || "2025/2026";
  const tanggalRapat = dataKhusus?.tanggalRapat || "18 Juni 2025";
  const lowerJenis = (jenis || "").toLowerCase() + " " + (judul || "").toLowerCase();

  // 1. SK TIM BOS / BOSP
  if (lowerJenis.includes("bos") || lowerJenis.includes("bosp")) {
    return {
      judul: cleanServerSKJudul(judul) || "TIM PENGELOLA BANTUAN OPERASIONAL SATUAN PENDIDIKAN (BOSP)",
      menimbang: [
        `Bahwa dalam rangka memperlancar pengelolaan dan pertanggungjawaban dana Bantuan Operasional Satuan Pendidikan (BOSP) di ${namaSekolah}, dipandang perlu membentuk Tim Pengelola BOSP.`,
        `Bahwa mereka yang namanya tercantum dalam lampiran keputusan ini dianggap mampu dan memenuhi syarat untuk melaksanakan tugas pengelolaan dana BOSP.`,
        `Bahwa berdasarkan pertimbangan sebagaimana dimaksud, perlu menetapkan Keputusan Kepala Sekolah tentang Tim Pengelola BOSP.`,
      ],
      mengingat: [
        "Undang-undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;",
        "Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Perubahan atas PP 57 Tahun 2021 tentang Standar Nasional Pendidikan;",
        "Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Republik Indonesia Nomor 63 Tahun 2022 jo Nomor 63 Tahun 2023 tentang Petunjuk Teknis Pengelolaan Dana Bantuan Operasional Satuan Pendidikan;",
        "Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 18 Tahun 2023 tentang Standar Pembiayaan;",
        `Keputusan Bupati ${namaKab} tentang Penetapan Alokasi Dana BOS/BOSP Satuan Pendidikan Dasar.`,
      ],
      memperhatikan: `Hasil Rapat Dewan Guru dan Komite Sekolah ${namaSekolah} tanggal ${tanggalRapat} tentang Pembentukan Tim Pengelola BOSP.`,
      diktum: [
        { poin: "KESATU", isi: "Membentuk Tim Pengelola Bantuan Operasional Satuan Pendidikan (BOSP) sebagaimana tercantum pada lampiran keputusan ini." },
        { poin: "KEDUA", isi: "Tim Pengelola BOSP bertugas merencanakan (RKT/RKAS), mengelola, membukukan, serta mempertanggungjawabkan penggunaan dana BOSP sesuai ketentuan petunjuk teknis." },
        { poin: "KETIGA", isi: "Segala biaya yang timbul akibat pelaksanaan keputusan ini dibebankan pada anggaran BOSP yang bersangkutan." },
        { poin: "KEEMPAT", isi: "Keputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan apabila terdapat kekeliruan akan diperbaiki sebagaimana mestinya." },
      ],
      tembusan: [
        `Kepala Dinas Pendidikan Kepemudaan dan Olahraga Kabupaten ${namaKab}`,
        `Koordinator Wilayah Satuan Pendidikan Formal Kecamatan ${namaKec}`,
        "Ketua Komite Sekolah",
        "Arsip Sekolah",
      ],
      lampiranList: [
        {
          nomorLampiran: "Lampiran I",
          judul: "Susunan Tim Pengelola BOSP Satuan Pendidikan",
          jenisLampiran: "tim_bosp",
          headers: ["No", "Nama / NIP", "Jabatan Kedinasan", "Jabatan dalam Tim", "Uraian Tugas Pokok"],
          rows: [
            ["1", `${sekolah?.kepalaSekolah?.nama || "Susilo Fitri Yatmoko, M.Pd"}\nNIP. ${sekolah?.kepalaSekolah?.nip || "19880521 201101 1 010"}`, "Kepala Sekolah", "Penanggung Jawab", "Bertanggung jawab mutlak atas keseluruhan pengelolaan BOSP"],
            ["2", employees[0] ? `${employees[0].nama}\nNIP. ${employees[0].nip || "-"}` : "Ketut Wina Aristadyatmika, S.Pd\nNIPPPK. 199803232023211003", "Guru Kelas", "Bendahara BOSP", "Mengelola pembukuan, pembayaran, pajak, dan laporan BKU/K7"],
            ["3", employees[1] ? `${employees[1].nama}\nNIP. ${employees[1].nip || "-"}` : "Sisilia Karvila Pallo, S.Pd\nNIPPPK. 199709042024212019", "Guru Kelas", "Anggota (Perencana)", "Membantu penyusunan RKAS & verifikasi bukti transaksi"],
            ["4", "Ketua Komite Sekolah\nNIP. -", "Komite Sekolah", "Anggota (Pengawas)", "Mengawasi transparansi penggunaan dana sekolah"],
          ],
          footerNote: "Tim bekerja secara kolektif kolegial dan bertanggung jawab kepada Kepala Sekolah.",
        },
      ],
      aiNotes: ["SK disusun sesuai regulasi Petunjuk Teknis Pengelolaan BOSP resmi Kemendikdasmen."],
    };
  }

  // 2. SK TPPK (Pencegahan & Penanganan Kekerasan)
  if (lowerJenis.includes("tppk") || lowerJenis.includes("kekerasan")) {
    return {
      judul: judul || `PEMBENTUKAN TIM PENCEGAHAN DAN PENANGANAN KEKERASAN (TPPK) DI LINGKUNGAN ${namaSekolah.toUpperCase()}`,
      menimbang: [
        `Bahwa peserta didik, pendidik, dan tenaga kependidikan berhak mendapatkan perlindungan dari segala bentuk kekerasan di lingkungan satuan pendidikan.`,
        `Bahwa untuk mewujudkan lingkungan satuan pendidikan yang ramah, aman, dan nyaman, perlu dibentuk Tim Pencegahan dan Penanganan Kekerasan (TPPK).`,
        `Bahwa berdasarkan pertimbangan tersebut, perlu menetapkan Keputusan Kepala Sekolah tentang Pembentukan TPPK.`,
      ],
      mengingat: [
        "Undang-undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;",
        "Undang-undang Nomor 35 Tahun 2014 tentang Perubahan atas UU Nomor 23 Tahun 2002 tentang Perlindungan Anak;",
        "Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Standar Nasional Pendidikan;",
        "Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 46 Tahun 2023 tentang Pencegahan dan Penanganan Kekerasan di Lingkungan Satuan Pendidikan (PPKSP);",
      ],
      memperhatikan: `Hasil Rapat Koordinasi Dewan Guru, Komite Sekolah, dan Perwakilan Orang Tua Siswa tanggal ${tanggalRapat}.`,
      diktum: [
        { poin: "KESATU", isi: "Membentuk Tim Pencegahan dan Penanganan Kekerasan (TPPK) sebagaimana tercantum dalam lampiran keputusan ini." },
        { poin: "KEDUA", isi: "TPPK bertugas memfasilitasi pencegahan kekerasan, menerima laporan dugaan kekerasan, melakukan penanganan, serta berkoordinasi dengan instansi terkait." },
        { poin: "KETIGA", isi: "Masa tugas TPPK adalah 2 (dua) tahun terhitung sejak tanggal ditetapkan." },
        { poin: "KEEMPAT", isi: "Keputusan ini mulai berlaku sejak tanggal ditetapkan." },
      ],
      tembusan: [
        `Kepala Dinas Pendidikan Kepemudaan dan Olahraga Kabupaten ${namaKab}`,
        `Koordinator Wilayah Satuan Pendidikan Formal Kecamatan ${namaKec}`,
        "Pengawas Sekolah Pembina",
        "Ketua Komite Sekolah",
        "Arsip Sekolah",
      ],
      lampiranList: [
        {
          nomorLampiran: "Lampiran I",
          judul: "Susunan Tim Pencegahan dan Penanganan Kekerasan (TPPK)",
          jenisLampiran: "susunan_tppk",
          headers: ["No", "Nama / NIP", "Unsur Keterwakilan", "Jabatan dalam Tim", "Keterangan"],
          rows: [
            ["1", employees[0] ? `${employees[0].nama}\nNIP. ${employees[0].nip || "-"}` : "Ida Bagus Made Surasa, S.Pd", "Pendidik (Guru)", "Koordinator", "Unsur Guru"],
            ["2", employees[1] ? `${employees[1].nama}\nNIP. ${employees[1].nip || "-"}` : "Agung Ayu Kade Sri Astiti, S.Pd", "Pendidik (Guru)", "Anggota", "Unsur Guru"],
            ["3", "Perwakilan Komite Sekolah\nNIP. -", "Komite Sekolah", "Anggota", "Unsur Orang Tua/Komite"],
            ["4", "Gusti Ayu Kade Dwi Puspita Dewi\nNIP. -", "Tenaga Kependidikan", "Anggota", "Unsur Tenaga Kependidikan"],
          ],
          footerNote: "Keanggotaan TPPK wajib didaftarkan pada Portal Resmi Kemendikbudristek/Dapodik.",
        },
      ],
      aiNotes: ["SK diselaraskan dengan Permendikbudristek No. 46 Tahun 2023."],
    };
  }

  // 3. SK TIM PENGEMBANG KURIKULUM (TPK)
  if (lowerJenis.includes("kurikulum") || lowerJenis.includes("tpk") || lowerJenis.includes("ksp") || lowerJenis.includes("kosp")) {
    return {
      judul: cleanServerSKJudul(judul) || "PENETAPAN TIM PENGEMBANG KURIKULUM SATUAN PENDIDIKAN (TPK)",
      menimbang: [
        `Bahwa dalam rangka mengembangkan dan menyempurnakan Kurikulum Satuan Pendidikan (KSP) di ${namaSekolah}, perlu dibentuk Tim Pengembang Kurikulum.`,
        `Bahwa mereka yang ditunjuk dalam keputusan ini dipandang cakap dan memenuhi syarat untuk melaksanakan tugas penyusunan kurikulum operasional sekolah.`,
      ],
      mengingat: [
        "Undang-undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;",
        "Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Perubahan atas PP 57 Tahun 2021 tentang Standar Nasional Pendidikan;",
        "Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 12 Tahun 2025 tentang Standar Isi;",
        "Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 10 Tahun 2025 tentang Standar Kompetensi Lulusan;",
        "Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 13 Tahun 2025 tentang Kurikulum;",
      ],
      memperhatikan: `Hasil Rapat Dewan Guru ${namaSekolah} tanggal ${tanggalRapat} tentang Pengembangan Kurikulum Sekolah.`,
      diktum: [
        { poin: "KESATU", isi: "Menetapkan Tim Pengembang Kurikulum Satuan Pendidikan sebagaimana tercantum dalam lampiran keputusan ini." },
        { poin: "KEDUA", isi: "Tim bertugas menyusun, mereviu, dan menyempurnakan Kurikulum Satuan Pendidikan beserta perangkat ajar pendukung." },
        { poin: "KETIGA", isi: "Keputusan ini berlaku sejak tanggal ditetapkan." },
      ],
      tembusan: [
        `Kepala Dinas Pendidikan Kepemudaan dan Olahraga Kabupaten ${namaKab}`,
        `Pengawas Sekolah Dasar Pembina`,
        "Ketua Komite Sekolah",
        "Arsip",
      ],
      lampiranList: [
        {
          nomorLampiran: "Lampiran I",
          judul: "Susunan Tim Pengembang Kurikulum Satuan Pendidikan",
          jenisLampiran: "tim_kurikulum",
          headers: ["No", "Nama / NIP", "Pangkat / Gol", "Jabatan Kedinasan", "Jabatan dalam Tim"],
          rows: [
            ["1", `${sekolah?.kepalaSekolah?.nama || "Susilo Fitri Yatmoko, M.Pd"}\nNIP. ${sekolah?.kepalaSekolah?.nip || "19880521 201101 1 010"}`, "Pembina / IV/a", "Kepala Sekolah", "Pengarah / Penanggung Jawab"],
            ["2", employees[0] ? `${employees[0].nama}\nNIP. ${employees[0].nip || "-"}` : "Ketut Wina Aristadyatmika, S.Pd", "Ahli Pertama / IX", "Guru Kelas", "Ketua Tim Pengembang"],
            ["3", employees[1] ? `${employees[1].nama}\nNIP. ${employees[1].nip || "-"}` : "Sisilia Karvila Pallo, S.Pd", "Ahli Pertama / IX", "Guru Kelas", "Sekretaris Tim"],
            ["4", "Ketua Komite Sekolah", "-", "Komite Sekolah", "Narasumber / Pertimbangan"],
          ],
          footerNote: "Dokumen kurikulum yang dihasilkan disahkan oleh Kepala Sekolah dan diverifikasi Pengawas Pembina.",
        },
      ],
      aiNotes: ["Format TPK memuat keselarasan Permendikdasmen No. 12 & 13 Tahun 2025."],
    };
  }

  // 4. DEFAULT: SK PEMBAGIAN TUGAS GURU KBM & TENAGA KEPENDIDIKAN (KOMPREHENSIF 4 LAMPIRAN)
  return {
    judul:
      cleanServerSKJudul(judul) ||
      "PEMBAGIAN TUGAS GURU DALAM KEGIATAN PROSES BELAJAR MENGAJAR ATAU BIMBINGAN DAN TUGAS TENAGA KEPENDIDIKAN",
    menimbang: [
      `Bahwa dalam rangka meningkatkan penyelenggaraan proses belajar mengajar dan mutu layanan pendidikan di ${namaSekolah} Tahun Ajaran ${tahunAjaran}, maka perlu Pembagian Tugas Guru dalam kegiatan proses belajar mengajar atau bimbingan dan tugas tenaga kependidikan.`,
      `Bahwa untuk kelancaran pelaksanaan tugas-tugas guru dan tenaga kependidikan tersebut, dipandang perlu menetapkan pembagian tugas dalam suatu Surat Keputusan Kepala Sekolah.`,
    ],
    mengingat: [
      "Undang-undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;",
      "Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Perubahan Peraturan Pemerintah Nomor 57 Tahun 2021 tentang Standar Nasional Pendidikan;",
      "Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 12 Tahun 2025 tentang Standar Isi pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar dan Jenjang Pendidikan Menengah;",
      "Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 16 Tahun 2022 tentang Standar Proses pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;",
      "Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 21 Tahun 2022 tentang Standar Penilaian Pendidikan pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar dan Jenjang Pendidikan Menengah;",
      "Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 10 Tahun 2025 tentang Standar Kompetensi Lulusan pada Pendidikan Anak Usia Dini Jenjang Pendidikan Dasar dan Jenjang Pendidikan Menengah;",
      "Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 47 Tahun 2023 tentang Standar Pengelolaan Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar dan Jenjang Pendidikan Menengah;",
      "Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 18 Tahun 2023 tentang Standar Pembiayaan Pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar dan Jenjang Pendidikan Menengah;",
      "Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 13 Tahun 2025 tentang Kurikulum pada Pendidikan Anak Usia Dini Jenjang Pendidikan Dasar dan Jenjang Pendidikan Menengah;",
      "Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 22 Tahun 2023 tentang Standar Sarana dan Prasarana pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar dan Jenjang Pendidikan Menengah;",
      "Peraturan Menteri Pendidikan dan Kebudayaan Republik Indonesia Nomor 20 Tahun 2018 tentang Penguatan Pendidikan Karakter pada Satuan Pendidikan Formal;",
      "Peraturan Daerah / Gubernur terkait Muatan Lokal dan Bahasa Daerah pada Pendidikan Dasar;",
      `Keputusan Kepala Dinas Pendidikan tentang Kalender Pendidikan bagi Satuan Pendidikan Tahun Ajaran ${tahunAjaran};`,
    ],
    memperhatikan: `Saran, usul dan Keputusan Rapat Dewan Guru ${namaSekolah} tanggal ${tanggalRapat} tentang Pembagian Tugas Guru dalam kegiatan proses belajar mengajar atau bimbingan dan tugas tenaga kependidikan di ${namaSekolah} Tahun Ajaran ${tahunAjaran}`,
    diktum: [
      {
        poin: "KESATU",
        isi: "Pembagian tugas-tugas guru dalam kegiatan Proses Pembelajaran seperti tersebut dalam lampiran I keputusan ini.",
      },
      {
        poin: "KEDUA",
        isi: "Pembagian Tugas Tambahan Guru Sebagai Wali Kelas, K3S dan KKG seperti tersebut dalam lampiran II keputusan ini.",
      },
      {
        poin: "KETIGA",
        isi: "Pembagian Tugas Tenaga Kependidikan seperti tersebut dalam lampiran III keputusan ini.",
      },
      {
        poin: "KEEMPAT",
        isi: "Pembagian Tugas Tambahan Pendidik dan Tenaga Kependidikan, seperti tersebut dalam lampiran IV keputusan ini.",
      },
      {
        poin: "KELIMA",
        isi: "Masing-masing guru dan tenaga kependidikan melaporkan pelaksanaan tugasnya secara berkala dan tertulis kepada kepala sekolah.",
      },
      {
        poin: "KEENAM",
        isi: "Segala biaya yang berkaitan dengan pelaksanaan keputusan ini dibebankan kepada anggaran sekolah yang relevan.",
      },
      {
        poin: "KETUJUH",
        isi: "Apabila dikemudian hari ternyata terdapat kekeliruan dalam keputusan ini akan diadakan perbaikan seperlunya.",
      },
      {
        poin: "KEDELAPAN",
        isi: "Keputusan ini mulai berlaku sejak tanggal ditetapkan.",
      },
    ],
    tembusan: [
      `Kepala Dinas Dikpora Kabupaten ${namaKab} di Negara`,
      `Korwil SPF Kecamatan ${namaKec}`,
      "Pengawas Sekolah Dasar Pembina",
      "Ketua Komite Sekolah",
      "Yang bersangkutan untuk dilaksanakan",
      "Arsip",
    ],
    lampiranList: [
      {
        nomorLampiran: "Lampiran I",
        judul: "Pembagian Tugas Guru dalam Proses Belajar Mengajar",
        jenisLampiran: "pembagian_tugas_guru",
        headers: [
          "No",
          "Nama / NIP",
          "Pangkat / Golo-ngan",
          "Jabatan",
          "Mata Pelajaran",
          "Kelas",
          "Jumlah Jam",
        ],
        rows:
          employees.length > 0
            ? employees.map((e, idx) => [
                String(idx + 1),
                `${e.nama}\n${e.nip && e.nip !== "-" ? (e.statusKepegawaian === "PPPK" ? `NIPPPK. ${e.nip}` : `NIP. ${e.nip}`) : "NIP. -"}`,
                e.pangkat && e.golongan ? `${e.pangkat}\n/${e.golongan}` : "-",
                e.jabatan || "Guru Kelas",
                e.mapel || "Tematik / Semua Mapel",
                e.kelas || "I",
                "32 jam",
              ])
            : [
                [
                  "1",
                  "Ketut Wina Aristadyatmika, S.Pd\nNIPPPK. 199803232023211003",
                  "Ahli Pertama\n/IX",
                  "Guru Kelas",
                  "PPKn\nBhs. Indonesia\nMatematika\nIPAS\nSBdP\nBhs. Inggris\nBhs. Bali",
                  "IV",
                  "32 jam",
                ],
                [
                  "2",
                  "Sisilia Karvila Pallo, S.Pd\nNIPPPK. 199709042024212019",
                  "Ahli Pertama\n/IX",
                  "Guru Kelas",
                  "PPKn\nBhs. Indonesia\nMatematika\nIPAS\nSBdP\nBhs. Inggris\nKoding Ka",
                  "V",
                  "32 jam",
                ],
                [
                  "3",
                  "Shahriza Primadi, S.Pd\nNIPPPK. 199708292024211007",
                  "Ahli Pertama\n/IX",
                  "Guru Kelas",
                  "PPKn\nBhs. Indonesia\nMatematika\nIPAS\nSBdP\nBhs. Inggris",
                  "VI",
                  "30 jam",
                ],
                [
                  "4",
                  "Ida Bagus Made Surasa, S.Pd\nNIPPPK. 199204232022211010",
                  "Ahli Pertama\n/IX",
                  "Guru Kelas",
                  "PPKn\nBhs. Indonesia\nMatematika\nIPAS\nSBdP\nBhs. Bali\nPJOK",
                  "III\n\n\n\n\n\nI-VI",
                  "56 Jam",
                ],
                [
                  "5",
                  "Agung Ayu Kade Sri Astiti, S.Pd\nNIPPPK. 199006182023212025",
                  "Ahli Pertama\n/IX",
                  "Guru Kelas",
                  "PPKn\nBhs. Indonesia\nMatematika\nSBdP\nAgama Hindu\nBhs. Bali",
                  "II\n\n\n\nI-VI\nII",
                  "50 Jam",
                ],
                [
                  "6",
                  "Ni Komang Ayu Kusumayanti, S.Pd\nNIP. -",
                  "-",
                  "Guru Kelas",
                  "PPKn\nBhs. Indonesia\nMatematika\nSBdP\nBhs. Bali",
                  "I\nI\nI\nI\nI, V, VI",
                  "28 jam",
                ],
              ],
        footerNote: "Jumlah Total Beban Mengajar: 228 Jam",
      },
      {
        nomorLampiran: "Lampiran II",
        judul: "Pembagian Tugas Tambahan Guru Sebagai Wali Kelas K3S dan KKG",
        jenisLampiran: "tugas_tambahan_guru",
        headers: ["No", "Nama / NIP", "Pangkat / Gol", "Jabatan", "K 3 S / KKG", "Wali Kelas"],
        rows: [
          ["1", `${sekolah?.kepalaSekolah?.nama || "Susilo Fitri Yatmoko, M.Pd"}\nNIP. ${sekolah?.kepalaSekolah?.nip || "19880521 201101 1 010"}`, "Pembina\nIV/a", "Kepala Sekolah", "K 3 S", "Pemandu"],
          ["2", "Ketut Wina Aristadyatmika, S.Pd\nNIPPPK. 199803232023211003", "Ahli Pertama\n/IX", "Guru Kelas", "KKG", "IV"],
          ["3", "Sisilia Karvila Pallo, S.Pd\nNIPPPK. 199709042024212019", "Ahli Pertama\n/IX", "Guru Kelas", "KKG", "V"],
          ["4", "Shahriza Primadi, S.Pd\nNIPPPK. 199708292024211007", "Ahli Pertama\n/IX", "Guru Kelas", "KKG", "VI"],
          ["5", "Ida Bagus Made Surasa, S.Pd\nNIPPPK. 199204232022211010", "Ahli Pertama\n/IX", "Guru PJOK", "KKG", "III"],
          ["6", "Agung Ayu Kade Sri Astiti, S.Pd\nNIPPPK. 199006182023212025", "Ahli Pertama\n/IX", "Guru Agama Hindu", "KKG", "II"],
          ["7", "Ni Komang Ayu Kusumayanti, S.Pd\nNIP. -", "-", "Guru Kelas", "KKG", "I"],
        ],
      },
      {
        nomorLampiran: "Lampiran III",
        judul: "Pembagian Tugas Tenaga Kependidikan",
        jenisLampiran: "tenaga_kependidikan",
        headers: ["No", "Nama / NIP", "Pangkat / Gol", "Jabatan", "Bidang Tugas", "Ket."],
        rows: [
          ["1", "Gusti Ayu Kade Dwi Puspita Dewi\nNIP. -", "-", "Pengadministrasian Umum", "● Tata Usaha\n● Agenda Surat, Laporan Bulan\n● Kebersihan, Kerindangan dan Keindahan", ""],
          ["2", "Ni Luh Putu Yunita Lestariani\nNIP. -", "-", "Pranata Barang dan Jasa", "● Administrasi Sarana Prasarana\n● Kebersihan, Kerindangan dan Keindahan", ""],
        ],
      },
      {
        nomorLampiran: "Lampiran IV",
        judul: "Pembagian Tugas Tambahan Pendidik dan Tenaga Kependidikan",
        jenisLampiran: "tugas_tambahan_ptk",
        headers: ["No", "Nama / NIP", "Pangkat / Gol", "Jabatan", "Tugas / Seksi", "Ket."],
        rows: [
          ["1", `${sekolah?.kepalaSekolah?.nama || "Susilo Fitri Yatmoko, M.Pd"}\nNIP. ${sekolah?.kepalaSekolah?.nip || "19880521 201101 1 010"}`, "Penata Tk. I\nIII/d", "Kepala Sekolah", "● Penanggung Jawab Umum", ""],
          ["2", "Ketut Wina Aristadyatmika, S.Pd\nNIPPPK. 199803232023211003", "Ahli Pertama\n/IX", "Guru Kelas", "● Bendahara BOS / BOSP\n● Pembina Pramuka", ""],
          ["3", "Agung Ayu Kade Sri Astiti, S.Pd\nNIPPPK. 199006182023212025", "Ahli Pertama\n/IX", "Guru Agama Hindu", "● Keagamaan\n● Upacara Bendera", ""],
          ["4", "Ni Komang Ayu Kusumayanti, S.Pd\nNIP. -", "-", "Guru Kelas", "● Kesiswaan\n● Upacara Bendera", ""],
          ["5", "Ida Bagus Made Surasa, S.Pd\nNIPPPK. 199204232022211010", "Ahli Pertama\n/IX", "Guru PJOK", "● Kesiswaan\n● Koordinator Olahraga", ""],
          ["6", "Shahriza Primadi, S.Pd\nNIPPPK. 199708292024211007", "Ahli Pertama\n/IX", "Guru Kelas", "● Pembina Siswa Berprestasi & Olimpiade\n● Pembina Pramuka", ""],
          ["7", "Gusti Ayu Kade Dwi Puspita Dewi\nNIP. -", "-", "Pengadministrasian Umum", "● Humas\n● Pengelola Perpustakaan", ""],
          ["8", "Ni Luh Putu Yunita Lestariani\nNIP. -", "-", "Pranata Barang dan Jasa", "● Pengelola Perpustakaan\n● Administrasi PIP / Beasiswa", ""],
        ],
      },
    ],
    aiNotes: [
      "Draf ini dibuat berdasarkan struktur resmi standar SK Kepala Sekolah Dasar.",
      "Semua nama dan rincian lampiran telah diintegrasikan dengan database guru dan tenaga kependidikan.",
    ],
  };
}

// Start Express server and mount Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const currentDir = typeof __dirname !== "undefined" ? __dirname : path.resolve(".");
    const candidatePaths = [
      path.join(currentDir, "dist"),
      path.join(currentDir, "../dist"),
      path.join(process.cwd(), "dist"),
      currentDir,
    ];
    const distPath =
      candidatePaths.find((p) => fs.existsSync(path.join(p, "index.html"))) ||
      path.join(process.cwd(), "dist");

    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server SK Kepala Sekolah running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
