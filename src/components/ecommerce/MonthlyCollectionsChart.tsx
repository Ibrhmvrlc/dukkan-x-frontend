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
    // "Eyl.", "Eki." vb. gelebilir; noktayı kaldır, ilk harfi büyük tut
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
        totals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const options: ApexOptions = useMemo(() => ({
    colors: ["#10B981"],
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", height: 180, toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "39%", borderRadius: 5, borderRadiusApplication: "end" },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: data?.labels ?? Array(13).fill(""),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    yaxis: {
      labels: { formatter: (val: number) => fmtTLShort(val) },
      title: { text: undefined },
    },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { x: { show: true }, y: { formatter: (val: number) => fmtTLFull(val) } },
  }), [data?.labels]);

  const series = useMemo(() => [{
    name: "Tahsilat (₺)",
    data: data?.totals ?? Array(13).fill(0),
  }], [data?.totals]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Aylık Tahsilatlar (Son 12 Ay)
        </h3>
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

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] pl-2 xl:min-w-full">
          {loading ? (
            <div className="h-[180px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : (
            <Chart options={options} series={series} type="bar" height={180} />
          )}
        </div>
      </div>
    </div>
  );
}