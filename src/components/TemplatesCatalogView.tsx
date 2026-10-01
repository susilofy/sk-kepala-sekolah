import React, { useState } from "react";
import { skCategories } from "../data/initialData";
import {
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  CheckCircle,
} from "lucide-react";

interface TemplatesCatalogViewProps {
  onSelectTemplate: (categoryName: string) => void;
}

export const TemplatesCatalogView: React.FC<TemplatesCatalogViewProps> = ({
  onSelectTemplate,
}) => {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");

  const groups = [
    "ALL",
    "Akademik",
    "Keuangan & Sarpras",
    "Kesiswaan",
    "Karakter & Disiplin",
    "Kesehatan & Layanan",
    "Evaluasi",
  ];

  const filtered = skCategories.filter((cat) => {
    const matchesSearch =
      cat.nama.toLowerCase().includes(search.toLowerCase()) ||
      cat.deskripsi.toLowerCase().includes(search.toLowerCase()) ||
      cat.defaultJudul.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === "ALL" || cat.kategori === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Katalog Template Standar Sekolah Dasar</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          25 Template Surat Keputusan (SK) Baku Kepala Sekolah SD
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          Setiap template telah dilengkapi dengan konsiderans Menimbang baku, dasar hukum
          Mengingat yang telah diperbarui sesuai regulasi Kemendikbudristek terkini, diktum
          standar, serta struktur lampiran tabel penugasan.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-cari-template"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jenis SK atau kata kunci..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {groups.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedGroup === grp
                  ? "bg-emerald-600 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {grp === "ALL" ? "Semua Kategori" : grp}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {item.kategori}
                </span>
                <span className="text-xs font-mono text-slate-400">#{item.id}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {item.nama}
              </h3>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {item.deskripsi}
              </p>

              <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 font-serif border border-slate-100">
                <span className="font-bold font-sans text-slate-400 block text-[10px] uppercase mb-0.5">
                  Format Judul SK:
                </span>
                <span className="font-bold text-slate-800">{item.defaultJudul}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Siap AI Generator
              </span>

              <button
                id={`btn-use-template-${item.id}`}
                onClick={() => onSelectTemplate(item.nama)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <span>Gunakan Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
