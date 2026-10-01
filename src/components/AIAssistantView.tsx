import React, { useState, useRef, useEffect } from "react";
import { SchoolProfile, Employee } from "../types";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  FileText,
  BookOpen,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    skType: string;
  };
}

interface AIAssistantViewProps {
  schoolProfile: SchoolProfile;
  employees: Employee[];
  onStartSKFromAssistant: (skType: string) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  schoolProfile,
  employees,
  onStartSKFromAssistant,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-welcome",
      sender: "ai",
      text: `Halo Bapak/Ibu Kepala Sekolah ${schoolProfile.nama} (${schoolProfile.kepalaSekolah.nama}).\n\nSaya adalah Asisten AI Administrasi Kepala Sekolah SD. Saya siap membantu Anda dalam:\n1. Menentukan jenis SK yang tepat sesuai agenda sekolah.\n2. Memberikan rekomendasi dasar hukum terbaru (Permendikbudristek Kurikulum Merdeka, Juknis BOSP, TPPK, Linieritas Jam Mengajar).\n3. Menyusun draf kalimat konsiderans Menimbang dan Mengingat.\n4. Merancang susunan panitia atau pembagian tugas guru dan tenaga kependidikan.\n\nApa yang dapat saya bantu hari ini?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-8).map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            content: m.text,
          })),
          context: {
            sekolah: schoolProfile.nama,
            kepalaSekolah: schoolProfile.kepalaSekolah.nama,
            totalGuru: employees.length,
          },
        }),
      });

      const resJson = await response.json();
      if (resJson.success) {
        // Detect if the user was asking to create an SK
        let suggestedAction: { label: string; skType: string } | undefined;
        const lowText = text.toLowerCase();
        if (lowText.includes("pembagian tugas") || lowText.includes("kbm")) {
          suggestedAction = {
            label: "Buat SK Pembagian Tugas KBM Sekarang",
            skType: "SK Pembagian Tugas Guru dalam KBM",
          };
        } else if (lowText.includes("bos") || lowText.includes("bosp")) {
          suggestedAction = {
            label: "Buat SK Tim BOS Sekarang",
            skType: "SK Tim BOS / Pengelola BOSP",
          };
        } else if (lowText.includes("tppk") || lowText.includes("kekerasan")) {
          suggestedAction = {
            label: "Buat SK TPPK Sekarang",
            skType: "SK Tim Pencegahan dan Penanganan Kekerasan (TPPK)",
          };
        } else if (lowText.includes("anbk") || lowText.includes("asesmen")) {
          suggestedAction = {
            label: "Buat SK Panitia Asesmen Nasional Sekarang",
            skType: "SK Panitia Asesmen Nasional (ANBK)",
          };
        }

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: resJson.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedAction,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error("Assistant chat error:", err);
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: "Mohon maaf, terjadi gangguan koneksi ke layanan AI. Silakan coba kembali sesaat lagi.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Dasar hukum terbaru untuk SK Pembagian Tugas Guru Kurikulum Merdeka",
    "Bagaimana susunan tim dan syarat SK TPPK SD tahun 2025?",
    "Pedoman beban mengajar 24 jam guru sertifikasi dan linieritas tugas tambahan",
    "Apa saja susunan tim pengelola BOSP reguler di SD Negeri?",
    "Contoh konsiderans Menimbang untuk SK Panitia Asesmen Nasional (ANBK)",
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Assistant Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">Asisten Administrasi Kepala Sekolah SD</h3>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded font-semibold border border-purple-500/30">
                Gemini AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Konsultasi regulasi, dasar hukum, pembagian tugas guru, & penyusunan SK
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-3xl ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-purple-600 text-white"
              }`}
            >
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-1.5">
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none shadow-xs"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs whitespace-pre-line"
                }`}
              >
                {msg.text}
              </div>

              {msg.suggestedAction && (
                <div className="pt-1">
                  <button
                    onClick={() => onStartSKFromAssistant(msg.suggestedAction!.skType)}
                    className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{msg.suggestedAction.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <span className="text-[10px] text-slate-400 block px-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5 max-w-md">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>AI sedang memproses konsultasi regulasi pendidikan...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center px-1 shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          Topik:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp)}
            className="text-[11px] bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-200 transition-colors cursor-pointer"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            id="input-assistant-chat"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tanyakan regulasi sekolah atau minta AI susun SK..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <button
            id="btn-send-assistant-chat"
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
