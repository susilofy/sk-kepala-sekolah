import React, { useState, useEffect } from "react";
import { SKDocument, SchoolProfile, ComplianceReport, ComplianceItem, SKDiktum } from "../types";
import { exportSKToDocx } from "../utils/docxGenerator";
import { cleanSKJudul } from "../utils/skFormatter";
import { defaultKopSuratSDN3LoloanTimur } from "../data/defaultKopImage";
import { loadActiveKopImage, saveDefaultSKParams } from "../utils/storage";
import {
  Download,
  Printer,
  ShieldCheck,
  Edit3,
  ArrowLeft,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Save,
  X,
  BookmarkCheck,
} from "lucide-react";

interface SKPreviewViewProps {
  document: SKDocument;
  schoolProfile: SchoolProfile;
  onEdit: (doc: SKDocument) => void;
  onBack: () => void;
  onSaveToArchive: (doc: SKDocument) => void;
}

export const SKPreviewView: React.FC<SKPreviewViewProps> = ({
  document: doc,
  schoolProfile,
  onEdit,
  onBack,
  onSaveToArchive,
}) => {
  const [currentDoc, setCurrentDoc] = useState<SKDocument>(doc);
  const [isExporting, setIsExporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<ComplianceReport | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<SKDocument>(doc);
  const [activeEditTab, setActiveEditTab] = useState<"pokok" | "konsiderans" | "diktum" | "lampiran">("pokok");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeKopUrl, setActiveKopUrl] = useState<string>(() => {
    return schoolProfile.kopSuratUrl && !schoolProfile.kopSuratUrl.startsWith("indexeddb:")
      ? schoolProfile.kopSuratUrl
      : defaultKopSuratSDN3LoloanTimur;
  });

  useEffect(() => {
    loadActiveKopImage(schoolProfile.kopSuratUrl || defaultKopSuratSDN3LoloanTimur).then((resolved) => {
      if (resolved && resolved !== "indexeddb:active") {
        setActiveKopUrl(resolved);
      }
    });
  }, [schoolProfile.kopSuratUrl]);

  useEffect(() => {
    setCurrentDoc(doc);
    setEditForm(doc);
  }, [doc]);

  const handleDownloadWord = async () => {
    try {
      setIsExporting(true);
      await exportSKToDocx(currentDoc, {
        ...schoolProfile,
        kopSuratUrl: activeKopUrl,
        kopMode: activeKopUrl ? "gambar" : schoolProfile.kopMode,
      });
    } catch (err) {
      console.error("Export word failed:", err);
      alert("Gagal mengekspor dokumen Word (.docx). Silakan periksa data.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleValidateCompliance = async () => {
    setIsValidating(true);
    setShowValidationModal(true);
    try {
      const res = await fetch("/api/gemini/validate-sk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: currentDoc,
          sekolah: schoolProfile,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setValidationReport(data.report);
      }
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveEdit = () => {
    const cleanedJudul = cleanSKJudul(editForm.judul, editForm.tahunAjaran);
    const cleaned: SKDocument = {
      ...editForm,
      judul: cleanedJudul,
      updatedAt: new Date().toISOString(),
    };
    saveDefaultSKParams({
      tahunAjaran: cleaned.tahunAjaran,
      tanggalTetap: cleaned.tanggalTetap,
      tempatTetap: cleaned.tempatTetap,
      tanggalRapat: cleaned.tanggalRapat || cleaned.memperhatikan,
      memperhatikan: cleaned.memperhatikan,
    });
    setCurrentDoc(cleaned);
    onSaveToArchive(cleaned);
    setShowEditModal(false);
    setToastMessage("Perubahan dokumen SK berhasil disimpan!");
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Bar (Hidden on print) */}
      <div className="no-print bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Pratinjau Dokumen Resmi A4
            </span>
            <h2 className="text-base font-bold text-slate-900 truncate max-w-lg mt-0.5">
              {currentDoc.judul}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-val-compliance"
            onClick={handleValidateCompliance}
            className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>AI Checker (17 Poin)</span>
          </button>

          <button
            id="btn-edit-current-sk"
            onClick={() => {
              setEditForm(JSON.parse(JSON.stringify(currentDoc)));
              setActiveEditTab("pokok");
              setShowEditModal(true);
            }}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="Edit dan sesuaikan isi dokumen SK ini"
          >
            <Edit3 className="w-4 h-4 text-amber-700" />
            <span>Edit Dokumen</span>
          </button>

          <button
            id="btn-print-sk"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>

          <button
            id="btn-download-word"
            onClick={handleDownloadWord}
            disabled={isExporting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyiapkan .docx...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Word (.docx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* A4 PAPER CONTAINER */}
      <div className="bg-white shadow-lg border border-slate-300 rounded-sm p-8 sm:p-14 font-serif text-slate-900 leading-relaxed max-w-[850px] mx-auto min-h-[1100px] text-[13px] print:shadow-none print:border-none print:p-0 print:m-0">
        {/* --- KOP SURAT --- */}
        {schoolProfile.kopMode === "gambar" && activeKopUrl ? (
          <div className="pb-3 border-b-2 border-black border-double pt-1 text-center">
            <img
              src={activeKopUrl}
              alt="Kop Surat Resmi Satuan Pendidikan"
              className="w-full max-h-[160px] object-contain mx-auto block"
            />
          </div>
        ) : (
          <div className="text-center pb-3 border-b-2 border-black border-double pt-2">
            <p className="text-sm font-bold tracking-wide uppercase">
              {schoolProfile.pemerintahDaerah}
            </p>
            <p className="text-sm font-bold tracking-wide uppercase">
              {schoolProfile.dinasPendidikan}
            </p>
            <p className="text-base font-extrabold tracking-wider mt-0.5 uppercase">
              {schoolProfile.namaKop || schoolProfile.nama}
            </p>
            <p className="text-[11px] italic font-sans text-slate-700 mt-1">
              {schoolProfile.alamat}, Desa {schoolProfile.desa}, Kec. {schoolProfile.kecamatan}, Kab.{" "}
              {schoolProfile.kabupaten}. Kode Pos: {schoolProfile.kodePos}. Email:{" "}
              {schoolProfile.email}
              {schoolProfile.telepon ? ` | Telp: ${schoolProfile.telepon}` : ""}
            </p>
          </div>
        )}

        {/* --- JUDUL SK --- */}
        <div className="text-center my-6 space-y-1">
          <p className="font-bold text-sm uppercase">
            KEPUTUSAN KEPALA {schoolProfile.nama.toUpperCase()}
          </p>
          <p className="font-bold text-[13px]">NOMOR : {currentDoc.nomor}</p>
          <p className="font-bold text-xs pt-1 uppercase tracking-wider">TENTANG</p>
          <p
            id="sk-preview-title"
            className="font-bold text-sm uppercase max-w-xl mx-auto pt-1 leading-snug"
          >
            {cleanSKJudul(currentDoc.judul, currentDoc.tahunAjaran)}
          </p>
          <p className="font-bold text-xs uppercase pt-1">
            TAHUN AJARAN {currentDoc.tahunAjaran}
          </p>
        </div>

        {/* --- KONSIDERANS --- */}
        <div className="space-y-3.5 my-6 text-justify">
          {/* Menimbang */}
          <div className="grid grid-cols-[110px_20px_1fr] gap-1 items-start">
            <span className="font-bold">Menimbang</span>
            <span>:</span>
            <div className="space-y-1.5">
              {currentDoc.menimbang.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[20px_1fr] gap-1 items-start">
                  <span>{String.fromCharCode(97 + idx)}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mengingat */}
          <div className="grid grid-cols-[110px_20px_1fr] gap-1 items-start pt-2">
            <span className="font-bold">Mengingat</span>
            <span>:</span>
            <div className="space-y-1.5">
              {currentDoc.mengingat.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[20px_1fr] gap-1 items-start">
                  <span>{String.fromCharCode(97 + idx)}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Memperhatikan */}
          <div className="grid grid-cols-[110px_20px_1fr] gap-1 items-start pt-2">
            <span className="font-bold">Memperhatikan</span>
            <span>:</span>
            <div>{currentDoc.memperhatikan}</div>
          </div>
        </div>

        {/* --- MEMUTUSKAN --- */}
        <div className="text-center my-6">
          <p className="font-bold text-sm tracking-wider">MEMUTUSKAN</p>
        </div>

        <div className="space-y-3.5 text-justify">
          <p className="font-bold">Menetapkan :</p>
          {currentDoc.diktum.map((d, idx) => (
            <div key={idx} className="grid grid-cols-[110px_20px_1fr] gap-1 items-start">
              <span className="font-bold uppercase">{d.poin}</span>
              <span>:</span>
              <span>{d.isi}</span>
            </div>
          ))}
        </div>

        {/* --- TANDA TANGAN KEPALA SEKOLAH --- */}
        <div className="mt-10 grid grid-cols-2 text-xs">
          <div></div>
          <div className="space-y-1 pl-6">
            <p>Ditetapkan di : {currentDoc.tempatTetap}</p>
            <p>Pada tanggal : {currentDoc.tanggalTetap}</p>
            <p className="font-bold pt-2 pb-16">Kepala {schoolProfile.nama}</p>
            <p className="font-bold underline text-sm">{currentDoc.kepalaSekolah.nama}</p>
            <p>NIP : {currentDoc.kepalaSekolah.nip}</p>
          </div>
        </div>

        {/* --- TEMBUSAN --- */}
        <div className="mt-8 text-xs border-t border-slate-200 pt-3">
          <p className="font-bold underline mb-1">Tembusan disampaikan kepada Yth:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-700">
            {currentDoc.tembusan.map((t, idx) => (
              <li key={idx}>{t}</li>
            ))}
          </ol>
        </div>

        {/* --- LAMPIRAN-LAMPIRAN (PAGE BREAK FOR PRINT) --- */}
        {currentDoc.lampiranList &&
          currentDoc.lampiranList.map((att, attIdx) => (
            <div
              key={att.id || attIdx}
              className="mt-14 pt-8 border-t-2 border-dashed border-slate-300 print:break-before-page"
            >
              {/* Kop Lampiran */}
              <div className="grid grid-cols-[140px_16px_1fr] text-xs font-sans mb-6">
                <span className="font-bold">{att.nomorLampiran}</span>
                <span>:</span>
                <span className="font-bold">Keputusan Kepala {schoolProfile.nama}</span>

                <span>Nomor</span>
                <span>:</span>
                <span>{currentDoc.nomor}</span>

                <span>Tanggal</span>
                <span>:</span>
                <span>{currentDoc.tanggalTetap}</span>

                <span>Tentang</span>
                <span>:</span>
                <span className="font-bold uppercase">{att.judul}</span>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-slate-200 text-black text-center font-bold">
                      {att.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="border border-black p-2 text-[11px] uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {att.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`border border-black p-2 text-[11px] align-top ${
                              cIdx === 0 ? "text-center font-bold" : ""
                            } ${cIdx >= 5 ? "text-center" : ""}`}
                          >
                            {cell.split("\n").map((line, lIdx) => (
                              <div
                                key={lIdx}
                                className={
                                  cIdx === 1 && lIdx === 0
                                    ? "font-bold text-slate-900"
                                    : ""
                                }
                              >
                                {line}
                              </div>
                            ))}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {att.footerNote && (
                      <tr className="bg-slate-100 font-bold">
                        <td
                          colSpan={att.headers.length}
                          className="border border-black p-2 text-right text-xs"
                        >
                          {att.footerNote}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Attachment Signature */}
              <div className="mt-6 grid grid-cols-2 text-xs">
                <div></div>
                <div className="space-y-1 pl-6">
                  <p>Ditetapkan di : {currentDoc.tempatTetap}</p>
                  <p>Pada tanggal : {currentDoc.tanggalTetap}</p>
                  <p className="font-bold pt-1 pb-14">Kepala {schoolProfile.nama}</p>
                  <p className="font-bold underline text-sm">{currentDoc.kepalaSekolah.nama}</p>
                  <p>NIP : {currentDoc.kepalaSekolah.nip}</p>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* COMPLIANCE 17-POINT VALIDATION MODAL */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Hasil Validasi Kepatuhan Administrasi SK (17 Poin)
                </h3>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {isValidating ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  AI sedang memvalidasi 17 poin kepatuhan administrasi SK...
                </p>
              </div>
            ) : validationReport ? (
              <div className="space-y-4 text-xs">
                {/* Score & Status Banner */}
                <div
                  className={`p-4 rounded-xl flex items-center justify-between border ${
                    validationReport.status === "Lengkap"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : validationReport.status === "Perlu Verifikasi"
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Status Kelayakan Administrasi:
                    </span>
                    <h4 className="text-lg font-extrabold">{validationReport.status}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black">{validationReport.score}/100</span>
                    <p className="text-[10px] opacity-80">Skor Kelayakan</p>
                  </div>
                </div>

                {/* 17 Checklist Items */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">
                    Rincian Pemeriksaan Checklist Administrasi:
                  </h4>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {validationReport.items.map((item: ComplianceItem, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80"
                      >
                        <div className="flex items-center gap-2">
                          {item.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          <span className="font-medium text-slate-800">{item.point}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.passed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Findings & Recommendations */}
                {validationReport.findings && validationReport.findings.length > 0 && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
                    <p className="font-bold text-amber-900">Temuan Pemeriksaan:</p>
                    <ul className="list-disc list-inside text-amber-800 space-y-0.5 text-[11px]">
                      {validationReport.findings.map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationReport.recommendations &&
                  validationReport.recommendations.length > 0 && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
                      <p className="font-bold text-blue-900">Rekomendasi Perbaikan:</p>
                      <ul className="list-disc list-inside text-blue-800 space-y-0.5 text-[11px]">
                        {validationReport.recommendations.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowValidationModal(false)}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Tutup Pemeriksaan
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* --- MODAL EDIT DOKUMEN SK --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Edit Dokumen SK</span>
                    <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Penyuntingan Aktif
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nomor: <span className="font-mono font-semibold text-slate-700">{editForm.nomor}</span> • Tahun Ajaran {editForm.tahunAjaran}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-4 pt-2 gap-2 text-xs font-semibold text-slate-600 overflow-x-auto">
              <button
                onClick={() => setActiveEditTab("pokok")}
                className={`pb-2.5 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeEditTab === "pokok"
                    ? "border-amber-600 text-amber-900 font-bold"
                    : "border-transparent hover:text-slate-900"
                }`}
              >
                1. Data Pokok & Nomor
              </button>
              <button
                onClick={() => setActiveEditTab("konsiderans")}
                className={`pb-2.5 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeEditTab === "konsiderans"
                    ? "border-amber-600 text-amber-900 font-bold"
                    : "border-transparent hover:text-slate-900"
                }`}
              >
                2. Konsiderans (Menimbang & Mengingat)
              </button>
              <button
                onClick={() => setActiveEditTab("diktum")}
                className={`pb-2.5 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeEditTab === "diktum"
                    ? "border-amber-600 text-amber-900 font-bold"
                    : "border-transparent hover:text-slate-900"
                }`}
              >
                3. Diktum Memutuskan ({editForm.diktum.length})
              </button>
              {editForm.lampiranList && editForm.lampiranList.length > 0 && (
                <button
                  onClick={() => setActiveEditTab("lampiran")}
                  className={`pb-2.5 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeEditTab === "lampiran"
                      ? "border-amber-600 text-amber-900 font-bold"
                      : "border-transparent hover:text-slate-900"
                  }`}
                >
                  4. Lampiran ({editForm.lampiranList.length})
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1 bg-slate-50/40">
              {/* TAB 1: POKOK */}
              {activeEditTab === "pokok" && (
                <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Materi Pokok / Tentang SK:
                    </label>
                    <input
                      type="text"
                      value={editForm.judul}
                      onChange={(e) => setEditForm({ ...editForm, judul: e.target.value })}
                      onBlur={() => {
                        setEditForm((prev) => ({
                          ...prev,
                          judul: cleanSKJudul(prev.judul, prev.tahunAjaran),
                        }));
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                      placeholder="Contoh: PEMBAGIAN TUGAS GURU DAN TUGAS TAMBAHAN DALAM KEGIATAN BELAJAR MENGAJAR"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ketikkan inti perihal SK. Format otomatis menghapus pengulangan kata "KEPUTUSAN KEPALA", "TENTANG", atau "TAHUN AJARAN".
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Nomor SK:</label>
                      <input
                        type="text"
                        value={editForm.nomor}
                        onChange={(e) => setEditForm({ ...editForm, nomor: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Tahun Ajaran:</label>
                      <input
                        type="text"
                        value={editForm.tahunAjaran}
                        onChange={(e) => setEditForm({ ...editForm, tahunAjaran: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Tempat Penetapan:</label>
                      <input
                        type="text"
                        value={editForm.tempatTetap}
                        onChange={(e) => setEditForm({ ...editForm, tempatTetap: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Tanggal Penetapan:</label>
                      <input
                        type="text"
                        value={editForm.tanggalTetap}
                        onChange={(e) => setEditForm({ ...editForm, tanggalTetap: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Penandatangan (Kepala Sekolah):</label>
                      <input
                        type="text"
                        value={editForm.kepalaSekolah.nama}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            kepalaSekolah: { ...editForm.kepalaSekolah, nama: e.target.value },
                          })
                        }
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">NIP Kepala Sekolah:</label>
                      <input
                        type="text"
                        value={editForm.kepalaSekolah.nip}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            kepalaSekolah: { ...editForm.kepalaSekolah, nip: e.target.value },
                          })
                        }
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KONSIDERANS */}
              {activeEditTab === "konsiderans" && (
                <div className="space-y-5">
                  {/* Menimbang */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Butir Menimbang</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            menimbang: [...editForm.menimbang, ""],
                          })
                        }
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Butir Menimbang</span>
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {editForm.menimbang.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="w-6 text-center font-bold text-slate-600 pt-2 shrink-0">
                            {String.fromCharCode(97 + idx)}.
                          </span>
                          <textarea
                            rows={2}
                            value={item}
                            onChange={(e) => {
                              const newArr = [...editForm.menimbang];
                              newArr[idx] = e.target.value;
                              setEditForm({ ...editForm, menimbang: newArr });
                            }}
                            className="flex-1 p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                            placeholder={`Butir pertimbangan ${String.fromCharCode(97 + idx)}...`}
                          />
                          {editForm.menimbang.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm({
                                  ...editForm,
                                  menimbang: editForm.menimbang.filter((_, i) => i !== idx),
                                });
                              }}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus butir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mengingat */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Dasar Hukum (Mengingat)</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            mengingat: [...editForm.mengingat, ""],
                          })
                        }
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Dasar Hukum</span>
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {editForm.mengingat.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="w-6 text-center font-bold text-slate-600 pt-2 shrink-0">
                            {idx + 1}.
                          </span>
                          <textarea
                            rows={2}
                            value={item}
                            onChange={(e) => {
                              const newArr = [...editForm.mengingat];
                              newArr[idx] = e.target.value;
                              setEditForm({ ...editForm, mengingat: newArr });
                            }}
                            className="flex-1 p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                            placeholder={`Dasar hukum ${idx + 1}...`}
                          />
                          {editForm.mengingat.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm({
                                  ...editForm,
                                  mengingat: editForm.mengingat.filter((_, i) => i !== idx),
                                });
                              }}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus dasar hukum"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Memperhatikan */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-900 text-sm">Konsiderans Memperhatikan:</label>
                      <button
                        type="button"
                        onClick={() => {
                          saveDefaultSKParams({
                            tahunAjaran: editForm.tahunAjaran,
                            tanggalTetap: editForm.tanggalTetap,
                            tempatTetap: editForm.tempatTetap,
                            tanggalRapat: editForm.tanggalRapat || editForm.memperhatikan,
                            memperhatikan: editForm.memperhatikan,
                          });
                          setToastMessage("Data tahun ajaran, penetapan & konsiderans memperhatikan berhasil disimpan sebagai data bawaan!");
                          setTimeout(() => setToastMessage(null), 4000);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kunci Jadi Data Bawaan Default</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editForm.memperhatikan}
                      onChange={(e) => setEditForm({ ...editForm, memperhatikan: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                      placeholder="Hasil musyawarah dewan guru..."
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Isian keputusan musyawarah dewan guru. Anda dapat mengunci teks ini agar otomatis menjadi data bawaan SK baru.
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: DIKTUM */}
              {activeEditTab === "diktum" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">Daftar Diktum Putusan (MEMUTUSKAN)</span>
                      <p className="text-[11px] text-slate-500">
                        Atur putusan penetapan SK mulai dari KESATU, KEDUA, dan seterusnya.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const dictMap = ["KESATU", "KEDUA", "KETIGA", "KEEMPAT", "KELIMA", "KEENAM", "KETUJUH"];
                        const nextPoin = dictMap[editForm.diktum.length] || `KE-${editForm.diktum.length + 1}`;
                        setEditForm({
                          ...editForm,
                          diktum: [...editForm.diktum, { poin: nextPoin, isi: "" }],
                        });
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Poin Diktum</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editForm.diktum.map((d, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={d.poin}
                            onChange={(e) => {
                              const newArr = [...editForm.diktum];
                              newArr[idx] = { ...newArr[idx], poin: e.target.value };
                              setEditForm({ ...editForm, diktum: newArr });
                            }}
                            className="w-36 font-bold uppercase p-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-slate-50 focus:ring-2 focus:ring-amber-500"
                            placeholder="KESATU"
                          />
                          {editForm.diktum.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm({
                                  ...editForm,
                                  diktum: editForm.diktum.filter((_, i) => i !== idx),
                                });
                              }}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer"
                              title="Hapus diktum ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={d.isi}
                          onChange={(e) => {
                            const newArr = [...editForm.diktum];
                            newArr[idx] = { ...newArr[idx], isi: e.target.value };
                            setEditForm({ ...editForm, diktum: newArr });
                          }}
                          className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                          placeholder="Uraian isi putusan penetapan..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: LAMPIRAN */}
              {activeEditTab === "lampiran" && editForm.lampiranList && (
                <div className="space-y-4">
                  {editForm.lampiranList.map((att, attIdx) => (
                    <div key={attIdx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Lampiran {attIdx + 1}: {att.nomorLampiran}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {att.rows.length} Baris Data
                        </span>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Judul Lampiran:</label>
                        <input
                          type="text"
                          value={att.judul}
                          onChange={(e) => {
                            const updatedList = [...(editForm.lampiranList || [])];
                            updatedList[attIdx] = { ...updatedList[attIdx], judul: e.target.value };
                            setEditForm({ ...editForm, lampiranList: updatedList });
                          }}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">Catatan Kaki Tabel (Footer):</label>
                        <input
                          type="text"
                          value={att.footerNote || ""}
                          onChange={(e) => {
                            const updatedList = [...(editForm.lampiranList || [])];
                            updatedList[attIdx] = { ...updatedList[attIdx], footerNote: e.target.value };
                            setEditForm({ ...editForm, lampiranList: updatedList });
                          }}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                          placeholder="Keterangan tambahan tabel lampiran..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  onEdit(editForm);
                }}
                className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-semibold px-3.5 py-2 rounded-lg text-xs transition-colors cursor-pointer w-full sm:w-auto justify-center"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Buka di AI Wizard Penuh</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
