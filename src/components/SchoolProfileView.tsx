import React, { useState, useRef, useEffect } from "react";
import { SchoolProfile } from "../types";
import { defaultKopSuratSDN3LoloanTimur } from "../data/defaultKopImage";
import {
  safeGetItem,
  safeSetItem,
  optimizeKopImage,
  saveActiveKopImage,
  loadActiveKopImage,
  saveKopAsAppDefault,
} from "../utils/storage";
import {
  Building2,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  Eye,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileText,
  AlertCircle,
  Sparkles,
  Star,
  RotateCcw,
  BookmarkCheck,
} from "lucide-react";

interface SchoolProfileViewProps {
  profile: SchoolProfile;
  onSave: (updated: SchoolProfile) => void;
}

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({
  profile,
  onSave,
}) => {
  const [formData, setFormData] = useState<SchoolProfile>(() => {
    const activeKop =
      (profile.kopSuratUrl && !profile.kopSuratUrl.startsWith("indexeddb:")
        ? profile.kopSuratUrl
        : null) || defaultKopSuratSDN3LoloanTimur;
    return {
      ...profile,
      kopSuratUrl: activeKop,
      kopMode: profile.kopMode || "gambar",
    };
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile.kopSuratUrl || profile.kopSuratUrl.startsWith("indexeddb:")) {
      loadActiveKopImage(defaultKopSuratSDN3LoloanTimur).then((kop) => {
        setFormData((prev) => ({
          ...prev,
          ...profile,
          kopSuratUrl: kop,
          kopMode: profile.kopMode || "gambar",
        }));
      });
    } else {
      setFormData({
        ...profile,
        kopSuratUrl: profile.kopSuratUrl,
        kopMode: profile.kopMode || "gambar",
      });
    }
  }, [profile]);

  const handleChange = (field: keyof SchoolProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleKSChange = (field: keyof SchoolProfile["kepalaSekolah"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      kepalaSekolah: {
        ...prev.kepalaSekolah,
        [field]: value,
      },
    }));
  };

  const saveKopAsDefaultMaster = async (base64Url: string) => {
    await saveKopAsAppDefault(base64Url);
  };

  const processImageFile = async (file: File) => {
    setUploadError(null);
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/i)) {
      setUploadError("Hanya file gambar dengan format JPG atau PNG yang diperbolehkan.");
      return;
    }

    // Maksimal batas upload 8 MB
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Ukuran berkas terlalu besar. Maksimal ukuran gambar kop adalah 8 MB.");
      return;
    }

    setIsProcessingImage(true);
    try {
      // Optimasi gambar agar tajam untuk kop A4 dan berukuran ringan (<150KB)
      const optimizedDataUrl = await optimizeKopImage(file);
      const updated: SchoolProfile = {
        ...formData,
        kopSuratUrl: optimizedDataUrl,
        kopMode: "gambar",
      };
      setFormData(updated);
      onSave(updated);

      // Otomatis jadikan gambar yang diunggah sebagai kop surat bawaan resmi aplikasi
      await saveKopAsAppDefault(optimizedDataUrl);

      setUploadMessage(
        "✓ Gambar kop surat resmi berhasil diunggah & dijadikan KOP SURAT BAWAAN APLIKASI untuk seluruh SK!"
      );
      setTimeout(() => setUploadMessage(null), 5000);
    } catch (err: any) {
      console.error("Gagal memproses gambar kop:", err);
      setUploadError("Gagal membaca berkas gambar. Silakan coba berkas gambar JPG/PNG lainnya.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSetCurrentKopAsDefault = async () => {
    if (!formData.kopSuratUrl) return;
    const updated: SchoolProfile = {
      ...formData,
      kopMode: "gambar",
    };
    setFormData(updated);
    onSave(updated);
    await saveKopAsAppDefault(formData.kopSuratUrl);
    setUploadMessage("✓ Gambar kop surat berhasil dijadikan dan dikunci sebagai KOP BAWAAN RESMI APLIKASI!");
    setTimeout(() => setUploadMessage(null), 4500);
  };

  const handleUseStandardVectorKop = () => {
    const updated: SchoolProfile = {
      ...formData,
      kopSuratUrl: defaultKopSuratSDN3LoloanTimur,
      kopMode: "gambar",
    };
    setFormData(updated);
    onSave(updated);
    saveKopAsDefaultMaster(defaultKopSuratSDN3LoloanTimur);
    setUploadMessage("Format kop diatur ke gambar kop vektor bawaan resmi SD Negeri 3 Loloan Timur.");
    setTimeout(() => setUploadMessage(null), 3500);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input value so re-uploading same file triggers change
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveKopImage = () => {
    const updated: SchoolProfile = {
      ...formData,
      kopSuratUrl: undefined,
      kopMode: "teks",
    };
    setFormData(updated);
    onSave(updated);
    setUploadMessage("Gambar kop surat telah dihapus. Sistem kembali menggunakan format teks dinas otomatis.");
    setTimeout(() => setUploadMessage(null), 3500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
            <Building2 className="w-4 h-4" />
            <span>Pengaturan Identitas & Tata Usaha</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Identitas Resmi Satuan Pendidikan & Kepala Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Data ini tersimpan otomatis dan digunakan secara konsisten pada setiap
            konsiderans, kop surat resmi, penutup, dan lampiran Surat Keputusan (SK).
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-200 text-xs font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Data sekolah berhasil disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kop Surat Live Preview */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Kop Surat Resmi</span>
              </div>

              {/* Mode Toggle Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  id="btn-mode-kop-teks"
                  onClick={() => handleChange("kopMode", "teks")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                    (formData.kopMode || "teks") === "teks"
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Teks Dinas Otomatis</span>
                </button>
                <button
                  type="button"
                  id="btn-mode-kop-gambar"
                  onClick={() => handleChange("kopMode", "gambar")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                    formData.kopMode === "gambar"
                      ? "bg-white text-emerald-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Gambar Kop (JPG / PNG)</span>
                  {formData.kopSuratUrl && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Upload Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-upload-kop-image"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
                title="Unggah file gambar kop surat resmi (.jpg atau .png)"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload File Kop (.jpg / .png)</span>
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-input-kop-surat"
          />

          {/* Alert / Notification Feedback */}
          {uploadMessage && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-lg animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadMessage}</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-lg animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* PRATINJAU KOP SURAT CONTAINER (CSS Target Element) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border rounded-lg transition-all relative overflow-hidden ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400"
                : "border-slate-300 bg-slate-50/50"
            }`}
          >
            {formData.kopMode === "gambar" ? (
              formData.kopSuratUrl ? (
                /* Mode Gambar: Gambar Sudah Ada */
                <div className="p-5 sm:p-7 bg-white text-center">
                  <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 flex items-center justify-center min-h-[140px]">
                    <img
                      src={formData.kopSuratUrl}
                      alt="Kop Surat Resmi Satuan Pendidikan"
                      className="w-full max-h-[160px] object-contain mx-auto block shadow-2xs"
                    />
                  </div>

                  {/* Info bar & Action buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kop Surat Bawaan Resmi Aplikasi</span>
                      </span>
                      <span className="text-slate-600 hidden sm:inline">
                        Digunakan otomatis pada setiap SK baru, pratinjau & ekspor Word (.docx)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        id="btn-set-default-kop"
                        onClick={handleSetCurrentKopAsDefault}
                        className="flex items-center gap-1.5 text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 font-bold px-3 py-1.5 rounded-md transition-colors shadow-2xs cursor-pointer"
                        title="Kunci kop surat ini sebagai kop bawaan utama aplikasi"
                      >
                        <BookmarkCheck className="w-4 h-4 text-emerald-700" />
                        <span>Kunci Jadi Bawaan Aplikasi</span>
                      </button>

                      <button
                        type="button"
                        id="btn-change-kop-image"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ganti Gambar</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleUseStandardVectorKop}
                        className="flex items-center gap-1 text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                        title="Gunakan kop gambar vektor bawaan SD Negeri 3 Loloan Timur"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span>Kop Vektor Bawaan</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveKopImage}
                        className="flex items-center gap-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode Gambar: Belum Ada Gambar (Dropzone) */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 sm:p-12 text-center cursor-pointer hover:bg-emerald-50/20 transition-all flex flex-col items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-2xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Upload File Gambar Kop Surat (JPG / PNG)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Klik untuk memilih file atau seret & lepas berkas gambar kop surat resmi ke sini.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                    <span className="font-semibold text-emerald-700">Mendukung:</span>
                    <span>.jpg, .jpeg, .png (Maksimal 5 MB)</span>
                  </div>
                  <button
                    type="button"
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all pointer-events-none"
                  >
                    Pilih File Gambar Kop
                  </button>
                </div>
              )
            ) : (
              /* Mode Teks: Teks Dinas Standar */
              <div className="p-6 bg-slate-50/50 text-center font-serif text-slate-900 select-none">
                <p className="text-sm font-bold tracking-wide">
                  {formData.pemerintahDaerah || "PEMERINTAH KABUPATEN JEMBRANA"}
                </p>
                <p className="text-sm font-bold tracking-wide">
                  {formData.dinasPendidikan || "DINAS PENDIDIKAN KEPEMUDAAN, DAN OLAHRAGA"}
                </p>
                <p className="text-base font-extrabold tracking-wider mt-0.5 text-slate-900">
                  {formData.namaKop || formData.nama}
                </p>
                <p className="text-[11px] italic text-slate-600 mt-1">
                  {formData.alamat}, Desa {formData.desa}, Kec. {formData.kecamatan}, Kab.{" "}
                  {formData.kabupaten}. Kode Pos: {formData.kodePos}. Email: {formData.email}
                  {formData.telepon ? ` | Telp: ${formData.telepon}` : ""}
                </p>
                <div className="border-b-2 border-t border-black mt-3 pt-0.5"></div>

                {/* Switcher info banner */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 font-sans text-xs text-left">
                  <div className="text-slate-500 text-[11px]">
                    {formData.kopSuratUrl ? (
                      <span className="text-emerald-700 font-medium">
                        Ada file gambar kop surat tersimpan di sistem.
                      </span>
                    ) : (
                      <span>Format teks otomatis dibuat dari isian identitas sekolah di bawah.</span>
                    )}
                  </div>
                  {formData.kopSuratUrl ? (
                    <button
                      type="button"
                      onClick={() => handleChange("kopMode", "gambar")}
                      className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 font-semibold px-3 py-1 rounded-md text-[11px] transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Gunakan Gambar Kop yang Tersimpan</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("kopMode", "gambar");
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 font-medium px-3 py-1 rounded-md text-[11px] transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ganti dengan Gambar Kop (JPG/PNG)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: Identitas Satuan Pendidikan */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Data Satuan Pendidikan (SD)</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Resmi Sekolah *
              </label>
              <input
                id="input-sekolah-nama"
                type="text"
                value={formData.nama}
                onChange={(e) => handleChange("nama", e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NPSN *
                </label>
                <input
                  id="input-sekolah-npsn"
                  type="text"
                  value={formData.npsn}
                  onChange={(e) => handleChange("npsn", e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NSS / NIS
                </label>
                <input
                  id="input-sekolah-nss"
                  type="text"
                  value={formData.nssNis}
                  onChange={(e) => handleChange("nssNis", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Sekolah
              </label>
              <select
                id="select-sekolah-status"
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pemerintah Daerah (Header Kop Tingkat 1)
              </label>
              <input
                id="input-sekolah-pemda"
                type="text"
                value={formData.pemerintahDaerah}
                onChange={(e) => handleChange("pemerintahDaerah", e.target.value)}
                placeholder="Contoh: PEMERINTAH KABUPATEN JEMBRANA"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dinas Pendidikan (Header Kop Tingkat 2)
              </label>
              <input
                id="input-sekolah-dinas"
                type="text"
                value={formData.dinasPendidikan}
                onChange={(e) => handleChange("dinasPendidikan", e.target.value)}
                placeholder="Contoh: DINAS PENDIDIKAN KEPEMUDAAN, DAN OLAHRAGA"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kop Sekolah (Header Kop Tingkat 3)
              </label>
              <input
                id="input-sekolah-kop-nama"
                type="text"
                value={formData.namaKop}
                onChange={(e) => handleChange("namaKop", e.target.value)}
                placeholder="Contoh: SATUAN PENDIDIKAN FORMAL SD NEGERI 3 YEHEMBANG KAUH"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Jalan & Dusun *
              </label>
              <input
                id="input-sekolah-alamat"
                type="text"
                value={formData.alamat}
                onChange={(e) => handleChange("alamat", e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Desa / Kelurahan *
                </label>
                <input
                  id="input-sekolah-desa"
                  type="text"
                  value={formData.desa}
                  onChange={(e) => handleChange("desa", e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kecamatan *
                </label>
                <input
                  id="input-sekolah-kecamatan"
                  type="text"
                  value={formData.kecamatan}
                  onChange={(e) => handleChange("kecamatan", e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kabupaten *
                </label>
                <input
                  id="input-sekolah-kabupaten"
                  type="text"
                  value={formData.kabupaten}
                  onChange={(e) => handleChange("kabupaten", e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provinsi *
                </label>
                <input
                  id="input-sekolah-provinsi"
                  type="text"
                  value={formData.provinsi}
                  onChange={(e) => handleChange("provinsi", e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Pos
                </label>
                <input
                  id="input-sekolah-kodepos"
                  type="text"
                  value={formData.kodePos}
                  onChange={(e) => handleChange("kodePos", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Resmi Sekolah *
                </label>
                <input
                  id="input-sekolah-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon
                </label>
                <input
                  id="input-sekolah-telepon"
                  type="text"
                  value={formData.telepon}
                  onChange={(e) => handleChange("telepon", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website Sekolah (jika ada)
              </label>
              <input
                id="input-sekolah-website"
                type="text"
                value={formData.website || ""}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://sdn3yehembangkauh.sch.id"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Box 2: Data Kepala Sekolah */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Data Kepala Sekolah (Pejabat Penetap)</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Kepala Sekolah *
                </label>
                <input
                  id="input-ks-nama"
                  type="text"
                  value={formData.kepalaSekolah.nama}
                  onChange={(e) => handleKSChange("nama", e.target.value)}
                  required
                  placeholder="Contoh: Susilo Fitri Yatmoko, M.Pd"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP Kepala Sekolah *
                </label>
                <input
                  id="input-ks-nip"
                  type="text"
                  value={formData.kepalaSekolah.nip}
                  onChange={(e) => handleKSChange("nip", e.target.value)}
                  required
                  placeholder="Contoh: 19880521 201101 1 010"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pangkat
                  </label>
                  <input
                    id="input-ks-pangkat"
                    type="text"
                    value={formData.kepalaSekolah.pangkat}
                    onChange={(e) => handleKSChange("pangkat", e.target.value)}
                    placeholder="Contoh: Pembina / Penata Tk. I"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Golongan Ruang
                  </label>
                  <input
                    id="input-ks-golongan"
                    type="text"
                    value={formData.kepalaSekolah.golongan}
                    onChange={(e) => handleKSChange("golongan", e.target.value)}
                    placeholder="Contoh: IV/a atau III/d"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan Dinas
                </label>
                <input
                  id="input-ks-jabatan"
                  type="text"
                  value={formData.kepalaSekolah.jabatan}
                  onChange={(e) => handleKSChange("jabatan", e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[11px] text-amber-800 leading-relaxed">
                <strong>Catatan Administrasi:</strong> Nama dan NIP di atas akan dicantumkan
                sebagai pihak penandatangan sah di bagian bawah Surat Keputusan dan seluruh
                halaman lampiran resmi.
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                id="btn-simpan-identitas-sekolah"
                type="submit"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Identitas</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
