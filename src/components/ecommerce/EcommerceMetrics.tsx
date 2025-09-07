// src/components/ecommerce/EcommerceMetrics.tsx
import { useEffect, useState } from "react";
import axios from "../../api/axios";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

type Pair = { current: number; prev: number };

type MetricsPayload = {
  customers: Pair;                 // kümülatif müşteri (current/prev ay sonu)
  orders: Pair;                    // bu ay ve geçen ay sipariş adedi
  ordersTotal: number;             // <-- TÜM ZAMANLAR toplam sipariş adedi (backend'ten)
};

function pctChange({ current, prev }: Pair) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

function formatInt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

export default function EcommerceMetrics({
  data: externalData,
}: {
  data?: MetricsPayload;
}) {
  const [data, setData] = useState<MetricsPayload | null>(externalData ?? null);
  const [loading, setLoading] = useState(!externalData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (externalData) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get<MetricsPayload>("/v1/dashboard/ecommerce-metrics");
        if (mounted) setData(res.data);
      } catch {
        if (mounted) {
          setData({
            customers: { current: 0, prev: 0 },
            orders: { current: 0, prev: 0 },
            ordersTotal: 0,
          });
          setError("Canlı veri bulunamadı.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [externalData]);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {/* Customers skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"></div>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <span className="block h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></span>
              <span className="mt-2 block h-6 w-16 rounded bg-gray-200 dark:bg-gray-700"></span>
            </div>
            <span className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700"></span>
          </div>
        </div>

        {/* Orders skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"></div>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <span className="block h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></span>
              <span className="mt-2 block h-6 w-16 rounded bg-gray-200 dark:bg-gray-700"></span>
            </div>
            <span className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700"></span>
          </div>
        </div>
      </div>
    );
  }

  const custDiff = data.customers.current - data.customers.prev;

  const getOrdersBadge = (pair: Pair) => {
    const pct = pctChange(pair);
    const monthCount = pair.current;

    if (pct > 0)
      return (
        <Badge color="success">
          <ArrowUpIcon />
          +{formatInt(monthCount)} (+{pct.toFixed(2)}%)
        </Badge>
      );
    if (pct < 0)
      return (
        <Badge color="error">
          <ArrowDownIcon />
          +{formatInt(monthCount)} (-{Math.abs(pct).toFixed(2)}%)
        </Badge>
      );
    return <Badge>+{formatInt(monthCount)} (0%)</Badge>;
  };

  const getCustomersBadge = (diff: number) => {
    if (diff > 0) {
      return (
        <Badge color="success">
          <ArrowUpIcon />
          {diff} yeni müşteri
        </Badge>
      );
    }
    return <Badge>Değişim yok</Badge>;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {error && (
        <div className="col-span-1 sm:col-span-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200">
          {error}
        </div>
      )}

      {/* Customers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <GroupIcon className="size-6 text-gray-800 dark:text-white/90" />
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Müşteriler</span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatInt(data.customers.current)}
            </h4>
          </div>
          {getCustomersBadge(custDiff)}
        </div>
      </div>

      {/* Orders (TÜM ZAMANLAR toplam) + Bu ay yüzdesi */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <BoxIconLine className="size-6 text-gray-800 dark:text-white/90" />
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Siparişler (Toplam)</span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatInt(data.ordersTotal)}
            </h4>
          </div>
          {getOrdersBadge(data.orders)}
        </div>
      </div>
    </div>
  );
}