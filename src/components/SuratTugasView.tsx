import React, { useState, useEffect } from "react";
import {
  SuratTugasDocument,
  SuratTugasPegawai,
  SchoolProfile,
  Employee,
} from "../types";
import { exportSuratTugasToDocx } from "../utils/docxSuratTugas";
import { defaultKopSuratSDN3LoloanTimur } from "../data/defaultKopImage";
import { loadActiveKopImage } from "../utils/storage";
import {
  FileText,
  Plus,
  Printer,
  Download,
  Edit3,
  Trash2,
  Copy,
  Eye,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  UserPlus,
  Users,
  Calendar,
  MapPin,
  Sparkles,
  X,
  Save,
  Loader2,
  FileCheck,
  ChevronRight,
  BookOpen,
  Award,
  Layers,
  Info,
} from "lucide-react";

interface SuratTugasViewProps {
  documents: SuratTugasDocument[];
  schoolProfile: SchoolProfile;
  employees: Employee[];
  onSave: (doc: SuratTugasDocument) => void;
  onDelete: (id: string) => void;
  onDuplicate: (doc: SuratTugasDocument) => void;
}

export const SuratTugasView: React.FC<SuratTugasViewProps> = ({
  documents,
  schoolProfile,
  employees,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  const [activeSubView, setActiveSubView] = useState<"list" | "form" | "preview">("list");
  const [selectedDoc, setSelectedDoc] = useState<SuratTugasDocument | null>(null);
  const [formData, setFormData] = useState<SuratTugasDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "selesai" | "draft">("ALL");
  const [isExporting, setIsExporting] = useState(false);
  const [showPTKPickerModal, setShowPTKPickerModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Quick Templates definition
  const quickTemplates = [
    {
      id: "tpl-bimtek",
      title: "Bimtek / Pelatihan Kurikulum & AI",
      tag: "Pengembangan Diri",
      icon: BookOpen,
      color: "border-blue-200 bg-blue-50/70 hover:bg-blue-100/60 text-blue-900",
      keperluan: "Mengikuti Bimbingan Teknis Implementasi Kurikulum Merdeka dan Pemanfaatan Teknologi Kecerdasan Buatan (AI) dalam Pembelajaran.",
      tempat: "Aula Graha Wiyata Dinas Dikpora Kabupaten Jembrana",
      waktu: "08.00 WITA s/d Selesai",
      bebanBiaya: "DPA-BOS SD Negeri 3 Loloan Timur Tahun Anggaran 2025.",
      dasarHukum: [
        "Surat Kepala Dinas Pendidikan, Kepemudaan, dan Olahraga Kabupaten Jembrana tentang Pemanggilan Peserta Bimbingan Teknis.",
        "Program Kerja Satuan Pendidikan Bidang Kurikulum dan Peningkatan Mutu Pendidik Tahun Ajaran 2025/2026."
      ]
    },
    {
      id: "tpl-lomba",
      title: "Pendampingan Siswa Lomba (FLS2N / O2SN / OSN)",
      tag: "Kesiswaan & Prestasi",
      icon: Award,
      color: "border-amber-200 bg-amber-50/70 hover:bg-amber-100/60 text-amber-900",
      keperluan: "Melaksanakan tugas sebagai Pembimbing dan Pendamping Siswa dalam rangka Festival dan Lomba Prestasi Siswa Tingkat Kecamatan.",
      tempat: "Gedung Kesenian Bung Karno (Twin Tower) Jembrana",
      waktu: "07.30 WITA s/d Selesai",
      bebanBiaya: "Anggaran Ekstrakurikuler dan Kesiswaan Dana BOS Sekolah.",
      dasarHukum: [
        "Petunjuk Teknis Pelaksanaan Lomba Kesiswaan Tingkat Kabupaten/Kecamatan Tahun 2025.",
        "Program Pengembangan Minat dan Bakat Peserta Didik Tahun Ajaran 2025/2026."
      ]
    },
    {
      id: "tpl-anbk",
      title: "Pengawas Ruang ANBK Silang",
      tag: "Evaluasi & Asesmen",
      icon: Layers,
      color: "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/60 text-emerald-900",
      keperluan: "Melaksanakan tugas sebagai Pengawas Ruang Asesmen Nasional Berbasis Komputer (ANBK) Silang Antar Satuan Pendidikan.",
      tempat: "Laboratorium Komputer SD Negeri Pelaksana ANBK",
      waktu: "07.00 WITA s/d 13.00 WITA",
      bebanBiaya: "Sesuai petunjuk teknis pelaksanaan ANBK dari Panitia Satuan Pendidikan.",
      dasarHukum: [
        "Peraturan Kepala Badan Standar, Kurikulum, dan Asesmen Pendidikan Kemendikbudristek tentang POS Asesmen Nasional.",
        "Surat Edaran Dinas Dikpora perihal Penugasan Pengawas Silang Asesmen Nasional Jenjang SD."
      ]
    },
    {
      id: "tpl-kkg",
      title: "Rapat Dinas / Forum KKG Gugus",
      tag: "Organisasi Profesi",
      icon: Users,
      color: "border-purple-200 bg-purple-50/70 hover:bg-purple-100/60 text-purple-900",
      keperluan: "Menghadiri Rapat Koordinasi Kelompok Kerja Guru (KKG) Gugus Sekolah Dasar dan Pembahasan Modul Ajar Terintegrasi.",
      tempat: "SD Negeri Inti Gugus Wilayah Jembrana",
      waktu: "09.00 WITA s/d 13.00 WITA",
      bebanBiaya: "Swadana / Kas Kelompok Kerja Guru (KKG).",
      dasarHukum: [
        "Surat Undangan Pengurus Kelompok Kerja Guru (KKG) Gugus SD.",
        "Jadwal Rutin Pertemuan KKG Semester Ganjil Tahun Ajaran 2025/2026."
      ]
    }
  ];

  const handleApplyTemplate = (tpl: typeof quickTemplates[0]) => {
    const today = new Date();
    const dateFormatted = `${today.getDate()} ${
      ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][
        today.getMonth()
      ]
    } ${today.getFullYear()}`;

    const nextNumber = `800 / ${(documents.length + 1).toString().padStart(3, "0")} / SD.3 / DISDIKPORA / ${today.getFullYear()}`;

    // Pilih 1 guru pertama sebagai default
    const firstEmp = employees[1] || employees[0];
    const initialAssigned: SuratTugasPegawai[] = firstEmp
      ? [
          {
            id: firstEmp.id,
            nama: firstEmp.nama,
            nip: firstEmp.nip,
            pangkatGolongan:
              firstEmp.pangkat && firstEmp.golongan
                ? `${firstEmp.pangkat}, ${firstEmp.golongan}`
                : "IX (PPPK)",
            jabatan: firstEmp.jabatan || "Guru Kelas",
            unitKerja: schoolProfile.nama,
          },
        ]
      : [];

    const newDoc: SuratTugasDocument = {
      id: `st-${Date.now()}`,
      nomor: nextNumber,
      judul: `Surat Tugas ${tpl.title}`,
      dasarHukum: [...tpl.dasarHukum],
      pegawaiDitugaskan: initialAssigned,
      untukKeperluan: tpl.keperluan,
      hariTanggal: `${
        ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][today.getDay()]
      }, ${dateFormatted}`,
      waktu: tpl.waktu,
      tempat: tpl.tempat,
      bebanBiaya: tpl.bebanBiaya,
      keteranganLain:
        "Setelah melaksanakan tugas agar segera melaporkan hasil pelaksanaan kegiatan kepada Kepala Sekolah.",
      tempatTetap: schoolProfile.desa || "Loloan Timur",
      tanggalTetap: dateFormatted,
      kepalaSekolah: {
        nama: schoolProfile.kepalaSekolah.nama,
        nip: schoolProfile.kepalaSekolah.nip,
        pangkat: schoolProfile.kepalaSekolah.pangkat,
        golongan: schoolProfile.kepalaSekolah.golongan,
        jabatan: schoolProfile.kepalaSekolah.jabatan,
      },
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFormData(newDoc);
    setActiveSubView("form");
  };

  const handleOpenNewBlank = () => {
    const today = new Date();
    const dateFormatted = `${today.getDate()} ${
      ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][
        today.getMonth()
      ]
    } ${today.getFullYear()}`;

    const nextNumber = `800 / ${(documents.length + 1).toString().padStart(3, "0")} / SD.3 / DISDIKPORA / ${today.getFullYear()}`;

    const newDoc: SuratTugasDocument = {
      id: `st-${Date.now()}`,
      nomor: nextNumber,
      judul: "Surat Tugas Mengikuti Kegiatan Kedinasan",
      dasarHukum: [
        "Surat Kepala Dinas Pendidikan, Kepemudaan, dan Olahraga Kabupaten Jembrana perihal Pelaksanaan Tugas Kedinasan.",
        "Program Kerja Satuan Pendidikan SD Negeri 3 Loloan Timur Tahun Ajaran berjalan.",
      ],
      pegawaiDitugaskan: [],
      untukKeperluan: "Melaksanakan tugas kedinasan sesuai dengan penugasan dari Kepala Satuan Pendidikan.",
      hariTanggal: `${
        ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][today.getDay()]
      }, ${dateFormatted}`,
      waktu: "08.00 WITA s/d Selesai",
      tempat: "Aula Pertemuan Dinas Pendidikan Kab. Jembrana",
      bebanBiaya: "Dibebankan pada Anggaran BOS Satuan Pendidikan Tahun Berjalan.",
      keteranganLain:
        "Setelah selesai melaksanakan tugas segera menyampaikan laporan hasil kegiatan kepada Kepala Sekolah.",
      tempatTetap: schoolProfile.desa || "Loloan Timur",
      tanggalTetap: dateFormatted,
      kepalaSekolah: {
        nama: schoolProfile.kepalaSekolah.nama,
        nip: schoolProfile.kepalaSekolah.nip,
        pangkat: schoolProfile.kepalaSekolah.pangkat,
        golongan: schoolProfile.kepalaSekolah.golongan,
        jabatan: schoolProfile.kepalaSekolah.jabatan,
      },
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFormData(newDoc);
    setActiveSubView("form");
  };

  const handleEdit = (doc: SuratTugasDocument) => {
    setFormData({ ...doc });
    setActiveSubView("form");
  };

  const handlePreview = (doc: SuratTugasDocument) => {
    setSelectedDoc(doc);
    setActiveSubView("preview");
  };

  const handleSaveForm = (andPreview: boolean = false) => {
    if (!formData) return;
    if (!formData.nomor || formData.nomor.trim() === "") {
      alert("Mohon masukkan nomor Surat Tugas.");
      return;
    }
    if (!formData.untukKeperluan || formData.untukKeperluan.trim() === "") {
      alert("Mohon masukkan uraian keperluan tugas.");
      return;
    }

    const updated: SuratTugasDocument = {
      ...formData,
      status: "selesai",
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    showToast("Surat Tugas berhasil disimpan!");

    if (andPreview) {
      setSelectedDoc(updated);
      setActiveSubView("preview");
    } else {
      setActiveSubView("list");
    }
  };

  const handleDownloadDocx = async (doc: SuratTugasDocument) => {
    try {
      setIsExporting(true);
      await exportSuratTugasToDocx(doc, {
        ...schoolProfile,
        kopSuratUrl: activeKopUrl,
        kopMode: activeKopUrl ? "gambar" : schoolProfile.kopMode,
      });
      showToast("Dokumen Word (.docx) berhasil diunduh!");
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh dokumen Word. Silakan coba kembali.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleAddPTK = (emp: Employee) => {
    if (!formData) return;
    const exists = formData.pegawaiDitugaskan.some((p) => p.nip === emp.nip && emp.nip !== "-");
    if (exists) {
      setFormData({
        ...formData,
        pegawaiDitugaskan: formData.pegawaiDitugaskan.filter((p) => p.nip !== emp.nip),
      });
    } else {
      const newP: SuratTugasPegawai = {
        id: emp.id,
        nama: emp.nama,
        nip: emp.nip,
        pangkatGolongan:
          emp.pangkat && emp.golongan ? `${emp.pangkat}, ${emp.golongan}` : "IX (PPPK)",
        jabatan: emp.jabatan || "Guru Kelas",
        unitKerja: schoolProfile.nama,
      };
      setFormData({
        ...formData,
        pegawaiDitugaskan: [...formData.pegawaiDitugaskan, newP],
      });
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.nomor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.untukKeperluan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tempat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.pegawaiDitugaskan.some((p) =>
        p.nama.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "ALL" ? true : doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // -------------------------------------------------------------
  // RENDER: PRATINJAU & CETAK A4 (PREVIEW VIEW)
  // -------------------------------------------------------------
  if (activeSubView === "preview" && selectedDoc) {
    return (
      <div className="space-y-6">
        {/* Action Top Bar */}
        <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubView("list")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar</span>
            </button>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-800">{selectedDoc.nomor}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleEdit(selectedDoc)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-slate-600" />
              <span>Edit Data</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={() => handleDownloadDocx(selectedDoc)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengekspor...</span>
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

        {/* Paper Container - Standard A4 styling */}
        <div className="bg-white shadow-lg border border-slate-300 rounded-sm p-8 sm:p-14 font-serif text-slate-900 leading-relaxed max-w-[850px] mx-auto min-h-[1050px] text-[13px] print:shadow-none print:border-none print:p-0 print:m-0">
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

          {/* --- JUDUL SURAT TUGAS --- */}
          <div className="text-center my-6 space-y-1">
            <h2 className="font-bold text-base uppercase tracking-wider underline">
              SURAT PERINTAH TUGAS
            </h2>
            <p className="font-bold text-xs">Nomor : {selectedDoc.nomor}</p>
          </div>

          {/* --- DASAR HUKUM --- */}
          {selectedDoc.dasarHukum && selectedDoc.dasarHukum.length > 0 && (
            <div className="my-5 text-justify">
              <div className="grid grid-cols-[80px_16px_1fr] gap-1 items-start text-xs leading-normal">
                <span className="font-bold">Dasar</span>
                <span>:</span>
                <div className="space-y-1">
                  {selectedDoc.dasarHukum.map((d, idx) => (
                    <div key={idx} className="grid grid-cols-[20px_1fr] gap-1 items-start">
                      <span>{idx + 1}.</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- MEMERINTAHKAN --- */}
          <div className="text-center my-5">
            <p className="font-bold text-sm tracking-wider">MEMERINTAHKAN :</p>
          </div>

          {/* --- KEPADA --- */}
          <div className="space-y-2 text-xs">
            <p className="font-bold">Kepada :</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-100 text-black text-center font-bold">
                    <th className="border border-black p-2 w-10">No</th>
                    <th className="border border-black p-2">Nama</th>
                    <th className="border border-black p-2">NIP / NUPTK</th>
                    <th className="border border-black p-2">Pangkat / Gol.</th>
                    <th className="border border-black p-2">Jabatan</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDoc.pegawaiDitugaskan.map((peg, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="border border-black p-2 text-center">{idx + 1}</td>
                      <td className="border border-black p-2 font-bold">{peg.nama}</td>
                      <td className="border border-black p-2 font-mono text-[11px]">
                        {peg.nip || "-"}
                      </td>
                      <td className="border border-black p-2">{peg.pangkatGolongan || "-"}</td>
                      <td className="border border-black p-2">{peg.jabatan || "-"}</td>
                    </tr>
                  ))}
                  {selectedDoc.pegawaiDitugaskan.length === 0 && (
                    <tr>
                      <td colSpan={5} className="border border-black p-3 text-center italic text-slate-500">
                        Belum ada pegawai yang ditambahkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- UNTUK --- */}
          <div className="mt-5 space-y-2 text-xs">
            <p className="font-bold">Untuk :</p>
            <div className="space-y-1.5 pl-1 leading-relaxed">
              <div className="grid grid-cols-[130px_16px_1fr] gap-1 items-start">
                <span className="font-medium">1. Keperluan</span>
                <span>:</span>
                <span className="font-normal text-justify">{selectedDoc.untukKeperluan}</span>
              </div>
              <div className="grid grid-cols-[130px_16px_1fr] gap-1 items-start">
                <span className="font-medium">2. Hari / Tanggal</span>
                <span>:</span>
                <span className="font-semibold">{selectedDoc.hariTanggal}</span>
              </div>
              <div className="grid grid-cols-[130px_16px_1fr] gap-1 items-start">
                <span className="font-medium">3. Waktu</span>
                <span>:</span>
                <span>{selectedDoc.waktu}</span>
              </div>
              <div className="grid grid-cols-[130px_16px_1fr] gap-1 items-start">
                <span className="font-medium">4. Tempat</span>
                <span>:</span>
                <span className="font-medium">{selectedDoc.tempat}</span>
              </div>
              {selectedDoc.bebanBiaya && (
                <div className="grid grid-cols-[130px_16px_1fr] gap-1 items-start">
                  <span className="font-medium">5. Beban Biaya</span>
                  <span>:</span>
                  <span>{selectedDoc.bebanBiaya}</span>
                </div>
              )}
              {selectedDoc.keteranganLain && (
                <div className="grid grid-cols-[130px_16px_1fr] gap-1 items-start">
                  <span className="font-medium">6. Keterangan</span>
                  <span>:</span>
                  <span className="italic">{selectedDoc.keteranganLain}</span>
                </div>
              )}
            </div>
          </div>

          {/* --- PENUTUP --- */}
          <div className="mt-6 text-xs text-justify leading-relaxed">
            <p>
              Demikian Surat Perintah Tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab
              dan setelah selesai melaksanakan tugas segera melaporkan hasilnya kepada Kepala Sekolah.
            </p>
          </div>

          {/* --- TANDA TANGAN KEPALA SEKOLAH --- */}
          <div className="mt-8 grid grid-cols-2 text-xs">
            <div></div>
            <div className="space-y-1 pl-6">
              <p>Ditetapkan di : {selectedDoc.tempatTetap || schoolProfile.desa}</p>
              <p>Pada tanggal : {selectedDoc.tanggalTetap}</p>
              <p className="font-bold pt-2 pb-16">Kepala {schoolProfile.nama}</p>
              <p className="font-bold underline text-sm">{selectedDoc.kepalaSekolah.nama}</p>
              <p>NIP : {selectedDoc.kepalaSekolah.nip}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: FORM BUAT / EDIT SURAT TUGAS
  // -------------------------------------------------------------
  if (activeSubView === "form" && formData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSubView("list")}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {formData.id.startsWith("st-new") || !documents.some((d) => d.id === formData.id)
                  ? "Buat Surat Tugas Baru"
                  : "Edit Surat Tugas"}
              </h2>
              <p className="text-xs text-slate-500">
                Lengkapi rincian penugasan guru/PTK satuan pendidikan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveForm(false)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Saja</span>
            </button>
            <button
              onClick={() => handleSaveForm(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Simpan & Lihat Pratinjau</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
          {/* Bagian 1: Identitas Surat */}
          <div className="border-b border-slate-100 pb-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>1. Nomor & Identitas Dokumen</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Surat Tugas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nomor}
                  onChange={(e) => setFormData({ ...formData, nomor: e.target.value })}
                  placeholder="e.g. 800 / 012 / SD.3 / DISDIKPORA / 2025"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Ringkas / Catatan Internal
                </label>
                <input
                  type="text"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="e.g. Surat Tugas Bimtek Kurikulum Merdeka"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempat Ditetapkan
                </label>
                <input
                  type="text"
                  value={formData.tempatTetap}
                  onChange={(e) => setFormData({ ...formData, tempatTetap: e.target.value })}
                  placeholder="e.g. Loloan Timur"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Ditetapkan
                </label>
                <input
                  type="text"
                  value={formData.tanggalTetap}
                  onChange={(e) => setFormData({ ...formData, tanggalTetap: e.target.value })}
                  placeholder="e.g. 20 Oktober 2025"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bagian 2: Dasar Penugasan */}
          <div className="border-b border-slate-100 pb-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>2. Dasar Penugasan (Dasar Hukum / Surat Undangan)</span>
              </h3>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    dasarHukum: [...formData.dasarHukum, ""],
                  })
                }
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Dasar</span>
              </button>
            </div>

            <div className="space-y-2">
              {formData.dasarHukum.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-slate-400 mt-2">{idx + 1}.</span>
                  <textarea
                    rows={2}
                    value={item}
                    onChange={(e) => {
                      const updated = [...formData.dasarHukum];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, dasarHukum: updated });
                    }}
                    placeholder={`Dasar hukum ke-${idx + 1} (e.g. Surat Kepala Dinas..., Hasil Rapat...)`}
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {formData.dasarHukum.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.dasarHukum.filter((_, i) => i !== idx);
                        setFormData({ ...formData, dasarHukum: updated });
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors mt-1"
                      title="Hapus poin"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bagian 3: Pegawai yang Ditugaskan */}
          <div className="border-b border-slate-100 pb-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>3. Pegawai yang Ditugaskan ({formData.pegawaiDitugaskan.length} Orang)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pilih cepat dari Data Guru / PTK sekolah atau tambahkan secara manual
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPTKPickerModal(true)}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span>Pilih dari Data PTK</span>
              </button>
            </div>

            {/* Tabel Pegawai Terpilih */}
            {formData.pegawaiDitugaskan.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2 text-center w-10">No</th>
                      <th className="p-2">Nama Lengkap</th>
                      <th className="p-2">NIP / NUPTK</th>
                      <th className="p-2">Pangkat / Gol.</th>
                      <th className="p-2">Jabatan</th>
                      <th className="p-2 text-center w-12">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.pegawaiDitugaskan.map((peg, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-2 text-center font-medium text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-800">{peg.nama}</td>
                        <td className="p-2 font-mono text-[11px] text-slate-600">{peg.nip || "-"}</td>
                        <td className="p-2 text-slate-600">{peg.pangkatGolongan || "-"}</td>
                        <td className="p-2 text-slate-600">{peg.jabatan || "-"}</td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.pegawaiDitugaskan.filter((_, i) => i !== idx);
                              setFormData({ ...formData, pegawaiDitugaskan: updated });
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Hapus dari daftar tugas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  Belum ada pegawai/guru yang ditugaskan pada surat ini.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPTKPickerModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Klik di sini untuk memilih guru yang ditugaskan</span>
                </button>
              </div>
            )}
          </div>

          {/* Bagian 4: Uraian Keperluan & Jadwal */}
          <div className="border-b border-slate-100 pb-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>4. Rincian Penugasan (Untuk Keperluan, Waktu, & Lokasi)</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Uraian Keperluan / Tugas <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.untukKeperluan}
                onChange={(e) => setFormData({ ...formData, untukKeperluan: e.target.value })}
                placeholder="Jelaskan secara spesifik kegiatan yang ditugaskan kepada pegawai bersangkutan..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hari & Tanggal Pelaksanaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.hariTanggal}
                  onChange={(e) => setFormData({ ...formData, hariTanggal: e.target.value })}
                  placeholder="e.g. Senin s/d Rabu, 20 - 22 Oktober 2025"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waktu / Pukul
                </label>
                <input
                  type="text"
                  value={formData.waktu}
                  onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                  placeholder="e.g. 08.00 WITA s/d Selesai"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempat / Lokasi Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tempat}
                  onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
                  placeholder="e.g. Aula Dinas Pendidikan Kepemudaan dan Olahraga Kab. Jembrana"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Beban Pembiayaan
                </label>
                <input
                  type="text"
                  value={formData.bebanBiaya || ""}
                  onChange={(e) => setFormData({ ...formData, bebanBiaya: e.target.value })}
                  placeholder="e.g. DPA-BOS SD Negeri 3 Loloan Timur Tahun 2025 / Penyelenggara"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Tambahan / Kewajiban Laporan
                </label>
                <input
                  type="text"
                  value={formData.keteranganLain || ""}
                  onChange={(e) => setFormData({ ...formData, keteranganLain: e.target.value })}
                  placeholder="e.g. Melaporkan hasil kegiatan kepada Kepala Sekolah..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bagian 5: Pejabat Penandatangan */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>5. Pejabat Pemberi Perintah (Kepala Sekolah)</span>
            </h3>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500">Nama Kepala Sekolah:</span>
                <p className="font-bold text-slate-800">{formData.kepalaSekolah.nama}</p>
              </div>
              <div>
                <span className="text-slate-500">NIP:</span>
                <p className="font-mono text-slate-700">{formData.kepalaSekolah.nip}</p>
              </div>
              <div>
                <span className="text-slate-500">Pangkat / Golongan:</span>
                <p className="text-slate-700">
                  {formData.kepalaSekolah.pangkat} ({formData.kepalaSekolah.golongan})
                </p>
              </div>
              <div>
                <span className="text-slate-500">Jabatan:</span>
                <p className="text-slate-700">{formData.kepalaSekolah.jabatan}</p>
              </div>
            </div>
          </div>

          {/* Footer Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveSubView("list")}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSaveForm(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Simpan Perubahan
            </button>
            <button
              type="button"
              onClick={() => handleSaveForm(true)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>Simpan & Buka Pratinjau</span>
            </button>
          </div>
        </div>

        {/* Modal: Pemilihan Guru / PTK */}
        {showPTKPickerModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Pilih Guru / PTK yang Ditugaskan
                    </h4>
                    <p className="text-xs text-slate-500">
                      Centang guru untuk menambahkan atau menghapus dari surat tugas ini
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPTKPickerModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto divide-y divide-slate-100 space-y-1">
                {employees.map((emp) => {
                  const isSelected = formData.pegawaiDitugaskan.some(
                    (p) => p.nip === emp.nip && emp.nip !== "-"
                  );
                  return (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-emerald-50/80 border border-emerald-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleAddPTK(emp)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {emp.nama}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                            {emp.statusKepegawaian}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          NIP: {emp.nip || "-"} • Pangkat/Gol: {emp.pangkat || "-"} ({emp.golongan || "-"}) • {emp.jabatan}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  {formData.pegawaiDitugaskan.length} guru/pegawai terpilih
                </span>
                <button
                  type="button"
                  onClick={() => setShowPTKPickerModal(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg shadow-sm"
                >
                  Selesai Memilih
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: DAFTAR SURAT TUGAS (LIST VIEW)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-0.5 rounded-full text-xs font-semibold border border-emerald-500/30">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Administrasi Resmi Satuan Pendidikan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Surat Perintah Tugas (SPT)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Penerbitan surat tugas kedinasan untuk guru dan tenaga kependidikan: mengikuti bimtek/diklat,
            pendampingan lomba siswa, kepengawasan ujian, dan kegiatan dinas resmi lainnya lengkap dengan ekspor Word (.docx) & format cetak A4.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-buat-surat-tugas"
            onClick={handleOpenNewBlank}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Surat Tugas Baru</span>
          </button>
        </div>
      </div>

      {/* Template Cepat (Quick Start Cards) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Template Cepat Surat Tugas</span>
          </h3>
          <span className="text-[11px] text-slate-500">Klik untuk langsung membuat draf</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickTemplates.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className={`p-3.5 rounded-xl border text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between ${tpl.color}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 border border-black/5">
                      {tpl.tag}
                    </span>
                    <Icon className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="font-bold text-xs leading-snug pt-1">{tpl.title}</h4>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold opacity-85 group-hover:opacity-100">
                  <span>Gunakan Template</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor, keperluan, atau nama guru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua ({documents.length})
          </button>
          <button
            onClick={() => setStatusFilter("selesai")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "selesai"
                ? "bg-emerald-600 text-white font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Selesai ({documents.filter((d) => d.status === "selesai").length})
          </button>
          <button
            onClick={() => setStatusFilter("draft")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === "draft"
                ? "bg-amber-600 text-white font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Draf ({documents.filter((d) => d.status === "draft").length})
          </button>
        </div>
      </div>

      {/* List of Surat Tugas */}
      <div className="space-y-3">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc) => {
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {doc.nomor}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        doc.status === "selesai"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {doc.status === "selesai" ? "Siap Cetak / Resmi" : "Draf"}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500">
                    Ditetapkan: {doc.tanggalTetap || "-"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: Uraian Keperluan */}
                  <div className="md:col-span-2 space-y-2">
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {doc.judul}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {doc.untukKeperluan}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.hariTanggal}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-xs">{doc.tempat}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Guru / PTK Ditugaskan */}
                  <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>Pegawai Ditugaskan ({doc.pegawaiDitugaskan.length}):</span>
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {doc.pegawaiDitugaskan.map((peg, pIdx) => (
                        <div
                          key={pIdx}
                          className="text-xs bg-white px-2 py-1 rounded border border-slate-200/80 font-medium text-slate-800 truncate"
                        >
                          {peg.nama} <span className="text-[10px] text-slate-500">({peg.jabatan})</span>
                        </div>
                      ))}
                      {doc.pegawaiDitugaskan.length === 0 && (
                        <span className="text-xs italic text-slate-400">Belum ada pegawai dipilih</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400">
                    KS: {doc.kepalaSekolah.nama}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreview(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors cursor-pointer border border-emerald-200"
                      title="Pratinjau & Cetak A4"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Pratinjau & Cetak</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadDocx(doc)}
                      disabled={isExporting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      title="Download Dokumen Microsoft Word"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Word (.docx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(doc)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Edit Surat Tugas"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onDuplicate(doc);
                        showToast("Salinan Surat Tugas berhasil dibuat!");
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Duplikat Surat Tugas"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus Surat Tugas Nomor: ${doc.nomor}?`)) {
                          onDelete(doc.id);
                          showToast("Surat Tugas berhasil dihapus.");
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Hapus Surat Tugas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">
              Tidak ada Surat Tugas yang sesuai
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Belum ada dokumen surat perintah tugas dengan filter yang dipilih. Silakan klik tombol
              di bawah untuk membuat surat tugas baru atau pilih salah satu template cepat.
            </p>
            <div className="pt-2">
              <button
                onClick={handleOpenNewBlank}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Surat Tugas Baru</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
