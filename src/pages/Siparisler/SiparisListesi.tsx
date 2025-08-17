// components/siparis/SiparisListesi.tsx
import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { Modal } from "../../components/ui/modal";

interface SiparisListesiProps {
  musteriId: number;
}

type UrunKalem = {
  adet: number | string | null;
  birim_fiyat: number | string | null;
  iskonto_orani?: number | string | null;
  kdv_orani?: number | string | null;
  urun?: { isim?: string | null };
};

type Siparis = {
  id: number;
  tarih?: string | null;
  fatura_no?: string | number | null;
  durum?: string | null;
  yetkili_id?: number | null;
  teslimat_adresi_id?: number | null;
  yetkili?: { isim?: string | null };
  teslimat_adresi?: { adres?: string | null };
  urunler: UrunKalem[];
};

type PageMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

// --- yardımcı tipler ---
type YetkiliOpt = {
  id: number;
  isim: string;
  pozisyon?: string;
  telefon?: string;
};
type AdresOpt = {
  id: number;
  adres?: string;
  baslik?: string;
  label: string; // baslik - adres birleşik gösterim
};

// --- yardımcı fonksiyonlar ---
const toNum = (v: unknown): number => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

const money = (n: unknown) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNum(n)) + " ₺";

const percent = (n: unknown) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNum(n)) + " %";

// gelen response'u esnek şekilde diziye indirger
function arr<T = any>(res: any, key?: string): T[] {
  const d = res?.data ?? res;
  if (Array.isArray(d)) return d as T[];
  if (Array.isArray(d?.data)) return d.data as T[];
  if (key && Array.isArray(d?.[key])) return d[key] as T[];
  if (key && Array.isArray(d?.data?.[key])) return d.data[key] as T[];
  return [];
}

// Özet hesap
function hesaplaOzet(urunler: UrunKalem[]) {
  let araToplam = 0,
    netToplam = 0,
    toplamIskonto = 0;
  const kdvGruplari: Record<string, number> = {};

  (urunler || []).forEach((item) => {
    const adet = toNum(item.adet);
    const fiyat = toNum(item.birim_fiyat);
    const isk = toNum(item.iskonto_orani);
    const kdv = toNum(item.kdv_orani);

    const brut = adet * fiyat;
    const net = brut * (1 - isk / 100);
    const kdvTutar = net * (kdv / 100);

    araToplam += brut;
    netToplam += net;
    toplamIskonto += brut - net;
    const key = String(kdv);
    kdvGruplari[key] = (kdvGruplari[key] ?? 0) + kdvTutar;
  });

  const toplamKdv = Object.values(kdvGruplari).reduce((a, b) => a + b, 0);
  const genelToplam = netToplam + toplamKdv;
  return { araToplam, netToplam, toplamIskonto, kdvGruplari, toplamKdv, genelToplam };
}

