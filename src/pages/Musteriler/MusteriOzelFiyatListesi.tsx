import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "../../api/axios";

type Row = {
  id: number;
  isim: string;
  marka: string | null;
  liste_fiyati: number;
  iskonto_orani: number;
  ozel_fiyat: number;
};

type PageMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

interface Props {
  musteriId: number;
}

export default function MusteriOzelFiyatListesi({ musteriId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [iskonto, setIskonto] = useState<number>(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [reloadKey, setReloadKey] = useState(0);
  const [meta, setMeta] = useState<PageMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
    from: 0,
    to: 0,
  });

  const trCurrency = useMemo(
    () => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }),
    []
  );

  // --- Helpers ---
  const normalizeRate = (v: unknown) => {
    if (v == null) return 0;
    if (typeof v === "number" && isFinite(v)) return v;
    const s = String(v).trim().replace(",", ".");
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  };
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

  // Sunucudan veri çek
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/v1/musteriler/${musteriId}/ozel-fiyatlar`, {
        params: { page, per_page: perPage, q },
      });

      setIskonto(data?.musteri?.iskonto_orani ?? 0);

      const p = data?.urunler ?? {};
      setRows(p?.data ?? []);
      setMeta({
        current_page: p?.current_page ?? 1,
        last_page: p?.last_page ?? 1,
        per_page: p?.per_page ?? perPage,
        total: p?.total ?? 0,
        from: p?.from ?? 0,
        to: p?.to ?? 0,
      });
    } catch (e) {
      console.error("Özel fiyatlar yüklenemedi", e);
    } finally {
      setLoading(false);
    }
  }, [musteriId, page, perPage, q]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  // Ekranda anında güncelle (optimistik)
  const applyOptimisticDiscount = (newRate: number) => {
    setRows((prev) =>
      prev.map((r) => {
        const ozelFiyat = r.liste_fiyati * (1 - newRate / 100);
        return {
          ...r,
          iskonto_orani: newRate,
          ozel_fiyat: Number(ozelFiyat.toFixed(2)),
        };
      })
    );
  };

  // Kaydet
  const handleSaveIskonto = async () => {
    const sanitized = clamp(Number(normalizeRate(iskonto)), 0, 100);
    setIskonto(sanitized);
    applyOptimisticDiscount(sanitized);

    try {
      setSaving(true);
      await axios.put(
        `/v1/musteriler/${musteriId}/iskonto`,
        { iskonto_orani: Number(sanitized.toFixed(2)) },
        { headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );
      // Server'daki hesaplar kesinleşsin
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      console.error("İskonto güncellenemedi", err);
      // Hata durumunda server state'e dön
      setReloadKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  };

  const clearSearch = () => {
    setQ("");
    setPage(1);
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg border dark:border-white/10">Yükleniyor...</div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Üst bilgi çubuğu */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Müşteri için iskonto:
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={iskonto}
            onChange={(e) =>
              setIskonto(clamp(parseFloat(e.target.value || "0"), 0, 100))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveIskonto();
            }}
            onBlur={handleSaveIskonto}
            className="w-24 rounded-lg border px-2 py-1 text-sm bg-white dark:bg-transparent dark:text-gray-300 dark:border-white/10"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">%</span>

          <button
            onClick={handleSaveIskonto}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
            title="İskontoyu kaydet"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Ürün/Marka ara..."
            className="w-full sm:w-64 rounded-xl border px-3 py-2 text-sm bg-white dark:bg-transparent dark:text-gray-300 dark:border-white/10 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            onClick={clearSearch}
            className="px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.05] dark:text-gray-300 text-sm"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto rounded-2xl border dark:border-white/10">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100/70 dark:bg-white/[0.03] dark:text-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Marka</th>
              <th className="px-4 py-3 text-left font-medium">Ürün</th>
              <th className="px-4 py-3 text-right font-medium">Liste Fiyatı</th>
              <th className="px-4 py-3 text-right font-medium">İskonto %</th>
              <th className="px-4 py-3 text-right font-medium">Özel Fiyat</th>
            </tr>
          </thead>
        <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.03] dark:text-gray-300"
              >
                <td className="px-4 py-2 align-middle">{r.marka ?? "-"}</td>
                <td className="px-4 py-2 align-middle">{r.isim}</td>
                <td className="px-4 py-2 align-middle text-right">
                  <span
                    className={r.iskonto_orani > 0 ? "line-through opacity-70" : ""}
                  >
                    {trCurrency.format(r.liste_fiyati)}
                  </span>
                </td>
                <td className="px-4 py-2 align-middle text-right">
                  {r.iskonto_orani.toFixed(2)}
                </td>
                <td className="px-4 py-2 align-middle text-right font-semibold">
                  {trCurrency.format(r.ozel_fiyat)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  Sonuç bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sayfalama çubuğu */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Toplam <span className="font-semibold">{meta.total}</span> kayıt —{" "}
          {meta.from ?? 0}–{meta.to ?? 0} gösteriliyor. Sayfa {meta.current_page}/
          {meta.last_page}.
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Sayfa boyutu
          </label>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(parseInt(e.target.value, 10));
              setPage(1);
            }}
            className="rounded-lg border px-2 py-1 text-sm bg-white dark:bg-transparent dark:text-gray-300 dark:border-white/10"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={meta.current_page <= 1}
            className="px-3 py-1.5 rounded-lg border dark:border-white/10 text-sm disabled:opacity-50 dark:text-gray-300"
          >
            Önceki
          </button>
          <button
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={meta.current_page >= meta.last_page}
            className="px-3 py-1.5 rounded-lg border dark:border-white/10 text-sm disabled:opacity-50 dark:text-gray-300"
          >
            Sonraki
          </button>
        </div>
      </div>

      {/* Alt bilgi */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Not: Özel fiyatlar liste fiyatı üzerinden {iskonto}% indirimle hesaplanır.
      </p>
    </div>
  );
}