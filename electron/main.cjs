const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");
const { fork } = require("child_process");

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let serverProcess = null;
let activePort = 3000;

// Find an available TCP port starting from preferredPort
function getAvailablePort(preferredPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => {
      // Port in use, try next
      resolve(getAvailablePort(preferredPort + 1));
    });
    server.listen(preferredPort, "127.0.0.1", () => {
      server.close(() => {
        resolve(preferredPort);
      });
    });
  });
}

// Wait until HTTP server responds on /api/health
function waitForServer(url, timeoutMs = 20000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      const req = http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on("error", () => {
        retry();
      });
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    }

    function retry() {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error("Server start timeout"));
      } else {
        setTimeout(check, 250);
      }
    }

    check();
  });
}

// Determine data directory for portable mode or standard mode
function getDataDirectory() {
  try {
    // If portable executable, check if folder next to exe is writable
    const exeDir = path.dirname(app.getPath("exe"));
    const portableDataPath = path.join(exeDir, "data-sekolah");
    
    // Test write permission in exe folder (only if not in temporary dir)
    if (!exeDir.toLowerCase().includes("temp") && !exeDir.toLowerCase().includes("appdata\\local\\temp")) {
      if (!fs.existsSync(portableDataPath)) {
        fs.mkdirSync(portableDataPath, { recursive: true });
      }
      return portableDataPath;
    }
  } catch (err) {
    // Fallback to userData
  }
  return path.join(app.getPath("userData"), "data-sekolah");
}

// Simple parser for .env files without extra dependencies
function parseEnvFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx > 0) {
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        result[key] = val;
      }
    }
  } catch (e) {
    console.warn("Could not read .env file at:", filePath, e);
  }
  return result;
}

// Ensure helpful AI instructions file is present in data directory
function ensureAIInstructions(dataDir) {
  try {
    const guidePath = path.join(dataDir, "PETUNJUK_MENGAKTIFKAN_AI.txt");
    const exampleEnvPath = path.join(dataDir, ".env.example");
    if (!fs.existsSync(guidePath)) {
      const guideText = `========================================================================
PANDUAN MENGAKTIFKAN FITUR AI GOOGLE GEMINI DI APLIKASI DESKTOP
Aplikasi SK & Surat Tugas Sekolah - SDN 3 Loloan Timur
========================================================================

Fitur AI (Pembuat SK Otomatis & Asisten Konsultasi Regulasi) menggunakan
teknologi resmi Google Gemini.

Di komputer lokal/laptop setelah diinstal, fitur AI memerlukan:
1. Koneksi Internet aktif pada saat memproses draf AI.
2. Kunci Akses (Gemini API Key) dari Google AI Studio (100% GRATIS).

------------------------------------------------------------------------
CARA MENDAPATKAN DAN MEMASANG API KEY (HANYA SEKALI):
------------------------------------------------------------------------
Langkah 1:
- Buka browser dan buka alamat: https://aistudio.google.com/apikey
- Masuk dengan akun Google (Gmail) Anda.
- Klik tombol biru "Create API key".
- Salin kunci API yang muncul (kode diawali 'AIzaSy...').

Langkah 2:
- Di dalam folder ini (${dataDir}), buat atau edit file bernama:
  .env
  (atau salin file .env.example menjadi .env)

Langkah 3:
- Buka file .env tersebut dengan Notepad, lalu isi baris berikut:
  GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

- Simpan (Save/Ctrl+S) file tersebut.

Langkah 4:
- Tutup dan buka kembali Aplikasi SK Sekolah.
- Fitur Asisten AI dan Generator SK Cerdas kini langsung aktif penuh!

Catatan:
Jika komputer sedang offline (tanpa internet) atau tanpa kunci API,
aplikasi TETAP BISA DIGUNAKAN 100% untuk menyusun SK dan Surat Tugas
menggunakan template dinas standar bawaan yang sudah lengkap di aplikasi.
========================================================================`;
      fs.writeFileSync(guidePath, guideText, "utf-8");
    }

    if (!fs.existsSync(exampleEnvPath)) {
      fs.writeFileSync(
        exampleEnvPath,
        `# Masukkan Gemini API Key gratis Anda dari https://aistudio.google.com/apikey\nGEMINI_API_KEY=\n`,
        "utf-8"
      );
    }
  } catch (err) {}
}

async function startBackendServer(port) {
  const isDev = !app.isPackaged && process.env.NODE_ENV === "development";
  const dataDir = getDataDirectory();
  
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (e) {}
  }

  ensureAIInstructions(dataDir);

  // Discover and merge .env from candidate locations (portable exe folder, data-sekolah, app root)
  const candidateEnvs = [
    path.join(process.cwd(), ".env"),
    path.join(dataDir, ".env"),
    path.join(path.dirname(app.getPath("exe")), ".env"),
    path.join(__dirname, "../.env"),
  ];

  const loadedEnv = {};
  for (const envFile of candidateEnvs) {
    if (fs.existsSync(envFile)) {
      Object.assign(loadedEnv, parseEnvFile(envFile));
    }
  }

  const serverScript = isDev
    ? path.join(__dirname, "../server.ts")
    : path.join(__dirname, "../dist/server.cjs");

  const env = {
    ...process.env,
    ...loadedEnv,
    PORT: String(port),
    NODE_ENV: isDev ? "development" : "production",
    APP_DATA_PATH: dataDir,
  };

  if (isDev) {
    // In dev, tsx is used
    serverProcess = fork(serverScript, [], {
      env,
      execArgv: ["--import", "tsx"],
      stdio: "inherit",
    });
  } else {
    // In packaged app, run bundled server.cjs
    serverProcess = fork(serverScript, [], {
      env,
      stdio: "inherit",
    });
  }

  serverProcess.on("error", (err) => {
    console.error("Backend process error:", err);
  });

  serverProcess.on("exit", (code) => {
    if (code !== 0 && !app.isQuitting) {
      console.warn("Backend server exited with code:", code);
    }
  });

  // Wait for server to become healthy
  const healthUrl = `http://127.0.0.1:${port}/api/health`;
  await waitForServer(healthUrl);
}

