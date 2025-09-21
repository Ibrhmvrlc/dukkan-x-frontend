// src/components/ecommerce/MonthlyCollectionsChart.tsx
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useEffect, useMemo, useState } from "react";
import axios from "../../api/axios";

type MonthlyCollectionsResp = {
  from: string;     // "YYYY-MM-DD" (geçen yıl aynı ayın ilk günü)
  to: string;       // "YYYY-MM-DD" (bu ayın son günü)
  labels: string[]; // 13 öğe, ["Eyl","Eki",...,"Eyl"] gibi
  totals: number[]; // 13 öğe, TL bazında tahsilat toplamları
};

const fmtTLShort = (n: number) => {
  if (n == null) return "—";
  const abs = Math.abs(n);
  const f = (v: number, suf: string) => {
    let s = v.toFixed(2).replace(".", ",");
    s = s.replace(/,00$/, "").replace(/,0$/, "");
    return `₺${s}${suf}`;
  };
  if (abs >= 1_000_000_000) return f(n / 1_000_000_000, "b");
  if (abs >= 1_000_000)     return f(n / 1_000_000, "m");
  if (abs >= 1_000)         return f(n / 1_000, "k");
  return (n ?? 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
};

const fmtTLFull = (n: number) =>
  (n ?? 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });

// Sadece mock için: son 13 ay TR kısa ay adlarını üretir
function last13MonthLabelsTR(): string[] {
  const now = new Date();
  const arr: string[] = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const raw = d.toLocaleDateString("tr-TR", { month: "short" });
    arr.push(raw.replace(".", ""));
  }
  return arr;
}

export default function MonthlyCollectionsChart() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<MonthlyCollectionsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setErr(null);
      setLoading(true);
      const res = await axios.get<MonthlyCollectionsResp>("/v1/dashboard/monthly-collections");
      const labels = Array.from({ length: 13 }, (_, i) => res.data.labels?.[i] ?? "");
      const totals = Array.from({ length: 13 }, (_, i) => res.data.totals?.[i] ?? 0);
      setData({ from: res.data.from, to: res.data.to, labels, totals });
    } catch {
      setErr("Canlı veri bulunamadı.");
      setData({
        from: "",
        to: "",
        labels: last13MonthLabelsTR(),
        totals: Array(13).fill(0),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Yalnızca mobilde min-width ver (scroll'u sadece mobilde tetikle)
  //    Geniş ekranlarda min-w: 100% olsun (scroll gerekmesin).
  const dynamicMinWidth = useMemo(() => {
    const count = data?.labels?.length ?? 13;
    // Her sütun ~52px (etiket + bar), mobilde rahat kaydırma için
    return Math.max(700, count * 52);
  }, [data?.labels]);

  const options: ApexOptions = useMemo(() => ({
    colors: ["#10B981"],
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", height: 180, toolbar: { show: false } },
    plotOptions: {
      // Masaüstü varsayılanı: biraz daha geniş sütunlar
      bar: { horizontal: false, columnWidth: "39%", borderRadius: 5, borderRadiusApplication: "end" },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: data?.labels ?? Array(13).fill(""),
      axisBorder: { show: false },
      axisTicks: { show: false },
      // Masaüstü varsayılanı: düz etiket (rotate = 0)
      labels: {
        rotate: 0,
        trim: true,
        maxHeight: 60,
        style: { fontSize: "12px" },
      },
      tickPlacement: "between",
    },
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    yaxis: {
      labels: { formatter: (val: number) => fmtTLShort(val) },
      title: { text: undefined },
    },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { x: { show: true }, y: { formatter: (val: number) => fmtTLFull(val) } },

    // 🔸 ApexCharts responsive: 768px ve altında mobil ayarlarını uygula
    responsive: [
      {
        breakpoint: 768,
        options: {
          plotOptions: { bar: { columnWidth: "35%" } }, // dar ekran için biraz incelt
          xaxis: {
            labels: {
              style: { fontSize: "11px" },
            },
          },
        },
      },
    ],
  }), [data?.labels]);

  const series = useMemo(() => [{
    name: "Tahsilat (₺)",
    data: data?.totals ?? Array(13).fill(0),
  }], [data?.totals]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        {loading ? (
          ''
        ) : (
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Aylık Tahsilatlar (Son 12 Ay)
          </h3>
        )}
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={() => setIsOpen((s) => !s)}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-44 p-2">
            <DropdownItem
              onItemClick={() => { fetchData(); setIsOpen(false); }}
              className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Yenile
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {err && (
        <div className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200">
          {err}
        </div>
      )}

      {/* Dış sarmal her zaman overflow-x-auto; iç sarmal:
          - Mobilde min-width: var(--minW) → kaydırma açık
          - md ve üstünde min-width: 100% → kaydırma gerekmez */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div
          className="-ml-5 pl-2 min-w-[var(--minW)] md:min-w-full xl:min-w-full"
          style={{ ["--minW" as any]: `${dynamicMinWidth}px` }}
        >
          {loading ? (
            <div className="h-[180px] animate-pulse">
              {/* bar gövdeleri */}
              <div className="flex h-[150px] items-end gap-2">
                {Array.from({ length: 13 }).map((_, i) => {
                  const heights = [40, 70, 55, 95, 60, 80, 50, 110, 65, 85, 58, 100, 75];
                  const h = heights[i % heights.length];
                  return (
                    <div key={i} className="flex-1 flex items-end justify-center">
                      <div
                        className="w-2/3 rounded-md bg-gray-200 dark:bg-gray-800"
                        style={{ height: `${h}px` }}
                        aria-hidden
                      />
                    </div>
                  );
                })}
              </div>
              {/* x-ekseni placeholder’ları */}
              <div className="mt-2 flex justify-between px-1">
                {Array.from({ length: 13 }).map((_, i) => (
                  <span key={i} className="h-3 w-5 rounded bg-gray-200 dark:bg-gray-800" aria-hidden />
                ))}
              </div>
            </div>
          ) : (
            <Chart options={options} series={series} type="bar" height={180} />
          )}
        </div>
      </div>
    </div>
  );
}