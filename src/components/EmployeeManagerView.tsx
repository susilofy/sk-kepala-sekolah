import React, { useState } from "react";
import { Employee } from "../types";
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  FileSpreadsheet,
  Clock,
  Sparkles,
} from "lucide-react";

interface EmployeeManagerViewProps {
  employees: Employee[];
  onUpdateEmployees: (updated: Employee[]) => void;
}

export const EmployeeManagerView: React.FC<EmployeeManagerViewProps> = ({
  employees,
  onUpdateEmployees,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPTK, setFilterPTK] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Employee>>({
    nama: "",
    nip: "",
    pangkat: "",
    golongan: "",
    jabatan: "Guru Kelas",
    jenisPTK: "Guru Kelas",
    mapel: "",
    kelas: "",
    statusKepegawaian: "PPPK",
    jumlahJamAjar: 24,
    tugasTambahan: [],
  });

  const [tugasTambahanInput, setTugasTambahanInput] = useState("");

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.mapel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterPTK === "ALL" ||
      (filterPTK === "GURU" && emp.jenisPTK.toLowerCase().includes("guru")) ||
      (filterPTK === "TENDIK" &&
        (emp.jenisPTK.toLowerCase().includes("tenaga") ||
          emp.jenisPTK.toLowerCase().includes("administrasi") ||
          emp.jenisPTK.toLowerCase().includes("pranata")));

    return matchesSearch && matchesFilter;
  });

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      nama: "",
      nip: "",
      pangkat: "Ahli Pertama",
      golongan: "IX",
      jabatan: "Guru Kelas",
      jenisPTK: "Guru Kelas",
      mapel: "PPKn, Bhs. Indonesia, Matematika, IPAS, SBdP",
      kelas: "I",
      statusKepegawaian: "PPPK",
      jumlahJamAjar: 32,
      tugasTambahan: [],
    });
    setTugasTambahanInput("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({ ...emp });
    setTugasTambahanInput((emp.tugasTambahan || []).join(", "));
    setIsModalOpen(true);
  };

  const handleDeleteClick = (emp: Employee) => {
    setEmployeeToDelete(emp);
  };

  const handleConfirmDelete = () => {
    if (!employeeToDelete) return;
    const updated = employees
      .filter((e) => e.id !== employeeToDelete.id)
      .map((e, idx) => ({ ...e, no: idx + 1 }));
    onUpdateEmployees(updated);
    setEmployeeToDelete(null);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;

    const parsedTugas = tugasTambahanInput
      ? tugasTambahanInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    if (editingEmployee) {
      const updated = employees.map((emp) =>
        emp.id === editingEmployee.id
          ? ({
              ...emp,
              ...formData,
              tugasTambahan: parsedTugas,
            } as Employee)
          : emp
      );
      onUpdateEmployees(updated);
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        no: employees.length + 1,
        nama: formData.nama || "",
        nip: formData.nip || "-",
        pangkat: formData.pangkat || "-",
        golongan: formData.golongan || "-",
        jabatan: formData.jabatan || "Guru",
        jenisPTK: formData.jenisPTK || "Guru Kelas",
        mapel: formData.mapel || "-",
        kelas: formData.kelas || "-",
        statusKepegawaian: (formData.statusKepegawaian as any) || "PPPK",
        jumlahJamAjar: Number(formData.jumlahJamAjar) || 0,
        tugasTambahan: parsedTugas,
      };
      onUpdateEmployees([...employees, newEmp]);
    }

    setIsModalOpen(false);
  };

  // Stats calculation
  const totalGuru = employees.filter((e) => e.jenisPTK.toLowerCase().includes("guru")).length;
  const totalTendik = employees.filter((e) => !e.jenisPTK.toLowerCase().includes("guru")).length;
  const totalJam = employees.reduce((acc, curr) => acc + (curr.jumlahJamAjar || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
            <Users className="w-4 h-4" />
            <span>Database Pendidik & Tenaga Kependidikan (PTK)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Daftar Guru & Tenaga Kependidikan Satuan Pendidikan
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Database ini menjadi sumber data otomatis saat menyusun Lampiran I (Pembagian Tugas
            Mengajar), Lampiran II (Wali Kelas & KKG), Lampiran III (Tenaga Kependidikan), serta
            Lampiran IV (Tugas Tambahan).
          </p>
        </div>

        <button
          id="btn-tambah-ptk"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Guru / PTK Baru</span>
        </button>
      </div>

      {/* Mini Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Guru Kelas & Mapel</p>
            <p className="text-lg font-bold text-slate-800">{totalGuru} Orang</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tenaga Kependidikan / TU</p>
            <p className="text-lg font-bold text-slate-800">{totalTendik} Orang</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Beban Mengajar KBM</p>
            <p className="text-lg font-bold text-slate-800">{totalJam} Jam / Minggu</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-cari-ptk"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIP, jabatan, atau mapel..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter Jenis:</span>
          <select
            id="select-filter-ptk"
            value={filterPTK}
            onChange={(e) => setFilterPTK(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua PTK ({employees.length})</option>
            <option value="GURU">Guru ({totalGuru})</option>
            <option value="TENDIK">Tenaga Kependidikan ({totalTendik})</option>
          </select>
        </div>
      </div>

      {/* PTK Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Lengkap / NIP</th>
                <th className="py-3 px-3 min-w-[130px]">Pangkat / Golongan</th>
                <th className="py-3 px-3">Jabatan</th>
                <th className="py-3 px-3">Jenis PTK</th>
                <th className="py-3 px-3 min-w-[180px]">Mata Pelajaran</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Beban Jam</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data guru atau tenaga kependidikan yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((emp, index) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3 px-3 text-center font-semibold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{emp.nama}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {emp.nip && emp.nip !== "-"
                          ? emp.statusKepegawaian === "PPPK"
                            ? `NIPPPK. ${emp.nip}`
                            : `NIP. ${emp.nip}`
                          : "NIP. -"}
                      </p>
                      {emp.tugasTambahan && emp.tugasTambahan.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {emp.tugasTambahan.map((t, idx) => (
                            <span
                              key={idx}
                              className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <p className="font-medium">{emp.pangkat || "-"}</p>
                      <p className="text-[11px] text-slate-500">
                        {emp.golongan ? `Gol. ${emp.golongan}` : ""}
                      </p>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{emp.jabatan}</td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {emp.jenisPTK}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={emp.mapel}>
                      {emp.mapel || "-"}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {emp.kelas || "-"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.statusKepegawaian === "PNS"
                            ? "bg-blue-100 text-blue-800"
                            : emp.statusKepegawaian === "PPPK"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {emp.statusKepegawaian}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {emp.jumlahJamAjar ? `${emp.jumlahJamAjar} Jam` : "-"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          id={`btn-edit-ptk-${emp.id}`}
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Edit PTK"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-ptk-${emp.id}`}
                          onClick={() => handleDeleteClick(emp)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Hapus PTK"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit PTK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>
                  {editingEmployee
                    ? "Edit Data Guru & Tenaga Kependidikan"
                    : "Tambah Guru & Tenaga Kependidikan"}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Ketut Wina Aristadyatmika, S.Pd"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP / NIPPPK (isi - jika tidak ada)
                  </label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="Contoh: 199803232023211003"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Kepegawaian *
                  </label>
                  <select
                    value={formData.statusKepegawaian}
                    onChange={(e) =>
                      setFormData({ ...formData, statusKepegawaian: e.target.value as any })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Honorer Daerah">Honorer Daerah</option>
                    <option value="GTT">GTT (Guru Tidak Tetap)</option>
                    <option value="PTT">PTT (Pegawai Tidak Tetap)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pangkat</label>
                  <input
                    type="text"
                    value={formData.pangkat}
                    onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                    placeholder="Contoh: Ahli Pertama / Penata Muda"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Golongan Ruang
                  </label>
                  <input
                    type="text"
                    value={formData.golongan}
                    onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                    placeholder="Contoh: IX / III/a"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan *</label>
                  <input
                    type="text"
                    required
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Contoh: Guru Kelas / Guru PJOK / TU"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis PTK *</label>
                  <select
                    value={formData.jenisPTK}
                    onChange={(e) => setFormData({ ...formData, jenisPTK: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Guru Kelas">Guru Kelas</option>
                    <option value="Guru Mapel">Guru Mapel</option>
                    <option value="Guru Agama">Guru Agama</option>
                    <option value="Guru PJOK">Guru PJOK</option>
                    <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelas Diampu
                  </label>
                  <input
                    type="text"
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    placeholder="Contoh: IV atau I-VI"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Jam Mengajar (Per Minggu)
                  </label>
                  <input
                    type="number"
                    value={formData.jumlahJamAjar}
                    onChange={(e) =>
                      setFormData({ ...formData, jumlahJamAjar: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mata Pelajaran yang Diampu
                  </label>
                  <input
                    type="text"
                    value={formData.mapel}
                    onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                    placeholder="Contoh: PPKn, Bhs. Indonesia, Matematika, IPAS, SBdP, Bhs. Bali"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tugas Tambahan (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={tugasTambahanInput}
                    onChange={(e) => setTugasTambahanInput(e.target.value)}
                    placeholder="Contoh: Wali Kelas IV, Bendahara BOS, Pembina Pramuka, KKG IV"
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-simpan-modal-ptk"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan PTK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete PTK */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Data PTK</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus data guru/pegawai</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Nama Lengkap:</span>{" "}
                <span className="text-slate-950 font-bold">{employeeToDelete.nama}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-900">NIP:</span> {employeeToDelete.nip || "-"}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Jabatan / PTK:</span>{" "}
                {employeeToDelete.jenisPTK} ({employeeToDelete.statusKepegawaian})
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data PTK ini dari daftar kepegawaian sekolah?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                id="btn-cancel-delete-ptk"
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-ptk"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Data PTK</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
