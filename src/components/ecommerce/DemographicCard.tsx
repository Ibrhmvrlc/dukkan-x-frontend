import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import YalovaDeliveryMap, { DeliveryPoint } from "./YalovaDeliveryMap";
import axios from "../../api/axios";

type ApiResp = {
  points: DeliveryPoint[];
};

// points’tan türetilmiş satır tipi
type Row = DeliveryPoint & { pct: number };

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setErr(null);
      setLoading(true);
      const res = await axios.get<ApiResp>("/v1/dashboard/yalova-delivery-points");
      setPoints(res.data.points ?? []);
    } catch {
      setErr("Henüz aktif değildir!");
      setPoints([]); // boş dizi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const total = useMemo(
    () => points.reduce((s, p) => s + p.shipments_count, 0),
    [points]
  );

  const rows: Row[] = useMemo(() => {
    return points
      .map((p) => ({
        ...p,
        pct: total > 0 ? (p.shipments_count / total) * 100 : 0,
      }))
      .sort((a, b) => b.shipments_count - a.shipments_count);
  }, [points, total]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      {err && (
        <div
          className="mt-3 mb-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200"
          role="status"
          aria-live="polite"
        >
          {err}
        </div>
      )}

      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Yalova Teslimat Dağılımı
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Teslimat noktalarına göre sevkiyat yoğunluğu
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={() => setIsOpen((s) => !s)}>
            <MoreDotIcon className="size-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
            <DropdownItem
              onItemClick={() => {
                fetchData();
                setIsOpen(false);
              }}
              className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Yenile
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="px-4 py-6 my-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 sm:px-6">
        {loading ? (
          <div className="h-[280px] md:h-[360px] lg:h-[420px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <div className="-mx-4 sm:-mx-6">
            <YalovaDeliveryMap points={points} className="w-full" />
          </div>
        )}
      </div>

      {/* Liste: Nokta bazında oransal paylar */}
      <div className="space-y-5">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Henüz sevkiyat yok.</p>
        ) : (
          rows.map((r) => {
            const title = r.baslik ?? r.ilce ?? r.il ?? "Nokta";
            const initial = title.charAt(0).toUpperCase();

            return (
              <div key={r.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 text-xs font-semibold">
                    {initial}
                  </div>
                  <div>
                    <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                      {title}
                    </p>
                    <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                      {r.shipments_count.toLocaleString("tr-TR")} sevkiyat
                    </span>
                  </div>
                </div>

                <div className="flex w-full max-w-[160px] items-center gap-3">
                  <div className="relative block h-2 w-full max-w-[120px] rounded-sm bg-gray-200 dark:bg-gray-800">
                    <div
                      className="absolute left-0 top-0 h-full rounded-sm bg-emerald-500"
                      style={{ width: `${r.pct.toFixed(2)}%` }}
                    />
                  </div>
                  <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90 tabular-nums">
                    %{r.pct.toFixed(1)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {total > 0 && (
          <div className="pt-2 text-right text-xs text-gray-500 dark:text-gray-400">
            Toplam: {total.toLocaleString("tr-TR")} sevkiyat
          </div>
        )}
      </div>
    </div>
  );
}4