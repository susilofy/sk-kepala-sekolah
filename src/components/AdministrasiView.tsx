import React from "react";
import { SKDocument, Employee, SchoolProfile } from "../types";
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

interface AdministrasiViewProps {
  documents: SKDocument[];
  employees: Employee[];
  schoolProfile: SchoolProfile;
  onPreviewSK: (doc: SKDocument) => void;
}

export const AdministrasiView: React.FC<AdministrasiViewProps> = ({
  documents,
  employees,
  schoolProfile,
  onPreviewSK,
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Buku Register & Tata Naskah Dinas</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Administrasi Ketatausahaan & Register Penomoran SK
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Buku kendali register penomoran Surat Keputusan (SK) resmi yang diterbitkan oleh Kepala
          Sekolah {schoolProfile.nama}.
        </p>
      </div>

      {/* Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Buku Agenda & Register Nomor SK Keluar
          </h3>
          <span className="text-[11px] text-slate-400">Total {documents.length} Dokumen</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 font-mono">Nomor SK</th>
                <th className="py-3 px-3">Tanggal Penetapan</th>
                <th className="py-3 px-4">Perihal / Tentang</th>
                <th className="py-3 px-3">Tahun Ajaran</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {documents.map((doc, idx) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-900">{doc.nomor}</td>
                  <td className="py-3 px-3 text-slate-600">{doc.tanggalTetap}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-md">{doc.judul}</td>
                  <td className="py-3 px-3 text-slate-600">{doc.tahunAjaran}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        doc.status === "published"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {doc.status === "published" ? "Resmi Terbit" : "Draf"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onPreviewSK(doc)}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] underline cursor-pointer"
                    >
                      Buka SK
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Beban Mengajar Monitoring Table */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Matriks Pemenuhan Beban Mengajar (Minimal 24 Jam Sertifikasi Guru)
          </h3>
          <p className="text-[11px] text-slate-500">
            Berdasarkan Peraturan Pemerintah & Permendikbudristek tentang Beban Kerja Guru
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                <th className="py-2.5 px-3">Nama Guru</th>
                <th className="py-2.5 px-3">Jabatan / Kelas</th>
                <th className="py-2.5 px-3 text-center">Beban Tatap Muka</th>
                <th className="py-2.5 px-3">Tugas Tambahan</th>
                <th className="py-2.5 px-3 text-center">Status Pemenuhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {employees
                .filter((e) => e.jenisPTK.toLowerCase().includes("guru"))
                .map((emp) => {
                  const isEligible = (emp.jumlahJamAjar || 0) >= 24;
                  return (
                    <tr key={emp.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{emp.nama}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {emp.jabatan} {emp.kelas !== "-" ? `(Kelas ${emp.kelas})` : ""}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {emp.jumlahJamAjar} Jam
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {(emp.tugasTambahan || []).join(", ") || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isEligible
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isEligible ? "✓ Memenuhi (≥24 Jam)" : "Perlu Tambahan Jam"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
