// src/components/musteriler/MusteriOzelFiyatListesi.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "../../api/axios";

type Row = {
  id: number;
  isim: string;
  marka: string | null;
  liste_fiyati: number;
  iskonto_orani: number;
  ozel_fiyat: number;
};

interface Props {
  musteriId: number;
}

export default function MusteriOzelFiyatListesi({ musteriId }: Props) {
  const [loading, setLoading] = useState(true);
  const [iskonto, setIskonto] = useState<number>(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  const trCurrency = useMemo(
    () => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }),
    []
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(r =>
      (r.isim?.toLowerCase() ?? "").includes(needle) ||
      (r.marka?.toLowerCase() ?? "").includes(needle)
    );
  }, [rows, q]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/v1/musteriler/${musteriId}/ozel-fiyatlar`);
        if (!mounted) return;
        setIskonto(data?.musteri?.iskonto_orani ?? 0);
        setRows(data?.urunler ?? []);
      } catch (e) {
        console.error("Özel fiyatlar yüklenemedi", e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [musteriId]);

  if (loading) {
    return (
      <div className="p-4 rounded-lg border dark:border-white/10">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Üst bilgi çubuğu */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bu müşteri için tanımlı iskonto:{" "}
            <span className="font-semibold">{iskonto}%</span>
          </p>
          {iskonto === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Bu müşteri için iskonto tanımlı değil. Liste fiyatları gösteriliyor.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün/Marka ara..."
            className="w-full sm:w-64 rounded-xl border px-3 py-2 text-sm bg-white dark:bg-transparent dark:border-white/10 outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            onClick={() => setQ("")}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/[0.05]"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto rounded-2xl border dark:border-white/10">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100/70 dark:bg-white/[0.03]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Marka</th>
              <th className="px-4 py-3 text-left font-medium">Ürün</th>
              <th className="px-4 py-3 text-right font-medium">Liste Fiyatı</th>
              <th className="px-4 py-3 text-right font-medium">İskonto %</th>
              <th className="px-4 py-3 text-right font-medium">Özel Fiyat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                <td className="px-4 py-2 align-middle">{r.marka ?? "-"}</td>
                <td className="px-4 py-2 align-middle">{r.isim}</td>
                <td className="px-4 py-2 align-middle text-right">{trCurrency.format(r.liste_fiyati)}</td>
                <td className="px-4 py-2 align-middle text-right">{r.iskonto_orani.toFixed(2)}</td>
                <td className="px-4 py-2 align-middle text-right font-semibold">
                  {trCurrency.format(r.ozel_fiyat)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  Sonuç bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Alt bilgi */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Not: Özel fiyatlar liste fiyatı üzerinden {iskonto}% indirimle hesaplanır.
      </p>
    </div>
  );
}
