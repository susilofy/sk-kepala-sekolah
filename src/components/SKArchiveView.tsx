import React, { useState, useEffect } from "react";
import { SKDocument, SchoolProfile } from "../types";
import { exportSKToDocx } from "../utils/docxGenerator";
import {
  FolderArchive,
  Search,
  Filter,
  Eye,
  Download,
  Copy,
  Trash2,
  Edit3,
  Calendar,
  FileCheck,
  PlusCircle,
} from "lucide-react";

interface SKArchiveViewProps {
  documents: SKDocument[];
  schoolProfile: SchoolProfile;
  onPreviewSK: (doc: SKDocument) => void;
  onEditSK: (doc: SKDocument) => void;
  onDuplicateSK: (doc: SKDocument) => void;
  onDeleteSK: (id: string) => void;
  onOpenNewSK: () => void;
  initialFilterStatus?: string;
}

export const SKArchiveView: React.FC<SKArchiveViewProps> = ({
  documents,
  schoolProfile,
  onPreviewSK,
  onEditSK,
  onDuplicateSK,
  onDeleteSK,
  onOpenNewSK,
  initialFilterStatus = "ALL",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState(initialFilterStatus);
  const [docToDelete, setDocToDelete] = useState<SKDocument | null>(null);

  useEffect(() => {
    if (initialFilterStatus) {
      setFilterStatus(initialFilterStatus);
    }
  }, [initialFilterStatus]);

  // Extract unique academic years
  const availableYears = Array.from(new Set(documents.map((d) => d.tahunAjaran)));

  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      doc.nomor.toLowerCase().includes(q) ||
      doc.judul.toLowerCase().includes(q) ||
      doc.jenisSK.toLowerCase().includes(q) ||
      doc.lampiranList.some((att) =>
        att.rows.some((r) => r.some((c) => c.toLowerCase().includes(q)))
      );

    const matchesYear = filterYear === "ALL" || doc.tahunAjaran === filterYear;
    const isPublished =
      doc.status === "published" ||
      doc.status === "disahkan" ||
      doc.status === "siap_cetak" ||
      doc.status === "diarsipkan";
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "published" ? isPublished : doc.status === "draft");

    return matchesSearch && matchesYear && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
            <FolderArchive className="w-4 h-4" />
            <span>Tata Kelola Arsiparis Sekolah</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Arsip Dokumen Surat Keputusan (SK) Resmi
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Seluruh berkas SK tersimpan rapi dengan riwayat lampiran, nomor surat, dan dapat
            diunduh kembali kapan saja dalam format Microsoft Word (.docx).
          </p>
        </div>

        <button
          id="btn-archive-new-sk"
          onClick={onOpenNewSK}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat SK Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-cari-arsip-sk"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor SK, judul, atau nama guru di lampiran..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-filter-tahun"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Tahun Ajaran</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  T.A. {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="published">Resmi Terbit</option>
              <option value="draft">Draf</option>
            </select>
          </div>
        </div>
      </div>

      {/* Archive Grid */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400">
            <FolderArchive className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">Tidak ada dokumen SK yang cocok dengan pencarian.</p>
            <p className="text-xs text-slate-400 mt-1">
              Ubah kata kunci pencarian atau buat Surat Keputusan baru.
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
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
                  <span className="text-xs text-slate-500 font-medium">
                    Tahun Ajaran {doc.tahunAjaran}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">
                    Ditetapkan di {doc.tempatTetap}, {doc.tanggalTetap}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{doc.judul}</h3>

                <p className="text-xs text-slate-500 flex items-center gap-3">
                  <span>Jenis: {doc.jenisSK}</span>
                  <span>•</span>
                  <span>{doc.lampiranList?.length || 0} Lampiran Tabel</span>
                  <span>•</span>
                  <span>Penetap: {doc.kepalaSekolah?.nama}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  id={`btn-preview-sk-${doc.id}`}
                  onClick={() => onPreviewSK(doc)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Lihat Pratinjau Format A4"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat</span>
                </button>

                <button
                  id={`btn-edit-sk-${doc.id}`}
                  onClick={() => onEditSK(doc)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Edit Dokumen"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  id={`btn-duplicate-sk-${doc.id}`}
                  onClick={() => onDuplicateSK(doc)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Gandakan SK untuk Periode / Semester Baru"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Gandakan</span>
                </button>

                <button
                  id={`btn-download-docx-${doc.id}`}
                  onClick={() => exportSKToDocx(doc, schoolProfile)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  title="Download File Word .docx"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.docx</span>
                </button>

                <button
                  id={`btn-delete-sk-${doc.id}`}
                  onClick={() => setDocToDelete(doc)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Hapus Dokumen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal for Delete SK */}
      {docToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Dokumen SK</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus arsip dokumen</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Nomor SK:</span>{" "}
                <span className="font-mono font-bold text-emerald-800">{docToDelete.nomor}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-900">Judul SK:</span> {docToDelete.judul}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Tahun Ajaran:</span> {docToDelete.tahunAjaran}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus surat keputusan ini dari arsip? Dokumen yang terhapus tidak dapat dikembalikan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                id="btn-cancel-delete-sk"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-sk"
                onClick={() => {
                  onDeleteSK(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
