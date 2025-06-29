import { useEffect, useState } from "react";
import axios from "../../api/axios";

interface SiparisListesiProps {
  musteriId: number;
}

export default function SiparisListesi({ musteriId }: SiparisListesiProps) {
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/v1/musteriler/${musteriId}/siparisler`)
      .then((res) => {
        setSiparisler(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Siparişler alınamadı:", err);
        setLoading(false);
      });
  }, [musteriId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Siparişler yükleniyor...</p>;
  }

  if (siparisler.length === 0) {
    return <p className="text-sm text-gray-500">Bu müşteriye ait sipariş bulunamadı.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {siparisler.map((siparis) => {
            const toplamTutar = siparis.urunler.reduce(
            (acc: number, item: any) => acc + item.adet * item.birim_fiyat,
            0
            );
            const kdvOrani = 10;
            const iskontoOrani = 0;
            const kdvTutari = toplamTutar * (kdvOrani / 100);
            const iskontoTutari = toplamTutar * (iskontoOrani / 100);
            const genelToplam = toplamTutar + kdvTutari - iskontoTutari;

            return (
                <div
                  key={siparis.id}
                  className="flex flex-col justify-between border p-4 rounded shadow bg-white dark:bg-gray-900 dark:text-gray-100
                            max-h-none overflow-visible sm:max-h-[400px] sm:overflow-y-auto"
                            style={{ scrollbarWidth: "thin", scrollbarColor: "#888 #f1f1f1" }}
                >
                <div className="mb-2">
                    <h2 className="text-lg font-semibold">Sipariş #{siparis.id}</h2>
                    <p className="text-xs text-gray-400">{siparis.tarih?.split("T")[0]}</p>
                </div>

                <div className="space-y-2 mt-2">
                {siparis.urunler.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm border-b pb-1">
                    <span>{item.urun?.isim ?? "Ürün Bilgisi Yok"}</span>
                    <span>
                        {item.adet} x {item.birim_fiyat} ₺ ={" "}
                        <strong>{(item.adet * item.birim_fiyat).toFixed(2)} ₺</strong>
                    </span>
                    </div>
                ))}

                <div className="border-t pt-2 text-sm">
                    <div className="flex justify-between"><span>Ara Toplam:</span><span>{toplamTutar.toFixed(2)} ₺</span></div>
                    <div className="flex justify-between"><span>KDV ({kdvOrani}%):</span><span>{kdvTutari.toFixed(2)} ₺</span></div>
                    <div className="flex justify-between"><span>İskonto:</span><span>{iskontoTutari.toFixed(2)} ₺</span></div>
                    <div className="flex justify-between font-bold mt-2"><span>Genel Toplam:</span><span>{genelToplam.toFixed(2)} ₺</span></div>
                </div>
                </div>

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
