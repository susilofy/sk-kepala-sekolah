import React, { useState } from "react";
import {
  SchoolProfile,
  Employee,
  SKDocument,
  NumberingConfig,
  SKDiktum,
  SKAttachment,
} from "../types";
import { skCategories } from "../data/initialData";
import { generateNextSKNumber } from "../utils/numberGenerator";
import { cleanSKJudul } from "../utils/skFormatter";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Building2,
  Calendar,
  Send,
  Loader2,
  Wand2,
  Eye,
  Plus,
  Trash2,
  BookmarkCheck,
  Check,
} from "lucide-react";
import { getSavedDefaultSKParams, saveDefaultSKParams } from "../utils/storage";

interface SKBuilderWizardProps {
  initialDoc?: SKDocument | null;
  profile: SchoolProfile;
  employees: Employee[];
  numberingConfig: NumberingConfig;
  existingDocuments?: SKDocument[];
  onSaveSK: (doc: SKDocument) => void;
  onPreviewSK: (doc: SKDocument) => void;
  onCancel: () => void;
}

export const SKBuilderWizard: React.FC<SKBuilderWizardProps> = ({
  initialDoc,
  profile,
  employees,
  numberingConfig,
  existingDocuments,
  onSaveSK,
  onPreviewSK,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialDoc ? 5 : 1);
  const [selectedSKType, setSelectedSKType] = useState<string>(
    initialDoc?.jenisSK || skCategories[0].nama
  );
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    initialDoc?.jenisSK === "SK Lainnya (Custom AI)"
  );

  // Step 3: Specific Data - Muat dari data bawaan yang sudah diisikan pengguna
  const defaultParams = getSavedDefaultSKParams(initialDoc || existingDocuments?.[0]);
  const defaultNum = generateNextSKNumber(numberingConfig).formattedNumber;
  const [nomorSK, setNomorSK] = useState<string>(initialDoc?.nomor || defaultNum);
  const [tahunAjaran, setTahunAjaran] = useState<string>(
    initialDoc?.tahunAjaran || defaultParams.tahunAjaran
  );
  const [tanggalTetap, setTanggalTetap] = useState<string>(
    initialDoc?.tanggalTetap || defaultParams.tanggalTetap
  );
  const [tempatTetap, setTempatTetap] = useState<string>(
    initialDoc?.tempatTetap || defaultParams.tempatTetap || profile.desa || "Loloan Timur"
  );
  const [tanggalRapat, setTanggalRapat] = useState<string>(
    initialDoc?.tanggalRapat || (initialDoc?.memperhatikan ? initialDoc.memperhatikan : defaultParams.tanggalRapat)
  );
  const [keteranganTambahan, setKeteranganTambahan] = useState<string>("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    employees.map((e) => e.id)
  );
  const [defaultSavedSuccess, setDefaultSavedSuccess] = useState<string | null>(null);

  // Step 4 & 5: AI Generated Draft & Refinements
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [draftDoc, setDraftDoc] = useState<SKDocument | null>(initialDoc || null);
  const [refineInstruction, setRefineInstruction] = useState<string>("");
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refineHistory, setRefineHistory] = useState<string[]>([]);

  // Step 1: Select Type
  const handleSelectType = (typeName: string) => {
    setSelectedSKType(typeName);
    setIsCustomMode(typeName === "SK Lainnya (Custom AI)");
  };

  // Helper format Memperhatikan secara rapi dan menjaga data bawaan
  const formatMemperhatikanText = (
    rawInput: string,
    sekolahNama: string,
    skType?: string
  ): string => {
    const trimmed = (rawInput || "").trim();
    if (!trimmed) {
      return `Saran, usul dan Keputusan Rapat Dewan Guru ${sekolahNama}`;
    }
    const lower = trimmed.toLowerCase();
    // Jika user sudah menulis format lengkap
    if (
      lower.startsWith("saran") ||
      lower.startsWith("hasil") ||
      lower.startsWith("keputusan") ||
      lower.startsWith("berdasarkan")
    ) {
      return trimmed;
    }
    if (lower.includes("rapat dewan guru")) {
      return `Saran, usul dan Keputusan ${trimmed}`;
    }
    if (lower.includes("tentang")) {
      return `Saran, usul dan Keputusan Rapat Dewan Guru ${sekolahNama} tanggal ${trimmed}`;
    }
    return `Saran, usul dan Keputusan Rapat Dewan Guru ${sekolahNama} tanggal ${trimmed}${
      skType ? ` tentang ${skType}` : ""
    }`;
  };

  // Trigger AI Draft Generation (Step 4)
  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    setCurrentStep(4);

    // Otomatis simpan isian saat ini ke data bawaan agar diingat untuk pembuatan berikutnya
    saveDefaultSKParams({
      tahunAjaran,
      tanggalTetap,
      tempatTetap,
      tanggalRapat,
    });

    const relevantEmployees = employees.filter((e) =>
      selectedEmployeeIds.includes(e.id)
    );

    const categoryObj = skCategories.find((c) => c.nama === selectedSKType);
    const judul = categoryObj ? categoryObj.defaultJudul : selectedSKType.toUpperCase();

    try {
      const response = await fetch("/api/gemini/generate-sk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenisSK: selectedSKType,
          judulSK: judul,
          tahunAjaran,
          sekolah: profile,
          kepalaSekolah: profile.kepalaSekolah,
          dataKhusus: {
            tanggalRapat,
            nomorSK,
            tempatTetap,
            tanggalTetap,
            keteranganTambahan,
          },
          employees: relevantEmployees,
          userPrompt: isCustomMode ? customPrompt : "",
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const data = resJson.data;
        const newDoc: SKDocument = {
          id: `sk-${Date.now()}`,
          nomor: nomorSK,
          judul: cleanSKJudul(data.judul || judul, tahunAjaran),
          jenisSK: selectedSKType,
          tahunAjaran,
          tanggalTetap,
          tempatTetap,
          tanggalRapat,
          perihalRapat: `Rapat Dewan Guru tentang ${selectedSKType}`,
          menimbang: data.menimbang || [
            `Bahwa dalam rangka peningkatan mutu di ${profile.nama}, maka perlu diterbitkan keputusan kepala sekolah.`,
          ],
          mengingat: data.mengingat || [
            "Undang-undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;",
            "Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Perubahan atas PP 57 Tahun 2021 tentang Standar Nasional Pendidikan;",
          ],
          memperhatikan:
            data.memperhatikan ||
            formatMemperhatikanText(tanggalRapat, profile.nama, selectedSKType),
          diktum: data.diktum || [
            { poin: "KESATU", isi: "Menetapkan pembagian tugas sebagaimana terlampir." },
            {
              poin: "KEDUA",
              isi: "Masing-masing melaporkan pelaksanaan tugas secara berkala.",
            },
            {
              poin: "KETIGA",
              isi: "Keputusan ini mulai berlaku sejak tanggal ditetapkan.",
            },
          ],
          tembusan: data.tembusan || [
            `Kepala Dinas Pendidikan Kabupaten ${profile.kabupaten}`,
            `Korwil SPF Kecamatan ${profile.kecamatan}`,
            "Arsip",
          ],
          lampiranList: (data.lampiranList || []).map((att: any, idx: number) => ({
            id: `att-${idx + 1}`,
            nomorLampiran: att.nomorLampiran || `Lampiran ${idx + 1}`,
            judul: att.judul || "Daftar Pembagian Tugas",
            jenisLampiran: att.jenisLampiran || "pembagian_tugas_guru",
            headers: att.headers || ["No", "Nama", "Jabatan", "Tugas"],
            rows: att.rows || [],
            footerNote: att.footerNote || "",
          })),
          status: "draft",
          kepalaSekolah: profile.kepalaSekolah,
          sekolah: {
            nama: profile.nama,
            alamat: profile.alamat,
            kabupaten: profile.kabupaten,
            kecamatan: profile.kecamatan,
          },
          aiNotes: data.aiNotes || (resJson.warning ? [resJson.warning] : []),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setDraftDoc(newDoc);
      } else {
        throw new Error("Respon tidak valid");
      }
    } catch (err) {
      console.warn("Generating client-side safe default draft:", err);
      // Construct complete safe official fallback draft
      const clientFallbackDoc: SKDocument = {
        id: `sk-${Date.now()}`,
        nomor: nomorSK || `421.2/08/SDN3LT/${tahunAjaran}`,
        judul: cleanSKJudul(judul, tahunAjaran) || "PEMBAGIAN TUGAS GURU DALAM PROSES BELAJAR MENGAJAR DAN TUGAS TERTENTU",
        jenisSK: selectedSKType,
        tahunAjaran,
        tanggalTetap,
        tempatTetap,
        tanggalRapat,
        perihalRapat: `Rapat Dewan Guru tentang ${selectedSKType}`,
        menimbang: [
          `Bahwa untuk memperlancar jalannya kegiatan belajar mengajar dan tertib administrasi di ${profile.nama}, dipandang perlu menetapkan pembagian tugas kerja.`,
          `Bahwa yang namanya tercantum dalam lampiran keputusan ini dipandang cakap dan memenuhi syarat untuk melaksanakan tugas yang diamanahkan.`,
        ],
        mengingat: [
          "Undang-undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;",
          "Peraturan Pemerintah Nomor 4 Tahun 2022 tentang Standar Nasional Pendidikan;",
          "Peraturan Menteri Pendidikan Dasar dan Menengah RI Nomor 12 Tahun 2025 tentang Standar Isi;",
          "Peraturan Menteri Pendidikan Dasar dan Menengah RI Nomor 13 Tahun 2025 tentang Kurikulum;",
        ],
        memperhatikan: formatMemperhatikanText(tanggalRapat, profile.nama, selectedSKType),
        diktum: [
          { poin: "KESATU", isi: "Menetapkan pembagian tugas pendidik dan tenaga kependidikan sebagaimana tercantum dalam lampiran keputusan ini." },
          { poin: "KEDUA", isi: "Masing-masing pendidik dan tenaga kependidikan wajib melaporkan pelaksanaan tugasnya secara tertulis dan berkala." },
          { poin: "KETIGA", isi: "Segala biaya yang timbul dibebankan pada anggaran sekolah yang sah." },
          { poin: "KEEMPAT", isi: "Keputusan ini berlaku sejak tanggal ditetapkan." },
        ],
        tembusan: [
          `Kepala Dinas Pendidikan Kepemudaan dan Olahraga Kabupaten ${profile.kabupaten}`,
          `Korwil Satuan Pendidikan Formal Kecamatan ${profile.kecamatan}`,
          "Pengawas Sekolah Pembina",
          "Ketua Komite Sekolah",
          "Arsip Sekolah",
        ],
        lampiranList: [
          {
            id: "att-1",
            nomorLampiran: "Lampiran I",
            judul: "Pembagian Tugas Pembelajaran dan Tugas Tambahan",
            jenisLampiran: "pembagian_tugas_guru",
            headers: ["No", "Nama / NIP", "Pangkat / Gol", "Jabatan Kedinasan", "Tugas Utama", "Keterangan"],
            rows: relevantEmployees.map((e, i) => [
              String(i + 1),
              `${e.nama}\n${e.nip && e.nip !== "-" ? (e.statusKepegawaian === "PPPK" ? `NIPPPK. ${e.nip}` : `NIP. ${e.nip}`) : "NIP. -"}`,
              e.golongan ? `${e.pangkat || "-"}\n/${e.golongan}` : "-",
              e.jabatan || "Guru Kelas",
              e.mapel || "Tematik / Semua Mata Pelajaran",
              e.kelas ? `Kelas ${e.kelas}` : "Aktif",
            ]),
            footerNote: "Beban kerja guru telah disesuaikan dengan ketentuan regulasi pemenuhan jam kerja.",
          },
        ],
        status: "draft",
        kepalaSekolah: profile.kepalaSekolah,
        sekolah: {
          nama: profile.nama,
          alamat: profile.alamat,
          kabupaten: profile.kabupaten,
          kecamatan: profile.kecamatan,
        },
        aiNotes: ["Draf telah disusun otomatis menggunakan format baku tata naskah dinas sekolah."],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDraftDoc(clientFallbackDoc);
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 5: Refine Draft with AI Prompt
  const handleRefine = async (customInstruction?: string) => {
    const textToApply = customInstruction || refineInstruction;
    if (!textToApply.trim() || !draftDoc) return;

    setIsRefining(true);
    try {
      const response = await fetch("/api/gemini/refine-sk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentDoc: draftDoc,
          instruction: textToApply,
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setDraftDoc((prev) => ({
          ...prev!,
          ...resJson.data,
          updatedAt: new Date().toISOString(),
        }));
        setRefineHistory((prev) => [textToApply, ...prev]);
        setRefineInstruction("");
      }
    } catch (err) {
      console.error("Refine error:", err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleToggleEmployee = (empId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Step Indicator Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-emerald-700 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-emerald-600" />
              <span>AI Form Builder: Langkah {currentStep} dari 5</span>
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {currentStep === 1 && "Pilih Jenis Surat Keputusan (SK)"}
              {currentStep === 2 && "Konfirmasi Data Satuan Pendidikan & Kepala Sekolah"}
              {currentStep === 3 && "Pengisian Data Khusus & Komposisi Penugasan"}
              {currentStep === 4 && "Penyusunan Draf Formal oleh AI"}
              {currentStep === 5 && "Penyempurnaan Interaktif (AI Refiner) & Finalisasi"}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  currentStep === s
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : currentStep > s
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {currentStep > s ? "✓" : s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 1: PILIH JENIS SK */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Pilih dari 25 Jenis SK Baku Sekolah Dasar atau Buat Kebutuhan Khusus:
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sistem telah dilengkapi format konsiderans Menimbang dan dasar hukum Mengingat baku
              berdasarkan standar pendidikan dasar nasional.
            </p>
          </div>

          {/* Quick Natural Prompt Option (Buat SK Berdasarkan Kebutuhan Saya) */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-emerald-900">
                Opsi Cepat: "Buat SK berdasarkan kebutuhan saya"
              </h4>
            </div>
            <p className="text-xs text-emerald-800">
              Contoh:{" "}
              <span className="italic">
                "Saya membutuhkan SK untuk membentuk tim pelaksana kegiatan peringatan Hari
                Pendidikan Nasional dan Bulan Bahasa di sekolah."
              </span>
            </p>
            <div className="flex gap-2">
              <input
                id="input-custom-sk-prompt"
                type="text"
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  if (e.target.value) setIsCustomMode(true);
                }}
                placeholder="Ketik kebutuhan SK sekolah Anda di sini..."
                className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500"
              />
              <button
                id="btn-use-custom-prompt"
                onClick={() => {
                  if (customPrompt.trim()) {
                    setSelectedSKType("SK Lainnya (Custom AI)");
                    setIsCustomMode(true);
                    setCurrentStep(2);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap cursor-pointer"
              >
                Gunakan Ini
              </button>
            </div>
          </div>

          {/* 25 Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {skCategories.map((cat) => {
              const isSelected = selectedSKType === cat.nama && !customPrompt;
              return (
                <div
                  key={cat.id}
                  id={`sk-category-${cat.id}`}
                  onClick={() => {
                    handleSelectType(cat.nama);
                    setCustomPrompt("");
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {cat.kategori}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">#{cat.id}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{cat.nama}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{cat.deskripsi}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-step1-next"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm cursor-pointer"
            >
              <span>Langkah 2: Data Sekolah</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: KONFIRMASI DATA SEKOLAH */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Data Sekolah yang Tersimpan untuk SK Ini</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              AI akan otomatis menyematkan data identitas satuan pendidikan ini ke dalam kop surat
              dan kalimat konsiderans SK.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <p className="text-slate-500">Nama Sekolah:</p>
              <p className="font-bold text-slate-900">{profile.nama}</p>
            </div>
            <div>
              <p className="text-slate-500">NPSN / NSS:</p>
              <p className="font-bold text-slate-900">
                {profile.npsn} / {profile.nssNis}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Alamat Lengkap:</p>
              <p className="font-bold text-slate-900">
                {profile.alamat}, Desa {profile.desa}, Kec. {profile.kecamatan}, Kab.{" "}
                {profile.kabupaten}, {profile.provinsi}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Kontak Resmi:</p>
              <p className="font-bold text-slate-900">
                {profile.email} | {profile.telepon || "-"}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Nama Kepala Sekolah (Pejabat Penetap):</p>
              <p className="font-bold text-slate-900">{profile.kepalaSekolah.nama}</p>
            </div>
            <div>
              <p className="text-slate-500">NIP & Pangkat/Golongan:</p>
              <p className="font-bold text-slate-900">
                NIP. {profile.kepalaSekolah.nip} ({profile.kepalaSekolah.pangkat}{" "}
                {profile.kepalaSekolah.golongan})
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-800">
            💡 Jika ingin memperbarui data sekolah atau kepala sekolah di atas, Anda dapat
            mengubahnya kapan saja di menu <strong>Data Sekolah</strong>.
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <button
              id="btn-step2-next"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm cursor-pointer"
            >
              <span>Langkah 3: Data Khusus SK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DATA KHUSUS SK */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Parameter Khusus untuk {selectedSKType}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Lengkapi nomor surat keputusan, tanggal rapat dewan guru, dan pilih daftar guru yang
              akan dicantumkan di lampiran.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor SK *</label>
              <input
                id="input-builder-nomor-sk"
                type="text"
                value={nomorSK}
                onChange={(e) => setNomorSK(e.target.value)}
                placeholder="062/SD3LT.01/VII/2025"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format nomor otomatis disesuaikan dengan pola penomoran sekolah.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tahun Ajaran / Periode *
              </label>
              <input
                id="input-builder-tahun-ajaran"
                type="text"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                placeholder="2025/2026"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Penetapan SK *
              </label>
              <input
                id="input-builder-tanggal-tetap"
                type="text"
                value={tanggalTetap}
                onChange={(e) => setTanggalTetap(e.target.value)}
                placeholder="19 Juni 2025"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tempat Penetapan *
              </label>
              <input
                id="input-builder-tempat-tetap"
                type="text"
                value={tempatTetap}
                onChange={(e) => setTempatTetap(e.target.value)}
                placeholder="Loloan Timur"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Tanggal & Pembahasan Rapat Dewan Guru (Untuk Bagian MEMPERHATIKAN) *
                </label>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                  Konsiderans Memperhatikan
                </span>
              </div>
              <textarea
                id="input-builder-tanggal-rapat"
                rows={2}
                value={tanggalRapat}
                onChange={(e) => setTanggalRapat(e.target.value)}
                placeholder="18 Juni 2025 tentang Pembagian Tugas Guru dalam kegiatan proses belajar mengajar atau bimbingan dan tugas tenaga kependidikan di SD Negeri 3 Loloan Timur Tahun Ajaran 2025/2026"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs text-slate-800"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Isian ini akan otomatis diformat dan dicantumkan pada konsiderans <strong>MEMPERHATIKAN</strong> di naskah surat keputusan.
              </span>
            </div>

            {/* Box Kunci Data Bawaan Default */}
            <div className="sm:col-span-2 bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                    <BookmarkCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Data Bawaan (Default): Tahun Ajaran, Tanggal Penetapan, & Rapat Guru</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                    Data yang sedang Anda isikan ini akan otomatis dijadikan data baku untuk pembuatan SK berikutnya. Anda juga dapat memperbaruinya secara manual kapan saja.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-save-sk-params-default"
                  onClick={() => {
                    saveDefaultSKParams({
                      tahunAjaran,
                      tanggalTetap,
                      tempatTetap,
                      tanggalRapat,
                    });
                    setDefaultSavedSuccess("Isian tahun ajaran, tanggal penetapan, dan rapat dewan guru berhasil disimpan sebagai data bawaan default!");
                    setTimeout(() => setDefaultSavedSuccess(null), 4500);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 shadow-sm cursor-pointer"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Jadikan Data Ini Bawaan Default</span>
                </button>
              </div>

              {defaultSavedSuccess && (
                <div className="flex items-center gap-2 bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs px-3 py-2 rounded-lg animate-fade-in font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{defaultSavedSuccess}</span>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Kebutuhan Khusus / Catatan Tambahan (Opsional)
              </label>
              <textarea
                id="textarea-builder-catatan"
                rows={2}
                value={keteranganTambahan}
                onChange={(e) => setKeteranganTambahan(e.target.value)}
                placeholder="Contoh: Lampiran mencakup 4 tabel (tugas mengajar, wali kelas/KKG, tenaga kependidikan, tugas tambahan PTK)."
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>
          </div>

          {/* PTK Selection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Pilih Guru / PTK yang Dilibatkan ({selectedEmployeeIds.length} dipilih)</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeIds(employees.map((e) => e.id))}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeIds([])}
                  className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
              {employees.map((emp) => {
                const isChecked = selectedEmployeeIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleEmployee(emp.id)}
                    className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer transition-all text-xs ${
                      isChecked
                        ? "bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-400"
                        : "bg-white/60 border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 text-emerald-600 rounded"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{emp.nama}</p>
                      <p className="text-[11px] text-slate-500">
                        {emp.jabatan} • {emp.kelas !== "-" ? `Kelas ${emp.kelas}` : emp.jenisPTK}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <button
              id="btn-step3-generate-ai"
              onClick={handleGenerateDraft}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Susun SK Otomatis dengan AI</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: AI GENERATING / DRAFT REVIEW */}
      {currentStep === 4 && (
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center space-y-4 animate-fade-in">
          {isGenerating ? (
            <div className="py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  AI sedang menyusun draf Surat Keputusan resmi...
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Menyusun konsiderans Menimbang, memeriksa dasar hukum Mengingat terkini,
                  merumuskan diktum MEMUTUSKAN KESATU - KEDELAPAN, serta mengompilasi lampiran tabel
                  guru dan PTK.
                </p>
              </div>
            </div>
          ) : draftDoc ? (
            <div className="space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Draf SK Berhasil Disusun!</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {draftDoc.judul}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nomor: {draftDoc.nomor} • Tahun Ajaran {draftDoc.tahunAjaran}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    id="btn-preview-draft"
                    onClick={() => onPreviewSK(draftDoc)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Pratinjau A4</span>
                  </button>
                  <button
                    id="btn-step4-next-refine"
                    onClick={() => setCurrentStep(5)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                  >
                    <span>Langkah 5: Sempurnakan / AI Refiner</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Summary of Draft */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800">Ringkasan Konsiderans:</h4>
                  <p className="text-slate-600">
                    <strong>Menimbang:</strong> {draftDoc.menimbang.length} butir konsiderans
                  </p>
                  <p className="text-slate-600">
                    <strong>Mengingat:</strong> {draftDoc.mengingat.length} butir dasar hukum
                    pendidikan nasional
                  </p>
                  <p className="text-slate-600">
                    <strong>Memperhatikan:</strong> {draftDoc.memperhatikan}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800">Diktum & Lampiran:</h4>
                  <p className="text-slate-600">
                    <strong>Diktum Putusan:</strong> {draftDoc.diktum.length} butir (
                    {draftDoc.diktum.map((d) => d.poin).join(", ")})
                  </p>
                  <p className="text-slate-600">
                    <strong>Lampiran Tabel:</strong> {draftDoc.lampiranList.length} lampiran resmi (
                    {draftDoc.lampiranList.map((l) => l.nomorLampiran).join(", ")})
                  </p>
                  <p className="text-slate-600">
                    <strong>Tembusan:</strong> {draftDoc.tembusan.length} instansi/pihak terkait
                  </p>
                </div>
              </div>

              {draftDoc.aiNotes && draftDoc.aiNotes.length > 0 && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Catatan Regulasi AI:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                    {draftDoc.aiNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-slate-600">Draf belum terbentuk. Silakan klik tombol di bawah untuk menyusun draf otomatis.</p>
              <button
                type="button"
                onClick={() => handleGenerateDraft()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Susun Draf Format Baku Sekarang</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: AI REFINER & CHAT REFINEMENT */}
      {currentStep === 5 && draftDoc && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                <Wand2 className="w-4 h-4" />
                <span>AI Refiner & Editor Dokumen</span>
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Perbaiki atau Tambah Rincian SK Secara Fleksibel
              </h3>
              <p className="text-xs text-slate-500">
                Ketik instruksi perbaikan dalam bahasa sehari-hari tanpa mengetik ulang seluruh
                dokumen.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                id="btn-preview-refine"
                onClick={() => {
                  saveDefaultSKParams({
                    tahunAjaran: draftDoc.tahunAjaran,
                    tanggalTetap: draftDoc.tanggalTetap,
                    tempatTetap: draftDoc.tempatTetap,
                    tanggalRapat: draftDoc.tanggalRapat || draftDoc.memperhatikan,
                    memperhatikan: draftDoc.memperhatikan,
                  });
                  onPreviewSK(draftDoc);
                }}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Pratinjau SK</span>
              </button>
              <button
                id="btn-save-to-archive"
                onClick={() => {
                  saveDefaultSKParams({
                    tahunAjaran: draftDoc.tahunAjaran,
                    tanggalTetap: draftDoc.tanggalTetap,
                    tempatTetap: draftDoc.tempatTetap,
                    tanggalRapat: draftDoc.tanggalRapat || draftDoc.memperhatikan,
                    memperhatikan: draftDoc.memperhatikan,
                  });
                  onSaveSK(draftDoc);
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan ke Arsip & Final</span>
              </button>
            </div>
          </div>

          {/* Quick Command Pills from User Prompt Section 13 */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Contoh Perintah Cepat yang Dapat Digunakan:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "buat lebih formal dan sesuaikan bahasa tata naskah dinas",
                "tambahkan dasar hukum Permendikbudristek Kurikulum Merdeka",
                "tambahkan guru kelas III ke dalam susunan tim",
                "ubah tanggal penetapan menjadi 20 Juni 2025",
                "perbaiki bahasa konsiderans Menimbang agar lebih lugas",
                "tambahkan tembusan ke Pengawas Sekolah Pembina",
                "periksa kesesuaian total jam mengajar di lampiran I",
              ].map((cmd, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleRefine(cmd)}
                  disabled={isRefining}
                  className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] px-2.5 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer"
                >
                  + "{cmd}"
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Refine Input */}
          <div className="flex gap-2">
            <input
              id="input-ai-refine-prompt"
              type="text"
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRefine();
              }}
              placeholder="Ketik instruksi pembaruan, misal: 'tambahkan pasal ketentuan penutup' atau 'ubah nama seksi'..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
            <button
              id="btn-send-refine"
              onClick={() => handleRefine()}
              disabled={isRefining || !refineInstruction.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {isRefining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Perbarui Draf</span>
                </>
              )}
            </button>
          </div>

          {/* Refine History */}
          {refineHistory.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <span className="font-bold text-slate-700">Riwayat Perubahan AI:</span>
              <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                {refineHistory.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Inline Editor for manual touch-ups */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tinjauan Cepat Isi Draf (Dapat Diedit Langsung):
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Materi Pokok / Tentang SK:
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    (Langsung isikan substansi, tanpa kata 'KEPUTUSAN KEPALA', 'TENTANG', atau 'TAHUN AJARAN')
                  </span>
                </label>
                <input
                  type="text"
                  value={draftDoc.judul}
                  onChange={(e) =>
                    setDraftDoc({ ...draftDoc, judul: e.target.value })
                  }
                  onBlur={() =>
                    setDraftDoc({ ...draftDoc, judul: cleanSKJudul(draftDoc.judul, draftDoc.tahunAjaran) })
                  }
                  placeholder="Contoh: PEMBAGIAN TUGAS GURU DALAM KEGIATAN PROSES BELAJAR MENGAJAR DAN TUGAS TERTENTU"
                  className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor SK:</label>
                  <input
                    type="text"
                    value={draftDoc.nomor}
                    onChange={(e) =>
                      setDraftDoc({ ...draftDoc, nomor: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Penetapan:
                  </label>
                  <input
                    type="text"
                    value={draftDoc.tanggalTetap}
                    onChange={(e) =>
                      setDraftDoc({ ...draftDoc, tanggalTetap: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Konsiderans Menimbang:
                </label>
                {draftDoc.menimbang.map((m, idx) => (
                  <div key={idx} className="flex gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-500 mt-2">
                      {String.fromCharCode(97 + idx)}.
                    </span>
                    <textarea
                      rows={2}
                      value={m}
                      onChange={(e) => {
                        const updated = [...draftDoc.menimbang];
                        updated[idx] = e.target.value;
                        setDraftDoc({ ...draftDoc, menimbang: updated });
                      }}
                      className="w-full p-2 border border-slate-300 rounded text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
