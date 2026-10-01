import React, { useState, useEffect } from "react";
import {
  SchoolProfile,
  Employee,
  SKDocument,
  NumberingConfig,
  SuratTugasDocument,
} from "./types";
import {
  initialSchoolProfile,
  initialEmployees,
  sampleSKDocuments,
  initialNumberingConfig,
} from "./data/initialData";
import { getInitialSuratTugas } from "./data/initialSuratTugas";
import { Navbar } from "./components/Navbar";
import { DashboardView } from "./components/DashboardView";
import { SchoolProfileView } from "./components/SchoolProfileView";
import { EmployeeManagerView } from "./components/EmployeeManagerView";
import { SuratTugasView } from "./components/SuratTugasView";
import { SKBuilderWizard } from "./components/SKBuilderWizard";
import { SKPreviewView } from "./components/SKPreviewView";
import { SKArchiveView } from "./components/SKArchiveView";
import { TemplatesCatalogView } from "./components/TemplatesCatalogView";
import { AIAssistantView } from "./components/AIAssistantView";
import { AdministrasiView } from "./components/AdministrasiView";
import { SettingsView } from "./components/SettingsView";
import { Globe, ExternalLink } from "lucide-react";
import { generateNextSKNumber } from "./utils/numberGenerator";
import { cleanSKJudul } from "./utils/skFormatter";
import {
  safeGetItem,
  safeSetItem,
  cleanupLegacyStorageBloat,
  loadActiveKopImage,
  saveActiveKopImage,
  saveKopAsAppDefault,
  saveDefaultSKParams,
  saveAppDefaultsToServer,
  saveAllStateAsAppMasterDefault,
} from "./utils/storage";

const getSavedMasterDefault = () => {
  const custom = safeGetItem("sd_custom_default_data");
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch (e) {
      console.error(e);
    }
  }
  return null;
};

