import { useEffect, useMemo, useRef, useState } from "react";
import axios from "../../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

/* -------------------- Types -------------------- */
type Thread = {
  id: number;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "normal" | "high";
  admin?: { id: number; name: string; email: string } | null;
  customer?: { id: number; name: string; email: string } | null;
};
type Msg = {
  id: number;
  sender_id: number;
  body: string;
  importance: "info" | "warning" | "critical";
  read_at?: string | null;
  created_at: string;
  sender: { id: number; name: string; email: string };
};

/* ----------------- UI helpers ------------------ */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });

const importanceMap: Record<
  Msg["importance"],
  { label: string; bg: string; text: string; ring: string; borderLeft: string }
> = {
  info:    { label: "Bilgi",   bg: "bg-sky-50 dark:bg-sky-900/40",   text: "text-sky-700 dark:text-sky-200", ring: "ring-sky-200/60 dark:ring-sky-800/60", borderLeft: "border-sky-300 dark:border-sky-700" },
  warning: { label: "Uyarı",   bg: "bg-amber-50 dark:bg-amber-900/40", text: "text-amber-800 dark:text-amber-100", ring: "ring-amber-200/60 dark:ring-amber-800/60", borderLeft: "border-amber-300 dark:border-amber-700" },
  critical:{ label: "Kritik",  bg: "bg-rose-50 dark:bg-rose-900/40",  text: "text-rose-800 dark:text-rose-100",   ring: "ring-rose-200/60 dark:ring-rose-800/60", borderLeft: "border-rose-300 dark:border-rose-700" },
};

function ImportancePill({ importance }: { importance: Msg["importance"] }) {
  const s = importanceMap[importance];
  const icon = importance === "info" ? "ℹ️" : importance === "warning" ? "⚠️" : "❗";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      <span>{icon}</span>
      <span>{s.label}</span>
    </span>
  );
}

function MessageBubble({ msg, mine }: { msg: Msg; mine: boolean }) {
  const s = importanceMap[msg.importance];
  if (mine) {
    // Benim mesajım: sağda, açık yeşil
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="rounded-2xl px-3 py-2 bg-emerald-100 dark:bg-emerald-700/60 shadow-sm text-slate-800 dark:text-slate-50">
            <div className="mb-1"><ImportancePill importance={msg.importance} /></div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.body}</div>
            <div className="text-[11px] mt-1 opacity-70 text-right">{formatDate(msg.created_at)}</div>
          </div>
        </div>
      </div>
    );
  }
  // Karşı taraf: solda, nötr + önem rengine göre sol şerit
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%]">
        <div className={`rounded-2xl px-3 py-2 bg-white dark:bg-slate-800 shadow-sm border-l-4 ${s.borderLeft}`}>
          <div className="mb-1"><ImportancePill importance={msg.importance} /></div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-100">{msg.body}</div>
          <div className="text-[11px] mt-1 opacity-70 text-left dark:text-gray-300">{formatDate(msg.created_at)}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Yeni: segment + auto-grow composer ---------- */
type ImportanceKey = Msg["importance"];

