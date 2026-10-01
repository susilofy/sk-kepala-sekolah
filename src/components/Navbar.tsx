import React from "react";
import {
  FileText,
  Building2,
  Users,
  Layers,
  FolderArchive,
  Bot,
  Settings,
  Sparkles,
  PlusCircle,
  ClipboardCheck,
  Laptop,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewSK: () => void;
  onOpenPortableModal?: () => void;
  schoolName: string;
  headmasterName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewSK,
  onOpenPortableModal,
  schoolName,
  headmasterName,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Layers },
    { id: "sekolah", label: "Data Sekolah", icon: Building2 },
    { id: "ptk", label: "Data Guru/PTK", icon: Users },
    { id: "sk", label: "SK Sekolah", icon: FileText },
    { id: "surat-tugas", label: "Surat Tugas", icon: ClipboardCheck },
    { id: "arsip", label: "Arsip Dokumen", icon: FolderArchive },
    { id: "template", label: "Template SK", icon: FileText },
    { id: "assistant", label: "AI Assistant", icon: Bot, isSpecial: true },
    { id: "pengaturan", label: "Pengaturan", icon: Settings },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      {/* Top Identity Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/40">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                Aplikasi SK Sekolah
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded font-medium border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Powered
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md">
              {schoolName} • KS: {headmasterName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPortableModal && (
            <button
              id="btn-nav-portable-exe"
              onClick={onOpenPortableModal}
              className="hidden sm:flex items-center gap-1.5 bg-indigo-600/70 hover:bg-indigo-600 text-indigo-100 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-500/40 transition-all cursor-pointer shadow-sm"
              title="Panduan dan pembuatan file EXE Desktop Portabel"
            >
              <Laptop className="w-3.5 h-3.5 text-indigo-300" />
              <span>Aplikasi .EXE</span>
            </button>
          )}

          <button
            id="btn-quick-new-sk"
            onClick={onOpenNewSK}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat SK Baru</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800/90 border-t border-slate-700/60 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? item.isSpecial
                      ? "bg-purple-600 text-white font-semibold"
                      : "bg-emerald-600 text-white font-semibold shadow-inner"
                    : item.isSpecial
                    ? "text-purple-300 hover:bg-purple-900/40 hover:text-purple-100"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "opacity-80"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
