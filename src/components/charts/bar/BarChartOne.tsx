import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";


export default function BarChartOne({ data = [] }: { data?: number[] }) {
  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Oca",  // Ocak
        "Şub",  // Şubat
        "Mar",  // Mart
        "Nis",  // Nisan
        "May",  // Mayıs
        "Haz",  // Haziran
        "Tem",  // Temmuz
        "Ağu",  // Ağustos
        "Eyl",  // Eylül
        "Eki",  // Ekim
        "Kas",  // Kasım
        "Ara"   // Aralık
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };
  const series = [
    {
      name: "Satış",
      data: data,
    },
  ];
  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartOne" className="min-w-[1000px]">
        <Chart options={options} series={series} type="bar" height={180} />
      </div>
    </div>
  );
}
