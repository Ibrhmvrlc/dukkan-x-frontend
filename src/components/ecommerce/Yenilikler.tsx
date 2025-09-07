import { useEffect, useMemo, useState } from "react";
import axios from "../../api/axios";
import Button from "../ui/button/Button";

type Item = {
  id: number;
  baslik: string;
  ozet?: string | null;
  icerik?: string | null;
  modul?: string | null;
  seviye: "info" | "improvement" | "fix" | "breaking";
  surum?: string | null;
  is_pinned: boolean;
  link?: string | null;
  yayin_tarihi?: string | null; // ISO
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
};

type ApiPage<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url?: string | null;
};

const trDate = (iso?: string | null) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(d);
  } catch {
    return iso;
  }
};

const levelLabel: Record<Item["seviye"], string> = {
  info: "Bilgi",
  improvement: "İyileştirme",
  fix: "Düzeltme",
  breaking: "Kırıcı Değişiklik",
};

const levelBadge = (lvl: Item["seviye"]) => {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  switch (lvl) {
    case "improvement": return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`;
    case "fix":         return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`;
    case "breaking":    return `${base} bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300`;
    default:            return `${base} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200`;
  }
};

export default function Yenilikler() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modul, setModul] = useState<string>(""); // basit filtre

  const fetchPage = async (p = 1, append = false) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { per_page: 5, page: p };
      if (modul) params.modul = modul;
      const { data } = await axios.get<ApiPage<Item>>("/v1/yenilikler", { params });
      setPage(data.current_page);
      setLastPage(data.last_page);
      setItems(prev => append ? [...prev, ...data.data] : data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(1, false); }, [modul]);

  const uniqueModules = useMemo(() => {
    const set = new Set(items.map(i => i.modul).filter(Boolean) as string[]);
    return Array.from(set);
  }, [items]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold dark:text-gray-300">Yenilikler</h2>
        <div className="flex gap-2">
          <select
            value={modul}
            onChange={e => setModul(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300"
          >
            <option value="">Tümü (modül)</option>
            {uniqueModules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className={levelBadge(item.seviye)}>{levelLabel[item.seviye]}</span>
              {item.modul && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  {item.modul}
                </span>
              )}
              {item.surum && (
                <span className="text-xs text-slate-500">v{item.surum}</span>
              )}
              {item.is_pinned && (
                <span className="text-xs text-rose-500">• sabit</span>
              )}
              <span className="ml-auto text-xs text-slate-500">{trDate(item.yayin_tarihi)}</span>
            </div>

            <h3 className="mt-2 text-base font-medium dark:text-gray-300">{item.baslik}</h3>

            {item.ozet && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.ozet}</p>
            )}

            <div className="mt-2">
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium underline hover:no-underline"
                >
                  Detaylar →
                </a>
              ) : null}
            </div>
          </div>
        ))}

        {loading && (
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
            <div className="mt-2 h-5 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        {page < lastPage ? (
          <Button onClick={() => fetchPage(page + 1, true)}>
            Daha Fazla Göster
          </Button>
        ) : (
          <span className="text-xs text-slate-500">Hepsi görüntülendi</span>
        )}
      </div>
    </div>
  );
}