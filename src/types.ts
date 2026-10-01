export interface SchoolProfile {
  nama: string;
  npsn: string;
  nssNis: string;
  status: "Negeri" | "Swasta";
  alamat: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  email: string;
  telepon: string;
  website?: string;
  pemerintahDaerah: string; // e.g. "PEMERINTAH KABUPATEN JEMBRANA"
  dinasPendidikan: string; // e.g. "DINAS PENDIDIKAN KEPEMUDAAN, DAN OLAHRAGA"
  namaKop: string; // e.g. "SATUAN PENDIDIKAN FORMAL SD NEGERI 3 YEHEMBANG KAUH"
  kepalaSekolah: {
    nama: string;
    nip: string;
    pangkat: string;
    golongan: string;
    jabatan: string;
  };
  logoKiriUrl?: string;
  logoKananUrl?: string;
  kopSuratUrl?: string; // Base64 data URL atau path gambar Kop Surat JPG/PNG
  kopMode?: "teks" | "gambar"; // Mode kop: teks otomatis dinas atau gambar upload
  stempelUrl?: string;
  ttdUrl?: string;
}

export interface Employee {
  id: string;
  no: number;
  nama: string;
  nip: string;
  pangkat: string;
  golongan: string;
  jabatan: string;
  jenisPTK: string;
  mapel: string;
  kelas: string;
  statusKepegawaian: "PNS" | "PPPK" | "Honorer Daerah" | "GTT" | "PTT";
  jumlahJamAjar?: number;
  tugasTambahan?: string[];
}

export interface SKDiktum {
  poin: string; // KESATU, KEDUA, KETIGA, KEEMPAT, KELIMA, KEENAM, KETUJUH, KEDELAPAN, dsb.
  isi: string;
}

export interface SKAttachment {
  id: string;
  nomorLampiran: string; // e.g. "Lampiran I"
  judul: string;
  jenisLampiran:
    | "pembagian_tugas_guru"
    | "tugas_tambahan_guru"
    | "tenaga_kependidikan"
    | "tugas_tambahan_ptk"
    | "susunan_panitia"
    | "kegiatan"
    | "custom_table";
  headers: string[];
  rows: string[][];
  footerNote?: string;
}

export interface SKDocument {
  id: string;
  nomor: string;
  judul: string;
  jenisSK: string;
  tahunAjaran: string;
  tanggalTetap: string;
  tempatTetap: string;
  tanggalRapat?: string;
  perihalRapat?: string;
  menimbang: string[];
  mengingat: string[];
  memperhatikan: string;
  diktum: SKDiktum[];
  tembusan: string[];
  lampiranList: SKAttachment[];
  status: "draft" | "siap_cetak" | "disahkan" | "diarsipkan" | "published";
  kepalaSekolah: {
    nama: string;
    nip: string;
    pangkat: string;
    golongan: string;
    jabatan: string;
  };
  sekolah: {
    nama: string;
    alamat: string;
    kabupaten: string;
    kecamatan: string;
  };
  aiNotes?: string[];
  aiCheckStatus?: "Data lengkap" | "Data belum lengkap" | "Perlu verifikasi";
  aiCheckFindings?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NumberingConfig {
  pattern: string; // e.g. "[NOMOR]/[KODE_SEKOLAH]/[BULAN_ROMAWI]/[TAHUN]"
  lastNumber: number;
  schoolCode: string;
  resetEveryYear: boolean;
}

export interface SuratTugasPegawai {
  id?: string;
  nama: string;
  nip: string;
  pangkatGolongan: string; // e.g. "Pembina / IV/a" atau "Penata Muda / III/a" atau "-"
  jabatan: string; // e.g. "Guru Kelas VI", "Guru PJOK", "Operator Sekolah"
  unitKerja?: string;
}

export interface SuratTugasDocument {
  id: string;
  nomor: string;
  judul: string;
  dasarHukum: string[];
  pegawaiDitugaskan: SuratTugasPegawai[];
  untukKeperluan: string;
  hariTanggal: string;
  waktu: string;
  tempat: string;
  bebanBiaya?: string;
  keteranganLain?: string;
  tempatTetap: string;
  tanggalTetap: string;
  kepalaSekolah: {
    nama: string;
    nip: string;
    pangkat: string;
    golongan: string;
    jabatan: string;
  };
  status: "draft" | "selesai";
  createdAt: string;
  updatedAt: string;
}

export interface DefaultSKParams {
  tahunAjaran: string;
  tanggalTetap: string;
  tempatTetap: string;
  tanggalRapat: string;
  memperhatikan: string;
}

export interface SchoolProgram {
  id: string;
  nama: string;
  kategori: "Kurikulum" | "Kesiswaan" | "Sarpras" | "BOS" | "Inovasi";
  tahunAjaran: string;
  penanggungJawab: string;
  targetPelaksanaan: string;
  status: "Direncanakan" | "Berjalan" | "Selesai";
  skTerkaitId?: string;
}

export interface SchoolSOP {
  id: string;
  kode: string;
  judul: string;
  kategori: string;
  tujuan: string;
  langkah: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    type: "create_sk" | "view_sk" | "open_tab";
    payload?: any;
  };
}

export interface ComplianceItem {
  point: string;
  passed: boolean;
  status: string;
}

export interface ComplianceReport {
  score: number;
  status: "Sesuai Standar" | "Perlu Verifikasi" | "Belum Lengkap" | string;
  items: ComplianceItem[];
  findings?: string[];
  recommendations?: string[];
  aiAdvice?: string;
}
