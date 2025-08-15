import { useEffect, useState } from "react";
import axios from "../../api/axios";

interface SiparisListesiProps {
  musteriId: number;
}

type UrunKalem = {
  adet: number | string | null;
  birim_fiyat: number | string | null;
  iskonto_orani?: number | string | null; // pivot
  kdv_orani: number | string | null;      // pivot
  urun?: { isim?: string | null };
};

type Siparis = {
  id: number;
  tarih?: string | null;
  yetkili?: { isim?: string | null };
  teslimat_adresi?: { adres?: string | null };
  urunler: UrunKalem[];
};

// Güvenli sayı dönüştürücü
const toNum = (v: unknown): number => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/\s/g, ""));
  return isNaN(n) ? 0 : n;
};

// Para formatlayıcı (TR)
const money = (n: unknown) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(toNum(n)) + " ₺";

export default function SiparisListesi({ musteriId }: SiparisListesiProps) {
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`/v1/musteriler/${musteriId}/siparisler`)
      .then((res) => {
        if (!mounted) return;
        setSiparisler(res.data?.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Siparişler alınamadı:", err?.response?.data ?? err);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [musteriId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Siparişler yükleniyor...</p>;
  }

  if (!siparisler?.length) {
    return <p className="text-sm text-gray-500">Bu müşteriye ait sipariş bulunamadı.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {siparisler.map((siparis) => {
        // Hesaplamalar (güvenli dönüşümlerle)
        let araToplam = 0;     // iskonto öncesi
        let netToplam = 0;     // iskonto sonrası (KDV hariç)
        let toplamIskonto = 0; // opsiyonel gösterim
        const kdvGruplari: Record<string, number> = {}; // "1" -> KDV toplamı, "10" -> KDV toplamı, ...

        (siparis.urunler || []).forEach((item) => {
          const adet = toNum(item.adet);
          const fiyat = toNum(item.birim_fiyat);
          const isk = toNum(item.iskonto_orani); // yüzde
          const kdv = toNum(item.kdv_orani);     // yüzde

          const brut = adet * fiyat;
          const net = brut * (1 - isk / 100);     // KDV matrahı
          const kdvTutar = net * (kdv / 100);

          araToplam += brut;
          netToplam += net;
          toplamIskonto += brut - net;

          const key = String(kdv);
          kdvGruplari[key] = (kdvGruplari[key] ?? 0) + kdvTutar;
        });

        const toplamKdv = Object.values(kdvGruplari).reduce((a, b) => a + b, 0);
        const genelToplam = netToplam + toplamKdv;

        return (
          <div
            key={siparis.id}
            className="flex flex-col justify-between border p-4 rounded shadow bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-white/20
                       max-h-none overflow-visible sm:max-h-[400px] sm:overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#888 #f1f1f1" }}
          >
            {/* Başlık */}
            <div className="mb-2">
              <h2 className="text-lg font-semibold">Sipariş #{siparis.id}</h2>
              <p className="text-xs text-gray-400">
                {siparis.tarih ? String(siparis.tarih).split("T")[0] : ""}
              </p>
            </div>

            {/* Ürünler */}
            <div className="space-y-2 mt-2">
              {(siparis.urunler || []).map((item, i) => {
                const adet = toNum(item.adet);
                const fiyat = toNum(item.birim_fiyat);
                const satirTutar = adet * fiyat;
                const isk = toNum(item.iskonto_orani);
                const kdv = toNum(item.kdv_orani);

                return (
                  <div key={i} className="border-b pb-1 dark:border-white/50">
                    <div className="flex justify-between text-sm">
                      <span>{item.urun?.isim ?? "Ürün Bilgisi Yok"}</span>
                      <span>
                        {adet} x {money(fiyat)} = <strong>{money(satirTutar)}</strong>
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                      <span>İskonto: %{isk.toFixed(2)}</span>
                      <span>KDV: %{kdv.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}

              {/* Özet */}
              <div className="border-t pt-2 text-sm space-y-1 dark:border-white/50">
                <div className="flex justify-between">
                  <span>Ara Toplam (iskontosuz):</span>
                  <span>{money(araToplam)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net Toplam (iskontolu, KDV hariç):</span>
                  <span>{money(netToplam)}</span>
                </div>

                {/* KDV oranlarına göre ayrıştırılmış toplamlar */}
                {Object.entries(kdvGruplari)
                  .sort(([a], [b]) => toNum(a) - toNum(b))
                  .map(([oran, tutar]) => (
                    <div key={oran} className="flex justify-between">
                      <span>KDV (%{oran}):</span>
                      <span>{money(tutar)}</span>
                    </div>
                  ))}

                {/* İstersen toplam iskonto satırını aç */}
                {/* <div className="flex justify-between">
                  <span>Toplam İskonto:</span>
                  <span>-{money(toplamIskonto)}</span>
                </div> */}

                <div className="flex justify-between font-bold mt-2">
                  <span>Genel Toplam:</span>
                  <span>{money(genelToplam)}</span>
                </div>
              </div>
            </div>

            {/* Alt bilgi */}
            <div className="mt-4 text-xs text-gray-400">
              {siparis.yetkili?.isim && <p>Yetkili: {siparis.yetkili.isim}</p>}
              {siparis.teslimat_adresi?.adres && (
                <p className="truncate">Adres: {siparis.teslimat_adresi.adres}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}