function ImportanceSegment({
  value,
  onChange,
}: {
  value: ImportanceKey;
  onChange: (v: ImportanceKey) => void;
}) {
  const items: Array<{ key: ImportanceKey; label: string; icon: string; active: string }> = [
    { key: "info",    label: "Bilgi",  icon: "ℹ️", active: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100" },
    { key: "warning", label: "Uyarı",  icon: "⚠️", active: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" },
    { key: "critical",label: "Kritik", icon: "❗", active: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100" },
  ];

  return (
    <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/60">
      {items.map((it, i) => {
        const selected = value === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={`px-3 py-2 text-sm font-medium transition select-none
              ${selected ? it.active : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-700/60"}
              ${i !== items.length - 1 ? "border-r border-slate-200 dark:border-slate-700" : ""}`}
            aria-pressed={selected}
          >
            <span className="mr-1">{it.icon}</span>{it.label}
          </button>
        );
      })}
    </div>
  );
}

function ChatComposer({
  value,
  setValue,
  importance,
  setImportance,
  onSend,
  sending,
}: {
  value: string;
  setValue: (v: string) => void;
  importance: ImportanceKey;
  setImportance: (v: ImportanceKey) => void;
  onSend: () => void;
  sending?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Satır yüksekliği 20px (leading-5), padding top+bottom = 16px (py-2)
  const LINE = 20;              // 1 satır
  const PADDING = 16;           // 8px + 8px
  const MAX_LINES = 3;
  const MAX_H = PADDING + LINE * MAX_LINES; // 3 satır max

  const autoGrow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_H);
    el.style.height = next + "px";
    el.style.overflowY = el.scrollHeight > MAX_H ? "auto" : "hidden";
  };

  useEffect(() => { autoGrow(); }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !sending) onSend();
    }
  };

  return (
    <div className="border-t bg-white dark:bg-slate-900 dark:border-gray-600">
      <div className="max-w-5xl mx-auto p-3 sm:p-4">
        {/* Önem segmenti: her zaman üstte */}
        <div className="mb-2">
          <ImportanceSegment value={importance} onChange={setImportance} />
        </div>

        {/* Input satırı: mobilde dikey, desktop'ta yatay */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={ref}
                className="w-full dark:text-gray-200 dark:border-gray-600 resize-none border rounded-xl px-3 py-2 text-sm leading-5 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800"
                rows={1} /* tek satırdan başla */
                placeholder="Mesajınızı yazın…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ overflowY: "hidden" }} /* JS ile toggle */
              />
              <div className="hidden sm:block absolute bottom-2 right-3 text-[11px] text-slate-400 select-none">
                Enter ↵ gönder • Shift+Enter satır
              </div>
            </div>
          </div>

          <div className="sm:self-end">
            <button
              onClick={onSend}
              disabled={sending || !value.trim()}
              className="w-full sm:w-auto h-[40px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 transition"
            >
              Gönder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ------------------- Component ------------------- */
export default function SupportChat() {
  const { user } = useAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [importance, setImportance] = useState<Msg["importance"]>("info");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const meId = user?.id;

  const loadOrCreateThread = async () => {
    const res = await axios.post("/v1/support/threads");
    setThread(res.data);
  };

  const fetchMessages = async (threadId: number) => {
    try {
      const res = await axios.get(`/v1/support/threads/${threadId}/messages`);
      setMessages(res.data.data ?? res.data);
    } catch {}
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadOrCreateThread();
      } catch {
        toast.error("Destek başlığı yüklenemedi.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!thread) return;
    fetchMessages(thread.id);
    const t = setInterval(() => fetchMessages(thread.id), 8000);
    return () => clearInterval(t);
  }, [thread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!thread || !body.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(`/v1/support/threads/${thread.id}/messages`, {
        body,
        importance,
      });
      setMessages((m) => [...m, res.data]);
      setBody("");
    } catch {
      toast.error("Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  const headerSubtitle = useMemo(() => {
    if (!thread) return "";
    const pr = thread.priority === "high" ? "Yüksek" : thread.priority === "normal" ? "Normal" : "Düşük";
    const st =
      thread.status === "open" ? "Açık" :
      thread.status === "pending" ? "Beklemede" :
      thread.status === "resolved" ? "Çözüldü" : "Kapalı";
    return `Durum: ${st} • Öncelik: ${pr}`;
  }, [thread]);

  if (loading) return <div className="p-4">Yükleniyor…</div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="border-b p-3 bg-gradient-to-r from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-emerald-900/30 backdrop-blur  dark:border-gray-600">
        <div className="font-semibold text-slate-800 dark:text-slate-100">Destek</div>
        <div className="text-xs text-slate-500 dark:text-slate-300">{headerSubtitle}</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/60 dark:bg-slate-900/40">
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return <MessageBubble key={m.id} msg={m} mine={mine} />;
        })}
        <div ref={bottomRef} />
      </div>

      {/* ✅ Yeni Composer */}
      <ChatComposer
        value={body}
        setValue={setBody}
        importance={importance}
        setImportance={setImportance}
        onSend={send}
        sending={sending}
      />
    </div>
  );
}