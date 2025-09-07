// src/components/ecommerce/MonthlyTarget.tsx
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon} from "../../icons";
import axios from "../../api/axios";

type FinanceCompact = {
  overall_collection_ratio: number; // tüm zamanlar satışlarının tahsil edilme oranı (%)
  total_invoiced_all: number;       // tüm zamanlar satış toplamı (faturalandırılmış)
  total_collected_all: number;      // tüm zamanlar tahsil edilen toplam
  total_receivable_now?: number;    // (opsiyonel)
  collected_this_month: number;     // bu ay tahsil edilen toplam
  collected_prev_month: number;     // <-- geçen ay tahsil edilen toplam (EKLENDİ)
};

const fmtCompact = (n: number) => {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const format = (v: number, suf: string) => {
    let s = v.toFixed(2).replace(".", ",");
    s = s.replace(/,00$/, "").replace(/,0$/, "");
    return `${s}${suf}`;
  };
  if (abs >= 1_000_000_000) return format(n / 1_000_000_000, "b");
  if (abs >= 1_000_000)     return format(n / 1_000_000, "m");
  if (abs >= 1_000)         return format(n / 1_000, "k");
  return n.toLocaleString("tr-TR");
};

const pctChange = (cur: number, prev: number) => {
  if (!prev) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
};

export default function MonthlyTarget() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<FinanceCompact | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const fetchData = async () => {
    try {
      setErr(null);
      const res = await axios.get<FinanceCompact>("/v1/dashboard/finance-monthly");
      setData({
        overall_collection_ratio: res.data.overall_collection_ratio ?? 0,
        total_invoiced_all: res.data.total_invoiced_all ?? 0,
        total_collected_all: res.data.total_collected_all ?? 0,
        total_receivable_now: res.data.total_receivable_now ?? 0,
        collected_this_month: res.data.collected_this_month ?? 0,
        collected_prev_month: res.data.collected_prev_month ?? 0, // <-- EK
      });
    } catch {
      setErr("Canlı veri bulunamadı.");
      setData({
        overall_collection_ratio: 0,
        total_invoiced_all: 0,
        total_collected_all: 0,
        total_receivable_now: 0,
        collected_this_month: 0,
        collected_prev_month: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    timerRef.current = window.setInterval(fetchData, 15000);
    const onVis = () => document.visibilityState === "visible" && fetchData();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const exceeded = (data?.overall_collection_ratio ?? 0) >= 100;
  const displayRatio = Math.min(data?.overall_collection_ratio ?? 0, 100);
  const monthlyDeltaPct = pctChange(data?.collected_this_month ?? 0, data?.collected_prev_month ?? 0);

  const series = useMemo(() => [displayRatio], [displayRatio]);

  const options: ApexOptions = useMemo(
    () => ({
      colors: [exceeded ? "#10B981" : "#465FFF"],
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "radialBar",
        height: 330,
        sparkline: { enabled: true },
      },
      plotOptions: {
        radialBar: {
          startAngle: -85,
          endAngle: 85,
          hollow: { size: "80%" },
          track: { background: "#E4E7EC", strokeWidth: "100%", margin: 5 },
          dataLabels: {
            name: { show: false },
            value: {
              fontSize: "36px",
              fontWeight: "600",
              offsetY: -40,
              color: "#1D2939",
              formatter: () => (exceeded ? "100%+" : `${displayRatio.toFixed(1)}%`),
            },
          },
        },
      },
      fill: { type: "solid", colors: [exceeded ? "#10B981" : "#465FFF"] },
      stroke: { lineCap: "round" },
      labels: ["Progress"],
    }),
    [exceeded, displayRatio]
  );

  const badgeBg =
  monthlyDeltaPct > 0
    ? "bg-emerald-50 dark:bg-emerald-900/20"
    : monthlyDeltaPct < 0
    ? "bg-red-50 dark:bg-red-900/20"
    : "bg-gray-100 dark:bg-gray-700/30";

const badgeText =
  monthlyDeltaPct > 0
    ? "text-emerald-700 dark:text-emerald-200"
    : monthlyDeltaPct < 0
    ? "text-red-700 dark:text-red-200"
    : "text-gray-700 dark:text-gray-200";

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Satış/Tahsilat Oranı
            </h3>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              Tüm satışların tahsil edilme oranı
            </p>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={() => setIsOpen((s) => !s)}>
              <MoreDotIcon className="size-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>
            <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
              <DropdownItem
                onItemClick={() => { fetchData(); setIsOpen(false); }}
                className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Yenile
              </DropdownItem>
              <DropdownItem
                onItemClick={() => setIsOpen(false)}
                className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        <div className="relative">
          <div className="max-h-[330px]" id="chartDarkStyle">
            {loading ? (
              <div className="h-[330px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            ) : (
              <Chart options={options} series={series} type="radialBar" height={330} />
            )}
          </div>
        </div>

        {/* Açıklama + rozet (alt alta, ortalanmış) */}
        <div className="mx-auto mt-5 w-full max-w-[420px] flex flex-col items-center">
          <p className="text-center text-sm text-gray-500 sm:text-base">
            Bu ayki tahsilat:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {data ? fmtCompact(data.collected_this_month) : "—" } ₺
            </span>
          </p>

          {/* Rozet: Geçen aya göre değişim (küçük font, arka plan & yazı rengi dinamik) */}
          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs ${badgeBg} ${badgeText}`}
          >
            <span className="block text-[10px] sm:text-[11px]">
              {monthlyDeltaPct > 0
                ? `Geçen aya göre +${monthlyDeltaPct.toFixed(1)}%`
                : monthlyDeltaPct < 0
                ? `Geçen aya göre -${Math.abs(monthlyDeltaPct).toFixed(1)}%`
                : "Geçen aya göre değişim yok"}
            </span>
          </span>
        </div>
      </div>

      {/* Alt 3 KPI: Satış (Toplam) / Tahsilat (Toplam) / Aylık Tahsilat */}
      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div className="text-center">
          <p className="mb-1 text-theme-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Satış (Toplam)
          </p>
          <p className="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {data ? fmtCompact(data.total_invoiced_all) : "—"} ₺
          </p>
        </div>

        <div className="h-7 w-px bg-gray-200 dark:bg-gray-800" />

        <div className="text-center">
          <p className="mb-1 text-theme-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Tahsilat (Toplam)
          </p>
          <p className="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {data ? fmtCompact(data.total_collected_all) : "—"} ₺
          </p>
        </div>

        <div className="h-7 w-px bg-gray-200 dark:bg-gray-800" />

        <div className="text-center">
          <p className="mb-1 text-theme-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Aylık Tahsilat
          </p>
          <p className="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {data ? fmtCompact(data.collected_this_month) : "—"} ₺
          </p>
        </div>
      </div>

      {err && (
        <div className="mx-6 mb-4 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200">
          {err}
        </div>
      )}
    </div>
  );
}