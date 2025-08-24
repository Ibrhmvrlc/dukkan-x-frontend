// src/pages/Musteriler/Ekstre.tsx
import { useEffect, useState } from "react";
import axios from "../../api/axios";

type Row = {
  tur: "siparis" | "tahsilat";
  id: number;
  tarih: string;
  aciklama?: string | null;
  belge_no?: string | number | null;
  borc: number;
  alacak: number;
  bakiye: number;
};

type EkstreResponse = {
  data: Row[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    toplam_borc: number;
    toplam_alacak: number;
    bakiye: number;
  };
};

export default function Ekstre({ musteriId }: { musteriId: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [summary, setSummary] = useState({ borc: 0, alacak: 0, bakiye: 0 });

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get<EkstreResponse>(
        `/v1/musteriler/${musteriId}/ekstre`,
        { params: { page: p, per_page: 50, date_from: dateFrom || undefined, date_to: dateTo || undefined } }
      );
      setRows(res.data.data);
      setPage(res.data.meta.current_page);
      setLastPage(res.data.meta.last_page);
      setSummary({
        borc: res.data.meta.toplam_borc,
        alacak: res.data.meta.toplam_alacak,
        bakiye: res.data.meta.bakiye,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musteriId]);

  const money = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(n || 0);

  const colorByType = (tur: Row["tur"]) =>
    tur === "siparis" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400";

  const onFilter = () => fetchData(1);

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 dark:text-gray-400">Başlangıç</label>
          <input type="date" className="px-2 py-1.5 rounded border bg-white dark:bg-transparent dark:border-white/10"
                 value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 dark:text-gray-400">Bitiş</label>
          <input type="date" className="px-2 py-1.5 rounded border bg-white dark:bg-transparent dark:border-white/10"
                 value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <button
          onClick={onFilter}
          className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Filtrele
        </button>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border p-4 dark:border-white/10">
          <div className="text-xs text-gray-500">Toplam Borç (Siparişler)</div>
          <div className="mt-1 text-lg font-semibold text-rose-600 dark:text-rose-400">{money(summary.borc)}</div>
        </div>
        <div className="rounded-xl border p-4 dark:border-white/10">
          <div className="text-xs text-gray-500">Toplam Alacak (Tahsilatlar)</div>
          <div className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">{money(summary.alacak)}</div>
        </div>
        <div className="rounded-xl border p-4 dark:border-white/10">
          <div className="text-xs text-gray-500">Bakiye</div>
          <div className={`mt-1 text-lg font-semibold ${summary.bakiye >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {money(summary.bakiye)}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto rounded-xl border dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-white/[0.02]">
            <tr className="text-left text-gray-600 dark:text-gray-300">
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Tür</th>
              <th className="px-3 py-2">Belge No</th>
              <th className="px-3 py-2">Açıklama</th>
              <th className="px-3 py-2 text-right">Borç</th>
              <th className="px-3 py-2 text-right">Alacak</th>
              <th className="px-3 py-2 text-right">Bakiye</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">Yükleniyor...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
            ) : rows.map((r) => (
              <tr key={`${r.tur}-${r.id}`} className="border-t dark:border-white/5">
                <td className="px-3 py-2 whitespace-nowrap">{r.tarih}</td>
                <td className={`px-3 py-2 font-medium ${colorByType(r.tur)}`}>
                  {r.tur === "siparis" ? "Sipariş" : "Tahsilat"}
                </td>
                <td className="px-3 py-2">{r.belge_no ?? "-"}</td>
                <td className="px-3 py-2">{r.aciklama ?? "-"}</td>
                <td className="px-3 py-2 text-right">{r.borc ? money(r.borc) : "-"}</td>
                <td className="px-3 py-2 text-right">{r.alacak ? money(r.alacak) : "-"}</td>
                <td className="px-3 py-2 text-right font-semibold">{money(r.bakiye)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => fetchData(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
        >
          Önceki
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {page} / {lastPage}
        </div>
        <button
          onClick={() => fetchData(Math.min(lastPage, page + 1))}
          disabled={page >= lastPage}
          className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}