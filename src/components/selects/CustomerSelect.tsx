import { useEffect, useMemo, useRef, useState } from "react";
import axios from "../../api/axios";

type Customer = {
  id: number;
  unvan?: string;
  isim?: string;
  name?: string;
  telefon?: string | null;
  email?: string | null;
};

export default function CustomerCombo({
  value,
  onChange,
  placeholder = "Müşteri ara ve seç…",
  onlyActive = true,
  autoFocus = true,
}: {
  value?: number | null;
  onChange: (id: number | null, selected?: Customer | null) => void;
  placeholder?: string;
  onlyActive?: boolean;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1); // klavye için
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Gösterilecek isim alanı
  const displayName = (c?: Customer | null) =>
    (c?.unvan || c?.isim || c?.name || (c?.id ? `#${c.id}` : "")) as string;

  // Dışarı tıklandığında kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  // Arama değişince listeyi sıfırla
  useEffect(() => {
    setPage(1);
    setItems([]);
    setLastPage(1);
  }, [query, onlyActive]);

  // Debounce
  const debouncedQuery = useMemo(() => {
    const t = setTimeout(() => {}, 300);
    return { key: `${query}-${onlyActive}`, timer: t };
    // eslint-disable-next-line
  }, [query, onlyActive]);

  // Veri çek
  useEffect(() => {
    let aborted = false;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await axios.get("/v1/musteriler", {
          params: {
            search: query || undefined,
            page,
            only_active: onlyActive ? 1 : 0,
          },
        });
        const data: Customer[] = res.data?.data ?? [];
        const meta = res.data?.meta ?? {};
        if (!aborted) {
          setItems((prev) => (page === 1 ? data : [...prev, ...data]));
          setLastPage(meta.last_page ?? 1);
        }
      } catch {
        if (!aborted && page === 1) {
          setItems([]);
          setLastPage(1);
        }
      } finally {
        !aborted && setLoading(false);
      }
    }
    const t = setTimeout(fetchData, 300); // debounce
    return () => {
      aborted = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line
  }, [debouncedQuery.key, page]);

  // Sonsuz kaydırma: liste sonundaki “gözlemci”
  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !loading && page < lastPage) {
        setPage((p) => p + 1);
      }
    });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [loading, page, lastPage]);

  // Klavye
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) setOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
      scrollActiveIntoView();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      scrollActiveIntoView();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < items.length) {
        const picked = items[activeIndex];
        onChange(picked.id, picked);
        setQuery(displayName(picked));
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const scrollActiveIntoView = () => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    if (el) el.scrollIntoView({ block: "nearest" });
  };

  const pick = (c: Customer) => {
    onChange(c.id, c);
    setQuery(displayName(c));
    setOpen(false);
    setActiveIndex(-1);
  };

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null, null);
              setQuery("");
              setOpen(true);
            }}
            className="px-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-600"
            title="Seçimi temizle"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          className="absolute z-20 mt-2 w-full max-h-80 overflow-auto rounded-lg border bg-white shadow-lg dark:bg-gray-900 dark:text-gray-100 dark:border-white/20"
        >
          {items.length === 0 && !loading ? (
            <div className="p-4 text-sm text-gray-500">Sonuç yok</div>
          ) : (
            <>
              {items.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  data-index={i}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(c)}
                  className={`w-full text-left px-3 py-2 last:border-b-0 dark:hover:bg-gray-800 ${
                    i === activeIndex ? "bg-gray-100 dark:bg-gray-800" : ""
                  }`}
                >
                  <div className="font-medium">{displayName(c)}</div>
                  {(c.telefon || c.email) && (
                    <div className="text-xs text-gray-500">
                      {c.telefon ? c.telefon : ""} {c.email ? `• ${c.email}` : ""}
                    </div>
                  )}
                </button>
              ))}
              {/* sonsuz kaydırma sentinel */}
              <div ref={sentinelRef} />
              {loading && (
                <div className="p-3 text-center text-sm text-gray-500">
                  Yükleniyor…
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}