export default function App() {
  // --- Persistent States from LocalStorage or Defaults ---
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    let profile: SchoolProfile | null = null;
    const saved = safeGetItem("sd_school_profile");
    if (saved) {
      try {
        profile = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    if (!profile) {
      const master = getSavedMasterDefault();
      if (master?.schoolProfile) profile = master.schoolProfile;
    }
    if (!profile) {
      profile = { ...initialSchoolProfile };
    }

    // Prioritaskan gambar kop yang diunggah pengguna sebagai contoh default bawaan
    const savedDefaultKop = safeGetItem("sd_default_kop_surat");
    const activeKop =
      (savedDefaultKop && !savedDefaultKop.startsWith("indexeddb:") ? savedDefaultKop : null) ||
      (profile.kopSuratUrl && !profile.kopSuratUrl.startsWith("indexeddb:")
        ? profile.kopSuratUrl
        : null) ||
      initialSchoolProfile.kopSuratUrl;

    if (activeKop) {
      profile = {
        ...profile,
        kopSuratUrl: activeKop,
        kopMode: "gambar",
      };
    }
    return profile;
  });

  // Pembersihan bloat storage dan muat kop dari IndexedDB saat pertama kali dimuat
  useEffect(() => {
    cleanupLegacyStorageBloat();
    loadActiveKopImage(initialSchoolProfile.kopSuratUrl).then((activeKop) => {
      if (activeKop && activeKop !== "indexeddb:active") {
        setSchoolProfile((prev) => ({
          ...prev,
          kopSuratUrl: activeKop,
          kopMode: "gambar",
        }));
        // Jika ada gambar kop yang telah diunggah pengguna, pastikan tersimpan sebagai bawaan resmi aplikasi
        if (activeKop.startsWith("data:image/") && activeKop.length > 100) {
          saveKopAsAppDefault(activeKop).catch(() => {});
        }
      }
    });
  }, []);

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const version = safeGetItem("sd_employees_version");
    const saved = safeGetItem("sd_employees");
    if (saved && version === "2025_06_official_v2") {
      try {
        const parsed: Employee[] = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 11 &&
          parsed.some((e) => e.nama.includes("Negariati"))
        ) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Perbarui otomatis data tersimpan dengan 11 PTK resmi
    safeSetItem("sd_employees", JSON.stringify(initialEmployees));
    safeSetItem("sd_employees_version", "2025_06_official_v2");

    const custom = safeGetItem("sd_custom_default_data");
    if (custom) {
      try {
        const c = JSON.parse(custom);
        c.employees = initialEmployees;
        safeSetItem("sd_custom_default_data", JSON.stringify(c));
      } catch {}
    }

    return initialEmployees;
  });

  const [documents, setDocuments] = useState<SKDocument[]>(() => {
    const version = safeGetItem("sd_docs_version");
    const saved = safeGetItem("sd_sk_documents");
    if (saved && version === "2025_06_official_v2") {
      try {
        const parsed: SKDocument[] = JSON.parse(saved);
        return parsed.map((d) => ({
          ...d,
          judul: cleanSKJudul(d.judul, d.tahunAjaran),
        }));
      } catch (e) {
        console.error(e);
      }
    }

    safeSetItem("sd_sk_documents", JSON.stringify(sampleSKDocuments));
    safeSetItem("sd_docs_version", "2025_06_official_v2");

    return sampleSKDocuments.map((d) => ({
      ...d,
      judul: cleanSKJudul(d.judul, d.tahunAjaran),
    }));
  });

  const [numberingConfig, setNumberingConfig] = useState<NumberingConfig>(() => {
    const saved = safeGetItem("sd_numbering_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const master = getSavedMasterDefault();
    if (master?.numberingConfig) return master.numberingConfig;
    return initialNumberingConfig;
  });

  const [suratTugasDocs, setSuratTugasDocs] = useState<SuratTugasDocument[]>(() => {
    const saved = safeGetItem("sd_surat_tugas_docs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return getInitialSuratTugas(initialSchoolProfile, initialEmployees);
  });

  // Navigation & Sub-views
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [archiveFilterStatus, setArchiveFilterStatus] = useState<string>("ALL");
  const [isBuildingSK, setIsBuildingSK] = useState<boolean>(false);
  const [previewingDoc, setPreviewingDoc] = useState<SKDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<SKDocument | null>(null);

  // Sync to LocalStorage & IndexedDB safely
  useEffect(() => {
    safeSetItem("sd_school_profile", JSON.stringify(schoolProfile));
    // Hanya simpan ke IndexedDB jika kop bukan penanda ringan dan BUKAN placeholder SVG awal
    // agar gambar unggahan pengguna tidak pernah tertimpa oleh placeholder default.
    if (
      schoolProfile.kopSuratUrl &&
      !schoolProfile.kopSuratUrl.startsWith("indexeddb:") &&
      schoolProfile.kopSuratUrl !== initialSchoolProfile.kopSuratUrl
    ) {
      saveActiveKopImage(schoolProfile.kopSuratUrl);
    }
  }, [schoolProfile]);

  useEffect(() => {
    safeSetItem("sd_employees", JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    safeSetItem("sd_sk_documents", JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    safeSetItem("sd_numbering_config", JSON.stringify(numberingConfig));
  }, [numberingConfig]);

  useEffect(() => {
    safeSetItem("sd_surat_tugas_docs", JSON.stringify(suratTugasDocs));
  }, [suratTugasDocs]);

  // Otomatis sinkronkan seluruh data terkini (data yang diisi & yang dihapus) ke server
  // agar langsung tersimpan permanen sebagai data bawaan resmi aplikasi (appDefaults.json & initialData.ts)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadActiveKopImage(schoolProfile.kopSuratUrl || "").then((activeKop) => {
        saveAppDefaultsToServer({
          schoolProfile,
          employees,
          documents,
          numberingConfig,
          kopSuratUrl:
            activeKop && activeKop.length > 50 && !activeKop.startsWith("indexeddb:")
              ? activeKop
              : undefined,
        });
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [schoolProfile, employees, documents, numberingConfig]);

  // Handlers
  const handleOpenNewSK = () => {
    setEditingDoc(null);
    setPreviewingDoc(null);
    setIsBuildingSK(true);
  };

  const handlePreviewSK = (doc: SKDocument) => {
    setEditingDoc(null);
    setPreviewingDoc(doc);
    setIsBuildingSK(false);
  };

  const handleEditSK = (doc: SKDocument) => {
    setEditingDoc(doc);
    setPreviewingDoc(null);
    setIsBuildingSK(true);
  };

  const handleDuplicateSK = (doc: SKDocument) => {
    const nextNum = generateNextSKNumber(numberingConfig).formattedNumber;
    const duplicated: SKDocument = {
      ...doc,
      id: `sk-${Date.now()}`,
      nomor: nextNum,
      judul: `${doc.judul} (Salinan)`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDocuments((prev) => [duplicated, ...prev]);
    setNumberingConfig((prev) => ({
      ...prev,
      lastNumber: prev.lastNumber + 1,
    }));
    handlePreviewSK(duplicated);
  };

  const handleDeleteSK = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (previewingDoc?.id === id) {
      setPreviewingDoc(null);
    }
  };

  const handleSaveDraftToArchive = (doc: SKDocument) => {
    const cleanDoc: SKDocument = {
      ...doc,
      judul: cleanSKJudul(doc.judul, doc.tahunAjaran),
    };
    // Otomatis simpan nilai isian tahun ajaran, tanggal penetapan, dan memperhatikan sebagai data bawaan
    saveDefaultSKParams({
      tahunAjaran: cleanDoc.tahunAjaran,
      tanggalTetap: cleanDoc.tanggalTetap,
      tempatTetap: cleanDoc.tempatTetap,
      tanggalRapat: cleanDoc.tanggalRapat || cleanDoc.memperhatikan,
      memperhatikan: cleanDoc.memperhatikan,
    });
    // Check if doc already exists
    const exists = documents.some((d) => d.id === cleanDoc.id);
    if (exists) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === cleanDoc.id ? { ...cleanDoc, status: "published" } : d))
      );
    } else {
      setDocuments((prev) => [{ ...cleanDoc, status: "published" }, ...prev]);
      setNumberingConfig((prev) => ({
        ...prev,
        lastNumber: prev.lastNumber + 1,
      }));
    }
    setIsBuildingSK(false);
    setPreviewingDoc(cleanDoc);
  };

  const handleSelectTemplate = (categoryName: string) => {
    setIsBuildingSK(true);
    setPreviewingDoc(null);
    // Open builder with that category
  };

  const handleRestoreData = async (restored: {
    schoolProfile: SchoolProfile;
    employees: Employee[];
    documents: SKDocument[];
    numberingConfig: NumberingConfig;
    suratTugasDocs?: SuratTugasDocument[];
  }) => {
    let finalProfile = { ...restored.schoolProfile };
    if (!finalProfile.kopSuratUrl || finalProfile.kopSuratUrl.startsWith("indexeddb:")) {
      const activeKop = await loadActiveKopImage(initialSchoolProfile.kopSuratUrl);
      if (activeKop && activeKop !== "indexeddb:active") {
        finalProfile.kopSuratUrl = activeKop;
        finalProfile.kopMode = "gambar";
      }
    }
    setSchoolProfile(finalProfile);
    setEmployees(restored.employees);
    setDocuments(restored.documents);
    setNumberingConfig(restored.numberingConfig);
    if (restored.suratTugasDocs && Array.isArray(restored.suratTugasDocs)) {
      setSuratTugasDocs(restored.suratTugasDocs);
    }
  };

  const handleSaveSuratTugas = (doc: SuratTugasDocument) => {
    setSuratTugasDocs((prev) => {
      const idx = prev.findIndex((d) => d.id === doc.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = doc;
        return updated;
      } else {
        return [doc, ...prev];
      }
    });
  };

  const handleDeleteSuratTugas = (id: string) => {
    setSuratTugasDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDuplicateSuratTugas = (doc: SuratTugasDocument) => {
    const nextNomor = `${doc.nomor.split(" (")[0]} (Salinan)`;
    const duplicated: SuratTugasDocument = {
      ...doc,
      id: `st-${Date.now()}`,
      nomor: nextNomor,
      judul: `${doc.judul} (Salinan)`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSuratTugasDocs((prev) => [duplicated, ...prev]);
  };

  const handleNavigateTab = (tab: string, filterStatus?: string) => {
    setIsBuildingSK(false);
    setPreviewingDoc(null);
    setEditingDoc(null);
    if (filterStatus) {
      setArchiveFilterStatus(filterStatus);
    } else {
      setArchiveFilterStatus("ALL");
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsBuildingSK(false);
          setPreviewingDoc(null);
          setActiveTab(tab);
        }}
        onOpenNewSK={handleOpenNewSK}
        schoolName={schoolProfile.nama}
        headmasterName={schoolProfile.kepalaSekolah.nama}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {/* If user is building an SK */}
        {isBuildingSK ? (
          <SKBuilderWizard
            initialDoc={editingDoc}
            profile={schoolProfile}
            employees={employees}
            numberingConfig={numberingConfig}
            existingDocuments={documents}
            onSaveSK={(doc) => {
              handleSaveDraftToArchive(doc);
              setEditingDoc(null);
            }}
            onPreviewSK={(doc) => {
              handlePreviewSK(doc);
              setEditingDoc(null);
            }}
            onCancel={() => {
              setIsBuildingSK(false);
              setEditingDoc(null);
            }}
          />
        ) : previewingDoc ? (
          /* If user is previewing an SK */
          <SKPreviewView
            document={previewingDoc}
            schoolProfile={schoolProfile}
            onEdit={handleEditSK}
            onBack={() => setPreviewingDoc(null)}
            onSaveToArchive={handleSaveDraftToArchive}
          />
        ) : (
          /* Active Tab Views */
          <>
            {activeTab === "dashboard" && (
              <DashboardView
                documents={documents}
                schoolProfile={schoolProfile}
                employees={employees}
                onOpenNewSK={handleOpenNewSK}
                onPreviewSK={handlePreviewSK}
                onOpenAssistant={() => setActiveTab("assistant")}
                onNavigateTab={handleNavigateTab}
              />
            )}

            {activeTab === "sekolah" && (
              <SchoolProfileView
                profile={schoolProfile}
                onSave={(updated) => {
                  setSchoolProfile(updated);
                  safeSetItem("sd_school_profile", JSON.stringify(updated));
                  if (updated.kopSuratUrl) {
                    safeSetItem("sd_default_kop_surat", updated.kopSuratUrl);
                  }
                }}
              />
            )}

            {activeTab === "ptk" && (
              <EmployeeManagerView
                employees={employees}
                onUpdateEmployees={(updated) => setEmployees(updated)}
              />
            )}

            {activeTab === "sk" && (
              <div className="space-y-6">
                <SKArchiveView
                  documents={documents}
                  schoolProfile={schoolProfile}
                  initialFilterStatus={archiveFilterStatus}
                  onPreviewSK={handlePreviewSK}
                  onEditSK={handleEditSK}
                  onDuplicateSK={handleDuplicateSK}
                  onDeleteSK={handleDeleteSK}
                  onOpenNewSK={handleOpenNewSK}
                />
              </div>
            )}

            {activeTab === "surat-tugas" && (
              <SuratTugasView
                documents={suratTugasDocs}
                schoolProfile={schoolProfile}
                employees={employees}
                onSave={handleSaveSuratTugas}
                onDelete={handleDeleteSuratTugas}
                onDuplicate={handleDuplicateSuratTugas}
              />
            )}

            {activeTab === "administrasi" && (
              <AdministrasiView
                documents={documents}
                employees={employees}
                schoolProfile={schoolProfile}
                onPreviewSK={handlePreviewSK}
              />
            )}

            {activeTab === "arsip" && (
              <SKArchiveView
                documents={documents}
                schoolProfile={schoolProfile}
                initialFilterStatus={archiveFilterStatus}
                onPreviewSK={handlePreviewSK}
                onEditSK={handleEditSK}
                onDuplicateSK={handleDuplicateSK}
                onDeleteSK={handleDeleteSK}
                onOpenNewSK={handleOpenNewSK}
              />
            )}

            {activeTab === "template" && (
              <TemplatesCatalogView onSelectTemplate={handleSelectTemplate} />
            )}

            {activeTab === "assistant" && (
              <AIAssistantView
                schoolProfile={schoolProfile}
                employees={employees}
                onStartSKFromAssistant={(skType) => {
                  handleOpenNewSK();
                }}
              />
            )}

            {activeTab === "pengaturan" && (
              <SettingsView
                numberingConfig={numberingConfig}
                onSaveNumbering={(c) => setNumberingConfig(c)}
                allData={{
                  schoolProfile,
                  employees,
                  documents,
                  suratTugasDocs,
                }}
                onRestoreData={handleRestoreData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer / Tampilan Bawah Aplikasi */}
      <footer className="no-print bg-slate-900 text-slate-400 border-t border-slate-800 py-5 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          {/* Sisi Kiri: Identitas Aplikasi & Sekolah */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide">Aplikasi SK Sekolah</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-300 font-medium">{schoolProfile.nama}</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400">Pengembang:</span>
              <span className="font-semibold text-emerald-400">Susilo Fitri Yatmoko</span>
            </div>
          </div>

          {/* Sisi Kanan: Tautan Web Pengembang */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.gurumerangkum.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-200 border border-emerald-700/60 font-semibold transition-all shadow-sm cursor-pointer group"
              title="Kunjungi Website Resmi Guru Merangkum"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>www.gurumerangkum.com</span>
              <ExternalLink className="w-3 h-3 text-emerald-400/80" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
