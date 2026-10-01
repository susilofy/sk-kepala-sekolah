import React from "react";
import { Calendar, CheckCircle2, Clock, Plus, Target, ArrowRight } from "lucide-react";

export const ProgramSekolahView: React.FC<{ onDraftSK: (title: string) => void }> = ({
  onDraftSK,
}) => {
  const programs = [
    {
      id: "prog-1",
      nama: "Supervisi Akademik & Pembelajaran Guru Semester Ganjil",
      bidang: "Akademik & Supervisi",
      periode: "September - November 2025",
      target: "100% Guru Kelas dan Mapel tersupervisi klinis",
      status: "Berjalan",
      skTerkait: "SK Pembagian Tugas Guru dalam KBM",
    },
    {
      id: "prog-2",
      nama: "Penguatan Literasi dan Numerasi Berbasis Rapor Pendidikan",
      bidang: "Kurikulum & Mutu Pembelajaran",
      periode: "Juli 2025 - Juni 2026",
      target: "Kenaikan skor literasi 15% pada Asesmen Nasional",
      status: "Berjalan",
      skTerkait: "SK Tim Pengembang Kurikulum (KSP)",
    },
    {
      id: "prog-3",
      nama: "Pelaksanaan Asesmen Nasional Berbasis Komputer (ANBK)",
      bidang: "Evaluasi Pendidikan",
      periode: "Oktober 2025",
      target: "Siswa Kelas V berhasil mengikuti ANBK tanpa kendala teknis",
      status: "Direncanakan",
      skTerkait: "SK Panitia Asesmen Nasional (ANBK)",
    },
    {
      id: "prog-4",
      nama: "Program Sekolah Ramah Anak & Pencegahan Kekerasan (TPPK)",
      bidang: "Kesiswaan & Karakter",
      periode: "Sepanjang Tahun",
      target: "Zero bullying dan penanganan preventif kekerasan anak",
      status: "Berjalan",
      skTerkait: "SK Tim Pencegahan dan Penanganan Kekerasan (TPPK)",
    },
    {
      id: "prog-5",
      nama: "Penyusunan Rencana Kerja & Anggaran Sekolah (RKAS / BOSP)",
      bidang: "Manajemen Keuangan",
      periode: "Januari 2026",
      target: "Realisasi anggaran transparan & tepat sasaran",
      status: "Direncanakan",
      skTerkait: "SK Tim BOS / Pengelola BOSP",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
            <Calendar className="w-4 h-4" />
            <span>Rencana Kerja & Program Kerja Sekolah Dasar</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Agenda Program Kerja Satuan Pendidikan (SD)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Setiap program kerja sekolah didukung oleh dasar legalitas Surat Keputusan (SK)
            Kepala Sekolah untuk penetapan panitia pelaksana dan tim penanggung jawab.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((prog) => (
          <div
            key={prog.id}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {prog.bidang}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    prog.status === "Berjalan"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {prog.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">{prog.nama}</h3>

              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <p>
                  <span className="font-semibold text-slate-700">Periode:</span> {prog.periode}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Sasaran / Target:</span>{" "}
                  {prog.target}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">
                  SK Pendukung: {prog.skTerkait}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Legalitas Administrasi</span>
              <button
                onClick={() => onDraftSK(prog.skTerkait)}
                className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
              >
                <span>Susun SK Program</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