function createMainWindow(port) {
  const iconPath = path.join(__dirname, "../public/icon.png");

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: "Aplikasi SK & Surat Tugas Sekolah - SDN 3 Loloan Timur",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const appUrl = `http://127.0.0.1:${port}`;
  mainWindow.loadURL(appUrl);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links (https/http) in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  buildAppMenu();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function buildAppMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about", label: "Tentang Aplikasi" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide", label: "Sembunyikan" },
              { role: "hideOthers", label: "Sembunyikan Lainnya" },
              { role: "unhide", label: "Tampilkan Semua" },
              { type: "separator" },
              { role: "quit", label: "Keluar" },
            ],
          },
        ]
      : []),
    {
      label: "Berkas",
      submenu: [
        {
          label: "Cetak Dokumen (Print)",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.print({ silent: false, printBackground: true });
            }
          },
        },
        {
          label: "Buka Folder Data Tersimpan",
          click: () => {
            const dataDir = getDataDirectory();
            if (fs.existsSync(dataDir)) {
              shell.openPath(dataDir);
            } else {
              shell.openPath(app.getPath("userData"));
            }
          },
        },
        { type: "separator" },
        {
          label: "Keluar",
          accelerator: isMac ? "Cmd+Q" : "Alt+F4",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo", label: "Batalkan (Undo)" },
        { role: "redo", label: "Ulangi (Redo)" },
        { type: "separator" },
        { role: "cut", label: "Potong" },
        { role: "copy", label: "Salin" },
        { role: "paste", label: "Tempel" },
        { role: "selectAll", label: "Pilih Semua" },
      ],
    },
    {
      label: "Tampilan",
      submenu: [
        { role: "reload", label: "Muat Ulang (Reload)", accelerator: "CmdOrCtrl+R" },
        { role: "forceReload", label: "Muat Ulang Paksa", accelerator: "CmdOrCtrl+Shift+R" },
        { type: "separator" },
        { role: "resetZoom", label: "Ukuran Normal (100%)" },
        { role: "zoomIn", label: "Perbesar" },
        { role: "zoomOut", label: "Perkecil" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Layar Penuh (Fullscreen)", accelerator: "F11" },
      ],
    },
    {
      label: "Bantuan",
      submenu: [
        {
          label: "Petunjuk Mengaktifkan Fitur AI (Google Gemini)",
          click: () => {
            const dataDir = getDataDirectory();
            const guidePath = path.join(dataDir, "PETUNJUK_MENGAKTIFKAN_AI.txt");
            if (fs.existsSync(guidePath)) {
              shell.openPath(guidePath);
            } else {
              shell.openPath(dataDir);
            }
          },
        },
        {
          label: "Dapatkan Gemini API Key Gratis di Google AI Studio",
          click: () => {
            shell.openExternal("https://aistudio.google.com/apikey");
          },
        },
        { type: "separator" },
        {
          label: "Buka Folder Data & Pengaturan (.env)",
          click: () => {
            shell.openPath(getDataDirectory());
          },
        },
        { type: "separator" },
        {
          label: "Tentang Aplikasi SK Sekolah",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Tentang Aplikasi SK Sekolah",
              message: "Aplikasi SK & Surat Tugas Sekolah",
              detail:
                "Versi 1.0.0 (Edisi Portabel Offline Windows)\n" +
                "Dikembangkan untuk Satuan Pendidikan Formal (SDN 3 Loloan Timur)\n" +
                "Kreator: Susilo Fitri Yatmoko, M.Pd (Guru Merangkum)\n\n" +
                "Fitur:\n" +
                "• Penyusunan SK Dinas Standar Regulasi Kemendikdasmen\n" +
                "• Pembuatan Surat Perintah Tugas (SPT) Resmi\n" +
                "• Ekspor Dokumen Word (.docx) & Siap Cetak A4\n" +
                "• Bekerja Mandiri & Tersimpan Aman Tanpa Internet\n" +
                "• Integrasi Google Gemini AI untuk Pembuatan Draf Cerdas",
              buttons: ["Tutup"],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Single instance handler: focus existing window if user runs app again
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  try {
    activePort = await getAvailablePort(3000);
    await startBackendServer(activePort);
    createMainWindow(activePort);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(activePort);
      }
    });
  } catch (err) {
    console.error("Failed to launch desktop application:", err);
    dialog.showErrorBox(
      "Gagal Memulai Aplikasi",
      "Terjadi kendala saat menginisialisasi server lokal: " + (err.message || String(err))
    );
    app.quit();
  }
});

// Clean up server child process on exit
function cleanup() {
  app.isQuitting = true;
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {}
    serverProcess = null;
  }
}

app.on("before-quit", cleanup);
app.on("will-quit", cleanup);

app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
