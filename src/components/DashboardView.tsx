import React from "react";
import { SKDocument, SchoolProfile, Employee } from "../types";
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  Download,
  Eye,
  Bot,
  AlertCircle,
  ArrowRight,
  FileSpreadsheet,
  Award,
  Sparkles,
  ClipboardCheck,
  Laptop,
} from "lucide-react";
import { exportSKToDocx } from "../utils/docxGenerator";

interface DashboardViewProps {
  documents: SKDocument[];
  schoolProfile: SchoolProfile;
  employees: Employee[];
  onOpenNewSK: () => void;
  onPreviewSK: (doc: SKDocument) => void;
  onOpenAssistant: () => void;
  onOpenPortableModal?: () => void;
  onNavigateTab: (tab: string, filterStatus?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  schoolProfile,
  employees,
  onOpenNewSK,
  onPreviewSK,
  onOpenAssistant,
  onOpenPortableModal,
  onNavigateTab,
}) => {
  const publishedDocs = documents.filter(
    (d) =>
      d.status === "published" ||
      d.status === "disahkan" ||
      d.status === "siap_cetak" ||
      d.status === "diarsipkan"
  );
  const draftDocs = documents.filter((d) => d.status === "draft");

  const totalGuru = employees.filter((e) => e.jenisPTK.toLowerCase().includes("guru")).length;
  const totalTendik = employees.filter((e) => !e.jenisPTK.toLowerCase().includes("guru")).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Asisten Administrasi Kepala Sekolah Dasar Terpadu</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Selamat Datang, {schoolProfile.kepalaSekolah.nama}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Sistem terintegrasi untuk menyusun, mengelola, memvalidasi kepatuhan hukum, dan
            mengunduh dokumen resmi <strong>Surat Keputusan (SK) & Surat Perintah Tugas (SPT)</strong> dalam
            format Microsoft Word (.docx) siap cetak dan tanda tangan.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              id="btn-dash-new-sk"
              onClick={onOpenNewSK}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Susun SK Baru dengan AI</span>
            </button>

            <button
              id="btn-dash-surat-tugas"
              onClick={() => onNavigateTab("surat-tugas")}
              className="flex items-center gap-2 bg-emerald-700/80 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold border border-emerald-500/40 transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-300" />
              <span>Buat Surat Tugas (SPT)</span>
            </button>

            <button
              id="btn-dash-ask-ai"
              onClick={onOpenAssistant}
              className="flex items-center gap-2 bg-slate-700/80 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold border border-slate-600 transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Konsultasi AI Asisten KS</span>
            </button>

            {onOpenPortableModal && (
              <button
                id="btn-dash-portable-exe"
                onClick={onOpenPortableModal}
                className="flex items-center gap-2 bg-indigo-700/80 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold border border-indigo-500/40 transition-all cursor-pointer"
              >
                <Laptop className="w-4 h-4 text-indigo-300" />
                <span>Aplikasi .EXE Portabel</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <FileText className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          id="btn-stat-sk-terbit"
          onClick={() => onNavigateTab("arsip", "published")}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-700 transition-colors">
              Total SK Terbit
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{publishedDocs.length}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-emerald-600 font-medium">
            <span>Buka Arsip Resmi</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          id="btn-stat-sk-draf"
          onClick={() => {
            if (draftDocs.length > 0) {
              onNavigateTab("arsip", "draft");
            } else {
              onOpenNewSK();
            }
          }}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-amber-700 transition-colors">
              Draf / Perlu Finalisasi
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{draftDocs.length}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-amber-600 font-medium">
            <span>{draftDocs.length > 0 ? "Buka Daftar Draf" : "Susun Draf Baru +"}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          id="btn-stat-ptk-guru"
          onClick={() => onNavigateTab("ptk")}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-700 transition-colors">
              Pendidik (Guru)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalGuru} Orang</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-blue-600 font-medium">
            <span>Kelola Guru Kelas & Mapel</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          id="btn-stat-ptk-tendik"
          onClick={() => onNavigateTab("ptk")}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-purple-700 transition-colors">
              Tenaga Kependidikan
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition-all">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalTendik} Orang</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-purple-600 font-medium">
            <span>Kelola TU, Perpus & Operator</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>

      {/* Main Content Split: Recent SK Documents vs Quick Administrative Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dokumen SK Terbaru */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Dokumen SK Terbaru</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Arsip keputusan resmi kepala sekolah yang telah disusun
                </p>
              </div>

              <button
                onClick={() => onNavigateTab("arsip")}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua Arsip</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {documents.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {doc.nomor}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          doc.status === "published"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {doc.status === "published" ? "Resmi Terbit" : "Draf"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        T.A. {doc.tahunAjaran}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {doc.judul}
                    </h4>

                    <p className="text-[11px] text-slate-500">
                      Ditetapkan: {doc.tempatTetap}, {doc.tanggalTetap} • {doc.lampiranList.length}{" "}
                      Lampiran Resmi
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onPreviewSK(doc)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat A4</span>
                    </button>

                    <button
                      onClick={() => exportSKToDocx(doc, schoolProfile)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                      title="Download format Word .docx"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.docx</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Administrative Tasks & AI Suggestions */}
        <div className="space-y-4">
          {/* Card Surat Tugas */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 p-5 rounded-xl border border-emerald-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-700" />
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Surat Perintah Tugas (SPT)
              </h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Buat surat tugas kedinasan resmi guru/PTK (bimtek, diklat, pendampingan lomba siswa, pengawas ANBK) lengkap dengan cetak A4 dan ekspor Word (.docx).
            </p>
            <button
              onClick={() => onNavigateTab("surat-tugas")}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Buka Menu Surat Tugas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Assistance Box */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Konsultasi AI Regulasi Pendidikan
              </h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Tanyakan rujukan Permendikbudristek, susunan panitia Asesmen Nasional (ANBK), tim
              BOSP, pembagian jam mengajar 24 jam untuk sertifikasi guru, atau tata cara pembentukan
              TPPK di sekolah dasar.
            </p>
            <button
              onClick={onOpenAssistant}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Buka Asisten Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Agenda & Kalender SK Tahunan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>SK Wajib Awal Tahun Ajaran</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">SK Pembagian Tugas Guru (KBM)</p>
                  <p className="text-[11px] text-slate-500">Juli / Awal Semester Ganjil</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Wajib
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">SK Tim BOSP / BOS Sekolah</p>
                  <p className="text-[11px] text-slate-500">Awal Tahun Anggaran / Januari</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Wajib
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">SK Tim Pencegahan Kekerasan (TPPK)</p>
                  <p className="text-[11px] text-slate-500">Sesuai Permendikbudristek 46/2023</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Wajib
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
