import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { Link } from "react-router-dom";

type Thread = {
  id: number;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "normal" | "high";
  last_message_at?: string | null;
  customer: { id: number; name: string; email: string };
  admin?: { id: number; name: string } | null;
};

const statusChip = (s: Thread["status"]) => {
  const map = {
    open:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
    pending: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/60",
    resolved:"bg-sky-50 text-sky-700 ring-1 ring-sky-200/60",
    closed:  "bg-slate-100 text-slate-700 ring-1 ring-slate-300/60",
  } as const;
  return map[s];
};
const prChip = (p: Thread["priority"]) => {
  const map = {
    low:    "bg-slate-100 text-slate-700 ring-1 ring-slate-300/60",
    normal: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60",
    high:   "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60",
  } as const;
  return map[p];
};

export default function AdminSupportInbox() {
  const [items, setItems] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await axios.get("/v1/support/threads");
    setItems(res.data.data ?? res.data);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Yükleniyor…</div>;

  return (
    <div className="p-4">
      <div className="text-lg font-semibold mb-3">Destek Kutusu</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <Link
            key={t.id}
            to={`/admin/support/threads/${t.id}`}
            className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-slate-800 dark:text-slate-100">
                {t.customer?.name ?? t.customer?.email}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.last_message_at ? new Date(t.last_message_at).toLocaleString() : "-"}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${statusChip(t.status)}`}>
                {t.status}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${prChip(t.priority)}`}>
                {t.priority}
              </span>
              <span className="ml-auto text-[11px] text-slate-500">
                Admin: {t.admin?.name ?? "-"}
              </span>
            </div>

            <div className="mt-3 text-[12px] text-slate-500">
              Sohbete git →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}