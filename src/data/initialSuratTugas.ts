import { SuratTugasDocument, SchoolProfile, Employee } from "../types";

export const getInitialSuratTugas = (
  schoolProfile: SchoolProfile,
  employees: Employee[]
): SuratTugasDocument[] => {
  const emp1 = employees.find((e) => e.nama.includes("Negariati")) || employees[1] || employees[0];
  const emp2 = employees.find((e) => e.nama.includes("Agus Sudarmawan")) || employees[2] || employees[0];
  const emp3 = employees.find((e) => e.nama.includes("Dwi Lestari")) || employees[3] || employees[0];
  const emp4 = employees.find((e) => e.nama.includes("Eka Pratama")) || employees[4] || employees[0];
  const emp5 = employees.find((e) => e.nama.includes("Sri Wahyuni")) || employees[5] || employees[0];

  return [
    {
      id: "st-2025-001",
      nomor: "800 / 012 / SD.3 / DISDIKPORA / 2025",
      judul: "Surat Tugas Mengikuti Bimbingan Teknis Implementasi Kurikulum Merdeka dan AI dalam Pembelajaran",
      dasarHukum: [
        "Surat Kepala Dinas Pendidikan, Kepemudaan, dan Olahraga Kabupaten Jembrana Nomor 421/1045/Disdikpora/2025 perihal Pemanggilan Peserta Bimtek Implementasi Kurikulum Merdeka.",
        "Program Kerja dan Rencana Kegiatan Anggaran Sekolah (RKAS) SD Negeri 3 Loloan Timur Tahun Anggaran 2025."
      ],
      pegawaiDitugaskan: [
        {
          id: emp1?.id || "p-1",
          nama: emp1?.nama || "Ni Ketut Ayu Negariati, S.Pd.",
          nip: emp1?.nip || "198305082024212016",
          pangkatGolongan: emp1?.pangkat && emp1?.golongan ? `${emp1.pangkat}, ${emp1.golongan}` : "IX (PPPK)",
          jabatan: emp1?.jabatan || "Guru Kelas I",
          unitKerja: schoolProfile.nama || "SD Negeri 3 Loloan Timur"
        },
        {
          id: emp2?.id || "p-2",
          nama: emp2?.nama || "I Putu Agus Sudarmawan, S.Pd.",
          nip: emp2?.nip || "199408152024211018",
          pangkatGolongan: emp2?.pangkat && emp2?.golongan ? `${emp2.pangkat}, ${emp2.golongan}` : "IX (PPPK)",
          jabatan: emp2?.jabatan || "Guru PJOK",
          unitKerja: schoolProfile.nama || "SD Negeri 3 Loloan Timur"
        }
      ],
      untukKeperluan: "Mengikuti kegiatan Bimbingan Teknis Implementasi Kurikulum Merdeka (IKM) dan Pemanfaatan Artificial Intelligence (AI) untuk Efisiensi Pembelajaran Tingkat Sekolah Dasar se-Kabupaten Jembrana.",
      hariTanggal: "Senin s/d Rabu, 20 - 22 Oktober 2025",
      waktu: "08.00 WITA s/d 15.30 WITA",
      tempat: "Aula Pertemuan Graha Wiyata Dinas Dikpora Kabupaten Jembrana",
      bebanBiaya: "Biaya transport dan akomodasi dibebankan pada DPA-BOS SD Negeri 3 Loloan Timur Tahun Anggaran 2025.",
      keteranganLain: "Setelah melaksanakan tugas, wajib menyampaikan laporan hasil kegiatan dan mendiseminasikannya dalam forum Kelompok Kerja Guru (KKG) Satuan Pendidikan.",
      tempatTetap: schoolProfile.desa || "Loloan Timur",
      tanggalTetap: "17 Oktober 2025",
      kepalaSekolah: {
        nama: schoolProfile.kepalaSekolah.nama,
        nip: schoolProfile.kepalaSekolah.nip,
        pangkat: schoolProfile.kepalaSekolah.pangkat,
        golongan: schoolProfile.kepalaSekolah.golongan,
        jabatan: schoolProfile.kepalaSekolah.jabatan
      },
      status: "selesai",
      createdAt: "2025-10-17T08:00:00.000Z",
      updatedAt: "2025-10-17T08:30:00.000Z"
    },
    {
      id: "st-2025-002",
      nomor: "800 / 018 / SD.3 / DISDIKPORA / 2025",
      judul: "Surat Tugas Pembimbingan dan Pendampingan Siswa dalam Lomba Seni FLS2N Tingkat Kecamatan",
      dasarHukum: [
        "Petunjuk Teknis Festival dan Lomba Seni Siswa Nasional (FLS2N) Jenjang SD Tingkat Kecamatan Jembrana Tahun 2025.",
        "Hasil Rapat Koordinasi Kelompok Kerja Kepala Sekolah (K3S) Kecamatan Jembrana tanggal 10 Oktober 2025."
      ],
      pegawaiDitugaskan: [
        {
          id: emp3?.id || "p-3",
          nama: emp3?.nama || "Ni Kadek Dwi Lestari, S.Pd.",
          nip: emp3?.nip || "199104122023212015",
          pangkatGolongan: emp3?.pangkat && emp3?.golongan ? `${emp3.pangkat}, ${emp3.golongan}` : "IX (PPPK)",
          jabatan: emp3?.jabatan || "Guru Kelas III",
          unitKerja: schoolProfile.nama || "SD Negeri 3 Loloan Timur"
        }
      ],
      untukKeperluan: "Melaksanakan tugas sebagai Pembimbing dan Pendamping Siswa Perwakilan Satuan Pendidikan dalam Festival Lomba Seni Siswa Nasional (FLS2N) Cabang Menyanyi Solo dan Tari Kreasi Tingkat Kecamatan.",
      hariTanggal: "Kamis, 24 Oktober 2025",
      waktu: "07.30 WITA s/d Selesai",
      tempat: "Gedung Kesenian Bung Karno (Twin Tower) Jembrana",
      bebanBiaya: "Dibebankan pada Anggaran Ekstrakurikuler dan Kesiswaan BOS SD Negeri 3 Loloan Timur.",
      keteranganLain: "Menjaga keselamatan, sportivitas, dan nama baik satuan pendidikan selama kegiatan berlangsung.",
      tempatTetap: schoolProfile.desa || "Loloan Timur",
      tanggalTetap: "22 Oktober 2025",
      kepalaSekolah: {
        nama: schoolProfile.kepalaSekolah.nama,
        nip: schoolProfile.kepalaSekolah.nip,
        pangkat: schoolProfile.kepalaSekolah.pangkat,
        golongan: schoolProfile.kepalaSekolah.golongan,
        jabatan: schoolProfile.kepalaSekolah.jabatan
      },
      status: "selesai",
      createdAt: "2025-10-22T08:00:00.000Z",
      updatedAt: "2025-10-22T08:15:00.000Z"
    },
    {
      id: "st-2025-003",
      nomor: "800 / 025 / SD.3 / DISDIKPORA / 2025",
      judul: "Surat Tugas Pengawas Ruang Asesmen Nasional Berbasis Komputer (ANBK) Silang Antar Sekolah",
      dasarHukum: [
        "Peraturan Kepala Badan Standar, Kurikulum, dan Asesmen Pendidikan Kemendikbudristek tentang POS Pelaksanaan Asesmen Nasional.",
        "Surat Edaran Dinas Dikpora Kabupaten Jembrana perihal Penetapan Pengawas Silang ANBK Jenjang Sekolah Dasar Tahun 2025."
      ],
      pegawaiDitugaskan: [
        {
          id: emp4?.id || "p-4",
          nama: emp4?.nama || "I Wayan Eka Pratama, S.Pd.",
          nip: emp4?.nip || "198906102019031008",
          pangkatGolongan: emp4?.pangkat && emp4?.golongan ? `${emp4.pangkat}, ${emp4.golongan}` : "Penata Muda / III/a",
          jabatan: emp4?.jabatan || "Guru Kelas V",
          unitKerja: schoolProfile.nama || "SD Negeri 3 Loloan Timur"
        },
        {
          id: emp5?.id || "p-5",
          nama: emp5?.nama || "Ni Luh Gede Sri Wahyuni, S.Pd.SD.",
          nip: emp5?.nip || "198703152014062003",
          pangkatGolongan: emp5?.pangkat && emp5?.golongan ? `${emp5.pangkat}, ${emp5.golongan}` : "Penata / III/c",
          jabatan: emp5?.jabatan || "Guru Kelas IV",
          unitKerja: schoolProfile.nama || "SD Negeri 3 Loloan Timur"
        }
      ],
      untukKeperluan: "Melaksanakan tugas sebagai Pengawas Ruang Asesmen Nasional Berbasis Komputer (ANBK) Gelombang II secara Silang Antar Satuan Pendidikan di SD Negeri 1 Loloan Timur.",
      hariTanggal: "Senin s/d Selasa, 27 - 28 Oktober 2025",
      waktu: "07.00 WITA s/d 13.00 WITA",
      tempat: "Laboratorium Komputer SD Negeri 1 Loloan Timur",
      bebanBiaya: "Sesuai petunjuk teknis pelaksanaan ANBK tahun anggaran berjalan.",
      keteranganLain: "Hadir 30 menit sebelum sesi asesmen dimulai dan mematuhi seluruh tata tertib pengawas ANBK.",
      tempatTetap: schoolProfile.desa || "Loloan Timur",
      tanggalTetap: "25 Oktober 2025",
      kepalaSekolah: {
        nama: schoolProfile.kepalaSekolah.nama,
        nip: schoolProfile.kepalaSekolah.nip,
        pangkat: schoolProfile.kepalaSekolah.pangkat,
        golongan: schoolProfile.kepalaSekolah.golongan,
        jabatan: schoolProfile.kepalaSekolah.jabatan
      },
      status: "selesai",
      createdAt: "2025-10-25T09:00:00.000Z",
      updatedAt: "2025-10-25T09:00:00.000Z"
    }
  ];
};
