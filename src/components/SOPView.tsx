import React from "react";
import { BookOpen, FileCheck, ShieldAlert, Clock, ArrowRight } from "lucide-react";

export const SOPView: React.FC<{ onDraftSK: (title: string) => void }> = ({ onDraftSK }) => {
  const sops = [
    {
      id: "sop-1",
      kode: "SOP-SD-01",
      judul: "SOP Pelaksanaan Kegiatan Belajar Mengajar (KBM) Kurikulum Merdeka",
      tujuan: "Menstandarkan ketepatan waktu jam masuk, presensi guru, serta modul ajar harian.",
      skPenetapan: "SK Pembagian Tugas Guru dalam KBM",
    },
    {
      id: "sop-2",
      kode: "SOP-SD-02",
      judul: "SOP Penerimaan dan Pengeluaran Dana Bantuan Operasional Satuan Pendidikan (BOSP)",
      tujuan: "Memastikan akuntabilitas belanja barang/jasa sesuai nota dinas dan juknis kemendikbud.",
      skPenetapan: "SK Tim BOS / Pengelola BOSP",
    },
    {
      id: "sop-3",
      kode: "SOP-SD-03",
      judul: "SOP Penanganan Pengaduan dan Kekerasan di Lingkungan Satuan Pendidikan",
      tujuan: "Mekanisme pelaporan cepat dan perlindungan hak anak atas perundungan fisik/psikologis.",
      skPenetapan: "SK Tim Pencegahan dan Penanganan Kekerasan (TPPK)",
    },
    {
      id: "sop-4",
      kode: "SOP-SD-04",
      judul: "SOP Pelayanan Sirkulasi Buku dan Literasi Perpustakaan Sekolah",
      tujuan: "Peminjaman buku teks pelajaran dan buku bacaan bermutu bagi seluruh siswa.",
      skPenetapan: "SK Pengelola Perpustakaan Sekolah",
    },
    {
      id: "sop-5",
      kode: "SOP-SD-05",
      judul: "SOP Pelaksanaan Ujian Sekolah & Asesmen Sumatif Akhir Jenjang",
      tujuan: "Penyusunan naskah soal, pengawasan ruang ujian, hingga pengolahan nilai ijazah.",
      skPenetapan: "SK Panitia Ujian Sekolah",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Standar Operasional Prosedur (SOP) Sekolah Dasar</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Daftar SOP Administrasi & Layanan Satuan Pendidikan
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            SOP merupakan instrumen kendali mutu pelaksanaan tugas pokok dan fungsi guru serta
            tenaga kependidikan yang dilegalisasi melalui Surat Keputusan Kepala Sekolah.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {sops.map((sop) => (
          <div
            key={sop.id}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {sop.kode}
                </span>
                <span className="text-[11px] text-slate-500">
                  Legalitas: {sop.skPenetapan}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{sop.judul}</h3>
              <p className="text-xs text-slate-600">{sop.tujuan}</p>
            </div>

            <button
              onClick={() => onDraftSK(sop.skPenetapan)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer shrink-0"
            >
              <span>SK Terkait</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
