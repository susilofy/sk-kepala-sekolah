import React, { useState, useEffect } from "react";
import {
  Monitor,
  Download,
  Copy,
  Check,
  X,
  FileCode,
  HardDrive,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Laptop,
  CheckCircle2,
  FolderOpen,
  Terminal,
  AlertTriangle,
  HelpCircle,
  Archive,
} from "lucide-react";

interface PortableExeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortableExeModal: React.FC<PortableExeModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mudah" | "exe">("mudah");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [exeStatus, setExeStatus] = useState<{
    available: boolean;
    fileName?: string;
    sizeMb?: string;
  } | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/status/portable-exe")
        .then((r) => r.json())
        .then((data) => setExeStatus(data))
        .catch(() => setExeStatus({ available: false }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallSuccess(true);
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Laptop className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Aplikasi Desktop Mandiri & Portabel
                </h2>
                <span className="bg-emerald-500/25 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/40 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> SDN 3 Loloan Timur
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pilih cara menjalankan aplikasi di laptop/PC Windows sekolah agar dapat dibuka langsung tanpa browser tab.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("mudah")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all cursor-pointer ${
              activeTab === "mudah"
                ? "bg-white text-indigo-900 border-t-2 border-indigo-600 border-x border-slate-200 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Monitor className="w-4 h-4 text-indigo-600" />
            <span>Cara 1: Pasang Langsung ke Desktop (Rekomendasi)</span>
            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-bold">
              1-Klik
            </span>
          </button>
          <button
            onClick={() => setActiveTab("exe")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all cursor-pointer ${
              activeTab === "exe"
                ? "bg-white text-indigo-900 border-t-2 border-indigo-600 border-x border-slate-200 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <HardDrive className="w-4 h-4 text-indigo-600" />
            <span>Cara 2: Kemas Jadi File .EXE Portabel</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {activeTab === "mudah" && (
            <div className="space-y-4">
              {/* Box Rekomendasi Utama */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-800 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-500/40">
                      Paling Praktis untuk Guru & Staf Sekolah
                    </span>
                    <h3 className="text-base font-bold text-white">
                      Pasang Aplikasi Langsung ke Komputer (Desktop App)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      Tidak memerlukan instalasi Node.js, tidak perlu menjalankan script .bat, dan tidak berisiko error! Aplikasi langsung menjadi ikon resmi di Desktop & Menu Start Windows.
                    </p>
                  </div>

                  {deferredPrompt ? (
                    <button
                      onClick={handleInstallClick}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all text-xs flex-shrink-0 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-950" />
                      <span>Pasang Sekarang (1-Klik)</span>
                    </button>
                  ) : installSuccess ? (
                    <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Aplikasi Terpasang!</span>
                    </div>
                  ) : (
                    <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center sm:text-right flex-shrink-0">
                      <span className="text-[11px] text-amber-300 font-semibold block">
                        Tersedia di Browser Anda:
                      </span>
                      <span className="text-[10px] text-slate-300">
                        Klik ikon <strong>Install</strong> di bilah alamat browser
                      </span>
                    </div>
                  )}
                </div>

                {/* Panduan Visual 2 Langkah */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-xs text-indigo-200 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    <span>Langkah Memasang Lewat Google Chrome atau Microsoft Edge:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-300">
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-white/10 space-y-1">
                      <strong className="text-amber-300 block">1. Perhatikan Ujung Kanan Address Bar</strong>
                      <p>
                        Di bagian kanan atas tempat Anda mengetik alamat website (URL), cari ikon monitor dengan tanda panah ke bawah atau tombol <strong>"Pasang Aplikasi" / "Install App"</strong>.
                      </p>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-white/10 space-y-1">
                      <strong className="text-emerald-300 block">2. Klik "Install" / "Pasang"</strong>
                      <p>
                        Ikon SDN 3 Loloan Timur akan langsung dibuat di Desktop komputer. Saat diklik, aplikasi terbuka di jendelanya sendiri seperti program Windows biasa!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manfaat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <strong className="text-slate-800 block text-xs">🚀 Bebas Error Teknis</strong>
                  <p className="text-[11px] text-slate-600">
                    Tidak memerlukan keahlian IT, tidak perlu buka terminal hitam (CMD), dan tidak memerlukan instalasi Node.js.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <strong className="text-slate-800 block text-xs">⚡ Buka dari Desktop</strong>
                  <p className="text-[11px] text-slate-600">
                    Dapat dibuka kapan saja lewat shortcut di Desktop dan taskbar Windows dengan 1 kali klik.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <strong className="text-slate-800 block text-xs">🔄 Selalu Terupdate</strong>
                  <p className="text-[11px] text-slate-600">
                    Setiap ada perbaikan data atau format SK terbaru, aplikasi otomatis memperbarui dirinya sendiri.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "exe" && (
            <div className="space-y-4">
              {/* Kotak Peringatan Kenapa File Bat Menutup Sendiri */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Kenapa file BUAT_EXE_PORTABEL.bat sempat terbuka lalu langsung tertutup?</span>
                </div>
                <div className="text-[11px] text-amber-950 space-y-1 leading-relaxed pl-6">
                  <p>
                    <strong>1. File .bat dijalankan sendirian di folder Downloads:</strong> File script memerlukan seluruh berkas sumber program (folder <code>src</code>, <code>package.json</code>, dll). Jika file bat berdiri sendiri di Downloads, proses tidak dapat menemukan programnya.
                  </p>
                  <p>
                    <strong>2. Komputer Windows belum terpasang Node.js:</strong> Untuk mengompilasi file EXE di Windows, komputer harus memiliki Node.js LTS gratis dari <strong>nodejs.org</strong>.
                  </p>
                </div>
              </div>

              {/* Unduhan Paket Lengkap */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                      Langkah 1 (Wajib)
                    </span>
                    <h4 className="font-bold text-indigo-950 text-sm mt-1">
                      Unduh Paket Lengkap Proyek Aplikasi (.ZIP)
                    </h4>
                    <p className="text-[11px] text-indigo-800">
                      Berisi seluruh berkas program lengkap dan file script perbaikan <code>BUAT_EXE_PORTABEL.bat</code> di dalamnya.
                    </p>
                  </div>
                  <a
                    href="/api/download/paket-lengkap-zip"
                    download="Aplikasi-SK-Sekolah-Lengkap.zip"
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-xs flex-shrink-0 cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Unduh Paket ZIP Lengkap</span>
                  </a>
                </div>
              </div>

              {/* Langkah Eksekusi yang Benar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Urutan Langkah Membuat File EXE yang Benar:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[11px]">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 shadow-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center font-bold text-[10px]">
                      1
                    </span>
                    <strong className="block text-slate-800">Unduh ZIP Lengkap</strong>
                    <p className="text-slate-600 text-[10px]">
                      Klik tombol unduh paket ZIP di atas.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 shadow-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center font-bold text-[10px]">
                      2
                    </span>
                    <strong className="block text-slate-800">Ekstrak ZIP</strong>
                    <p className="text-slate-600 text-[10px]">
                      Klik kanan berkas ZIP &rarr; <em>Extract All</em> ke folder (misal di Dokumen atau Desktop).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 shadow-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center font-bold text-[10px]">
                      3
                    </span>
                    <strong className="block text-slate-800">Pasang Node.js</strong>
                    <p className="text-slate-600 text-[10px]">
                      Pastikan pasang Node.js LTS dari <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-blue-600 underline">nodejs.org</a> (cukup 1 kali).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 shadow-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center font-bold text-[10px]">
                      4
                    </span>
                    <strong className="block text-slate-800">Klik 2x File .BAT</strong>
                    <p className="text-slate-600 text-[10px]">
                      Buka folder hasil ekstrak, klik 2x <code>BUAT_EXE_PORTABEL.bat</code>. File EXE akan selesai dibuat!
                    </p>
                  </div>
                </div>
              </div>

              {/* Unduh Script Cadangan */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200 gap-2">
                <div className="text-[11px] text-slate-600">
                  Sudah punya folder proyek dan hanya butuh file script perbaikan terbaru?
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/api/download/buat-exe-bat"
                    download="BUAT_EXE_PORTABEL.bat"
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Script .BAT Terbaru</span>
                  </a>
                  <a
                    href="/api/download/panduan-exe"
                    download="PANDUAN_EXE_PORTABEL.md"
                    className="flex items-center gap-1.5 border border-slate-300 hover:bg-white text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Panduan .MD</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Aplikasi SK & Surat Tugas Sekolah • SDN 3 Loloan Timur
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
