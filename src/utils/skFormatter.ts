/**
 * Utility untuk pembersihan dan standardisasi format Tata Naskah Dinas SK Kepala Sekolah.
 * Memastikan bagian "TENTANG" langsung berisikan pokok materi SK tanpa pengulangan
 * kalimat kop, kata "TENTANG", "KEPUTUSAN KEPALA", maupun "TAHUN AJARAN" yang sudah
 * dicantumkan di baris tersendiri.
 */

export function cleanSKJudul(rawJudul?: string, tahunAjaran?: string): string {
  if (!rawJudul) return "";
  let clean = rawJudul.trim();

  // 1. Bersihkan prefix pengulangan kalimat "SURAT KEPUTUSAN KEPALA ... TENTANG" atau "KEPUTUSAN KEPALA ... TENTANG"
  clean = clean.replace(/^(?:SURAT\s+)?KEPUTUSAN\s+KEPALA\s+[^\n]+?TENTANG\s+/i, "");
  clean = clean.replace(/^(?:SURAT\s+)?KEPUTUSAN\s+TENTANG\s+/i, "");
  clean = clean.replace(/^SK\s+TENTANG\s+/i, "");
  clean = clean.replace(/^TENTANG\s+/i, "");

  // 2. Bersihkan jika ada sisa kalimat kop kepala sekolah tanpa kata tentang
  clean = clean.replace(/^(?:SURAT\s+)?KEPUTUSAN\s+KEPALA\s+(?:SEKOLAH|SD|SATUAN\s+PENDIDIKAN)[^\n]*$/i, "");
  clean = clean.replace(/^KEPUTUSAN\s+KEPALA\s+SEKOLAH\s+TENTANG\s+/i, "");
  clean = clean.replace(/^SURAT\s+KEPUTUSAN\s+KEPALA\s+SEKOLAH\s+TENTANG\s+/i, "");

  // 3. Bersihkan pengulangan "TAHUN AJARAN ..." di bagian akhir judul
  if (tahunAjaran) {
    const escapedTa = tahunAjaran.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const taRegex = new RegExp(
      `\\s*(?:PADA|UNTUK|SEMESTER\\s+[\\w\\s]+)?\\s*TAHUN\\s+(?:AJARAN|PELAJARAN)\\s*${escapedTa}\\s*$`,
      "i"
    );
    clean = clean.replace(taRegex, "");
  }

  // Bersihkan format umum trailing TAHUN AJARAN XXXX/XXXX
  clean = clean.replace(
    /\s*(?:PADA|UNTUK|SEMESTER\s+(?:GANJIL|GENAP|\d+))?\s*TAHUN\s+(?:AJARAN|PELAJARAN)\s*\d{4}\/\d{4}\s*$/i,
    ""
  );

  return clean.trim();
}