export default function SiparisListesi({ musteriId }: SiparisListesiProps) {
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [loading, setLoading] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [meta, setMeta] = useState<PageMeta>({
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
    from: 0,
    to: 0,
  });

  // modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Siparis | null>(null);
  const [saving, setSaving] = useState(false);

  // select verileri
  const [yetkiliList, setYetkiliList] = useState<YetkiliOpt[]>([]);
  const [adresList, setAdresList] = useState<AdresOpt[]>([]);

  // Listeyi çek
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/v1/musteriler/${musteriId}/siparisler`, {
          params: { page, per_page: perPage },
        });
        if (!mounted) return;

        const p = data ?? {};
        setSiparisler(p?.data ?? []);
        setMeta({
          current_page: p?.current_page ?? 1,
          last_page: p?.last_page ?? 1,
          per_page: p?.per_page ?? perPage,
          total: p?.total ?? 0,
          from: p?.from ?? 0,
          to: p?.to ?? 0,
        });
      } catch (err) {
        console.error("Siparişler alınamadı:", err);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [musteriId, page, perPage]);

  // Modal açıldığında yetkili & adresleri tek endpointten çek
  useEffect(() => {
    if (!editOpen) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await axios.get(`/v1/siparisler/create/${musteriId}`);

        const ys = arr<any>(res, "yetkililer").map((y) => ({
          id: y?.id,
          isim: y?.isim ?? "",
          pozisyon: y?.pozisyon ?? "",
          telefon: y?.telefon ?? "",
        })) as YetkiliOpt[];

        const as = arr<any>(res, "teslimat_adresleri").map((a) => {
          const baslik = a?.baslik ?? "";
          const adres = a?.adres ?? "";
          const label = [baslik, adres].filter(Boolean).join(" - ");
          return { id: a?.id, adres, baslik, label } as AdresOpt;
        });

        if (cancelled) return;
        setYetkiliList(ys);
        setAdresList(as);
      } catch (e) {
        console.error("Seçenekler alınamadı:", e);
        if (cancelled) return;
        setYetkiliList([]);
        setAdresList([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editOpen, musteriId]);

  // >>> Reconcile: Liste geldikten sonra mevcut ilişkiden ID’yi bul ve set et
  useEffect(() => {
    if (!editOpen || !editing) return;

    // YETKİLİ
    if ((editing.yetkili_id == null || editing.yetkili_id === 0) && editing.yetkili?.isim) {
      const match = yetkiliList.find(
        (y) => y.isim?.trim().toLowerCase() === String(editing.yetkili?.isim ?? "").trim().toLowerCase()
      );
      if (match) {
        setEditing((prev) => (prev ? { ...prev, yetkili_id: match.id } : prev));
      }
    }

    // ADRES
    if (
      (editing.teslimat_adresi_id == null || editing.teslimat_adresi_id === 0) &&
      editing.teslimat_adresi?.adres
    ) {
      const target = String(editing.teslimat_adresi.adres).trim();
      // önce tam eşleşme, yoksa includes
      let match = adresList.find((a) => (a.adres ?? "").trim() === target);
      if (!match) {
        match = adresList.find((a) => (a.adres ?? "").includes(target) || target.includes(a.adres ?? ""));
      }
      if (match) {
        setEditing((prev) => (prev ? { ...prev, teslimat_adresi_id: match.id } : prev));
      }
    }
  }, [editOpen, editing, yetkiliList, adresList]);

  const openEdit = (s: Siparis) => {
    const clone: Siparis = JSON.parse(JSON.stringify(s));
    setEditing(clone);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
    setSaving(false);
  };

  const onFieldChange = (path: string, value: any) => {
    if (!editing) return;
    const clone: any = JSON.parse(JSON.stringify(editing));
    const parts = path.split(".");
    let ref = clone;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (/^\d+$/.test(key)) {
        const idx = Number(key);
        ref = ref[idx];
      } else {
        if (!(key in ref) || ref[key] == null) ref[key] = {};
        ref = ref[key];
      }
    }
    const last = parts[parts.length - 1];
    ref[last] = value;
    setEditing(clone);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const temiz: Siparis = JSON.parse(JSON.stringify(editing));
    temiz.urunler = (temiz.urunler || []).map((u) => ({
      ...u,
      adet: toNum(u.adet),
      birim_fiyat: toNum(u.birim_fiyat),
      iskonto_orani: toNum(u.iskonto_orani),
      kdv_orani: toNum(u.kdv_orani),
    }));

    try {
      setSaving(true);
      await axios.put(`/v1/siparisler/${temiz.id}`, temiz);
      setSiparisler((prev) => prev.map((s) => (s.id === temiz.id ? { ...s, ...temiz } : s)));
      closeEdit();
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      setSaving(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const durumBadgeClass = (invoiced: boolean) =>
    invoiced ? "bg-emerald-500 text-white ring-1 ring-emerald-600/40" : "bg-gray-400 text-white ring-1 ring-gray-500/40";

  if (loading) return <p className="text-sm text-gray-500">Siparişler yükleniyor...</p>;

  if (!siparisler?.length) {
    return <p className="text-sm text-gray-500">Bu müşteriye ait sipariş bulunamadı.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Kartlı sipariş listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {siparisler.map((siparis) => {
          const { araToplam, toplamIskonto, kdvGruplari, genelToplam } = hesaplaOzet(siparis.urunler || []);
          return (
            <div
              key={siparis.id}
              className="flex flex-col justify-between border p-4 rounded shadow bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-white/20"
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Sipariş #{siparis.id}</h2>
                  <p className="text-xs text-gray-400">{formatDate(siparis.tarih)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${durumBadgeClass(!!siparis.fatura_no)}`}
                    title={siparis.fatura_no ? `Fatura No: ${siparis.fatura_no}` : "Faturalandırılmadı"}
                  >
                    {siparis.fatura_no ? String(siparis.fatura_no) : "Beklemede"}
                  </span>
                  <button className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600" onClick={() => openEdit(siparis)}>
                    Düzenle
                  </button>
                  <button className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600">Sil</button>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                {(siparis.urunler || []).map((item, i) => {
                  const adet = toNum(item.adet);
                  const fiyat = toNum(item.birim_fiyat);
                  const isk = toNum(item.iskonto_orani);
                  const kdv = toNum(item.kdv_orani);
                  const indirimliBirimFiyat = fiyat * (1 - isk / 100);
                  const satirNetTutar = adet * indirimliBirimFiyat;

                  return (
                    <div key={i} className="border-b pb-1 dark:border-white/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate pr-2">{item.urun?.isim ?? "Ürün Bilgisi Yok"}</span>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {isk > 0 && <span className="line-through text-gray-400 dark:text-gray-500">{money(fiyat)}</span>}
                          <span className="font-semibold">{money(indirimliBirimFiyat)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 mt-0.5 gap-x-3 gap-y-1">
                        <span>
                          {adet} x {money(indirimliBirimFiyat)} ={" "}
                          <strong className="text-gray-600 dark:text-gray-300">{money(satirNetTutar)}</strong> (+ %{kdv} KDV)
                        </span>
                        {isk > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-semibold leading-4 whitespace-nowrap max-w-fit shadow-sm ring-1 ring-emerald-600/40 dark:bg-emerald-600 dark:ring-emerald-500/40">
                            <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
                              <path
                                fill="currentColor"
                                d="M10 14a1 1 0 0 1-.7-.3l-4-4a1 1 0 1 1 1.4-1.4L9 10.6V5a1 1 0 1 1 2 0v5.6l2.3-2.3a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 1-.7.3z"
                              />
                            </svg>
                            <span className="hidden sm:inline">İskonto:</span> {percent(isk)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-2 text-sm space-y-1 dark:border-white/50">
                <div className="flex justify-between">
                  <span>Ara Toplam (iskontosuz):</span>
                  <span>{money(araToplam)}</span>
                </div>
                <div className="flex justify-between">
                  <span>İskonto Toplamı:</span>
                  <span>-{money(toplamIskonto)}</span>
                </div>
                {Object.entries(kdvGruplari)
                  .sort(([a], [b]) => toNum(a) - toNum(b))
                  .map(([oran, tutar]) => (
                    <div key={oran} className="flex justify-between">
                      <span>KDV ({percent(oran)}):</span>
                      <span>{money(tutar)}</span>
                    </div>
                  ))}
                <div className="flex justify-between font-bold mt-2">
                  <span>Genel Toplam:</span>
                  <span>{money(genelToplam)}</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-400">
                {siparis.yetkili?.isim && <p>Yetkili: {siparis.yetkili.isim}</p>}
                {siparis.teslimat_adresi?.adres && <p className="truncate">Adres: {siparis.teslimat_adresi.adres}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination çubuğu */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Toplam <span className="font-semibold">{meta.total}</span> kayıt — {meta.from ?? 0}–{meta.to ?? 0} gösteriliyor. Sayfa{" "}
          {meta.current_page}/{meta.last_page}.
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">Sayfa boyutu</label>
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
          </select>

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={meta.current_page <= 1}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 dark:border-white/10 dark:text-gray-300"
          >
            Önceki
          </button>
          <button
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={meta.current_page >= meta.last_page}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 dark:border-white/10 dark:text-gray-300"
          >
            Sonraki
          </button>
        </div>
      </div>

      {/* Düzenleme Modali */}
      <Modal isOpen={editOpen} onClose={closeEdit} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold">{editing ? `Sipariş #${editing.id} Düzenle` : "Düzenle"}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Özet üzerinde değişiklik yapabilirsiniz.</p>
            </div>
            <button className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20" onClick={closeEdit} disabled={saving}></button>
          </div>

          {editing && (
            <div className="space-y-4">
              {/* Üst alanlar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {/* Tarih */}
                <div className="flex flex-col">
                  <label className="text-[11px] mb-0.5 text-gray-500 dark:text-gray-400">Tarih</label>
                  <input
                    type="date"
                    className="h-9 px-2 rounded border bg-white dark:bg-transparent dark:border-white/10"
                    value={editing.tarih ? new Date(editing.tarih).toISOString().slice(0, 10) : ""}
                    onChange={(e) => onFieldChange("tarih", e.target.value)}
                  />
                </div>

                {/* Fatura No */}
                <div className="flex flex-col">
                  <label className="text-[11px] mb-0.5 text-gray-500 dark:text-gray-400">Fatura No</label>
                  <input
                    type="text"
                    className="h-9 px-2 rounded border bg-white dark:bg-transparent dark:border-white/10"
                    value={String(editing.fatura_no ?? "")}
                    onChange={(e) => onFieldChange("fatura_no", e.target.value)}
                    placeholder="Boş ise beklemede"
                  />
                </div>

                {/* Yetkili (select) */}
                <div className="flex flex-col col-span-2 sm:col-span-1">
                  <label className="text-[11px] mb-0.5 text-gray-500 dark:text-gray-400">Yetkili</label>
                  <select
                    className="h-9 px-2 rounded border bg-white dark:bg-transparent dark:border-white/10"
                    value={String(editing.yetkili_id ?? "")}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      const val = valStr ? Number(valStr) : null;
                      onFieldChange("yetkili_id", val);
                      const y = yetkiliList.find((yy) => String(yy.id) === valStr);
                      onFieldChange("yetkili.isim", y?.isim ?? "");
                    }}
                  >
                    <option value="">⟶ Yetkili Seçin</option>
                    {yetkiliList.map((y) => (
                      <option key={y.id} value={String(y.id)}>
                        {[y.isim, y.pozisyon, y.telefon].filter(Boolean).join(" - ")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teslimat Adresi (select) */}
                <div className="flex flex-col col-span-2 sm:col-span-1">
                  <label className="text-[11px] mb-0.5 text-gray-500 dark:text-gray-400">Teslimat Adresi</label>
                  <select
                    className="h-9 px-2 rounded border bg-white dark:bg-transparent dark:border-white/10"
                    value={String(editing.teslimat_adresi_id ?? "")}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      const val = valStr ? Number(valStr) : null;
                      onFieldChange("teslimat_adresi_id", val);
                      const a = adresList.find((aa) => String(aa.id) === valStr);
                      onFieldChange("teslimat_adresi.adres", a?.adres ?? "");
                    }}
                  >
                    <option value="">⟶ Teslimat Adresi Seçin</option>
                    {adresList.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.label?.length > 80 ? a.label.slice(0, 80) + "…" : a.label || "—"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ürün satırları */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {(editing.urunler || []).map((item, i) => {
                  const adet = toNum(item.adet);
                  const fiyat = toNum(item.birim_fiyat);
                  const isk = toNum(item.iskonto_orani);
                  const kdv = toNum(item.kdv_orani);
                  const indirimliBirimFiyat = fiyat * (1 - isk / 100);
                  const satirNetTutar = adet * indirimliBirimFiyat;

                  return (
                    <div
                      key={i}
                      className="border rounded p-2 dark:border-white/20 bg-white/60 dark:bg-white/5"
                    >
                      {/* Ürün ismi */}
                      <div className="mb-2">
                        <span className="block text-sm font-medium truncate">
                          {item.urun?.isim ?? "Ürün"}
                        </span>
                      </div>

                      {/* Inputlar: ikili ikili mobilde, geniş ekranda 4lü */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 text-[11px] text-gray-500">Adet</span>
                          <input
                            type="number"
                            step="1"
                            className="flex-1 w-full min-w-0 px-2 py-1 rounded border bg-white dark:bg-transparent dark:border-white/10 text-sm"
                            value={String(item.adet ?? "")}
                            onChange={(e) => onFieldChange(`urunler.${i}.adet`, e.target.value)}
                          />
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 text-[11px] text-gray-500">Fiyat</span>
                          <input
                            type="number"
                            step="0.01"
                            className="flex-1 w-full min-w-0 px-2 py-1 rounded border bg-white dark:bg-transparent dark:border-white/10 text-sm"
                            value={String(item.birim_fiyat ?? "")}
                            onChange={(e) => onFieldChange(`urunler.${i}.birim_fiyat`, e.target.value)}
                          />
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 text-[11px] text-gray-500">İsk.%</span>
                          <input
                            type="number"
                            step="0.01"
                            className="flex-1 w-full min-w-0 px-2 py-1 rounded border bg-white dark:bg-transparent dark:border-white/10 text-sm"
                            value={String(item.iskonto_orani ?? "")}
                            onChange={(e) => onFieldChange(`urunler.${i}.iskonto_orani`, e.target.value)}
                          />
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 text-[11px] text-gray-500">KDV%</span>
                          <input
                            type="number"
                            step="0.01"
                            className="flex-1 w-full min-w-0 px-2 py-1 rounded border bg-white dark:bg-transparent dark:border-white/10 text-sm"
                            value={String(item.kdv_orani ?? "")}
                            onChange={(e) => onFieldChange(`urunler.${i}.kdv_orani`, e.target.value)}
                          />
                        </div>
                      </div>


                      {/* Fiyat / Özet: yan yana solda/sağda */}
                      <div className="mt-2 text-xs w-full flex flex-wrap items-center justify-between gap-2">
                        {/* Solda: Eski fiyat + indirimli fiyat */}
                        <div className="flex items-center gap-2 text-gray-500">
                          {isk > 0 && (
                            <span className="line-through text-gray-400 dark:text-gray-500">
                              {money(fiyat)}
                            </span>
                          )}
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {money(indirimliBirimFiyat)}
                          </span>
                        </div>

                        {/* Sağda: adet x fiyat = net (+KDV) */}
                        <div className="text-gray-500">
                          {adet} x {money(indirimliBirimFiyat)} ={" "}
                          <strong className="text-gray-700 dark:text-gray-200">
                            {money(satirNetTutar)}
                          </strong>{" "}
                          (+ %{kdv} KDV)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Canlı özet */}
              {(() => {
                const { araToplam, toplamIskonto, kdvGruplari, genelToplam } = hesaplaOzet(editing.urunler || []);
                return (
                  <div className="border-t pt-2 text-sm space-y-1 dark:border-white/20">
                    <div className="flex justify-between">
                      <span>Ara Toplam (iskontosuz):</span>
                      <span>{money(araToplam)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>İskonto Toplamı:</span>
                      <span>-{money(toplamIskonto)}</span>
                    </div>
                    {Object.entries(kdvGruplari)
                      .sort(([a], [b]) => toNum(a) - toNum(b))
                      .map(([oran, tutar]) => (
                        <div key={oran} className="flex justify-between">
                          <span>KDV ({percent(oran)}):</span>
                          <span>{money(tutar)}</span>
                        </div>
                      ))}
                    <div className="flex justify-between font-bold mt-2">
                      <span>Genel Toplam:</span>
                      <span>{money(genelToplam)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Aksiyonlar */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button className="px-3 py-1.5 rounded border text-sm dark:border-white/10" onClick={closeEdit} disabled={saving}>
                  Vazgeç
                </button>
                <button className="px-3 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" onClick={saveEdit} disabled={saving}>
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}