import { useState, useEffect } from "react";
import axios from "../../api/axios";
import Button from "../../components/ui/button/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import classNames from "classnames";

export default function FiyatGuncellemeSayfasi() {
  const [activeTab, setActiveTab] = useState("toplu");
  const [aktifMarkaSekmesi, setAktifMarkaSekmesi] = useState<string>("Tüm Ürünler");
  const [secilenMarkalar, setSecilenMarkalar] = useState<string[]>([]);
  const [oran, setOran] = useState<number>(0);
  const [urunler, setUrunler] = useState<any[]>([]);
  const [guncellenenFiyatlar, setGuncellenenFiyatlar] = useState<Record<number, number>>({});

  useEffect(() => {
    axios.get("/v1/urunler").then((res) => {
      const gelen = res.data?.data;
      if (Array.isArray(gelen)) {
        setUrunler(gelen);
      } else {
        console.error("❌ Uyarı: /v1/urunler endpointinden beklenen dizi formatında veri gelmedi:", res.data);
        setUrunler([]);
      }
    }).catch((err) => {
      console.error("❌ API isteği başarısız oldu:", err);
      setUrunler([]);
    });
  }, []);

  const uniqueMarkalar = Array.from(new Set(urunler.map((u) => u.marka).filter((m) => m && m.trim() !== "")));
  const sekmeler = ["Tüm Ürünler", ...uniqueMarkalar, "Diğer"];

  const handleTopluGuncelle = () => {
    axios.post("/v1/urunler/toplu-guncelle", {
      oran,
      markalar: secilenMarkalar
    }).then(() => alert("Toplu güncelleme yapıldı"));
  };

  const handleTekilGuncelle = (urunId: number) => {
    const yeniFiyat = guncellenenFiyatlar[urunId];
    axios.put(`/v1/urunler/${urunId}/fiyat`, { fiyat: yeniFiyat }).then(() => alert("Fiyat güncellendi"));
  };

  const filtrelenmisUrunler = urunler.filter((u) => {
    if (aktifMarkaSekmesi === "Tüm Ürünler") return true;
    if (aktifMarkaSekmesi === "Diğer") return !u.marka || u.marka.trim() === "";
    return u.marka === aktifMarkaSekmesi;
  });

  return (
    <div className="space-y-6 max-w-full overflow-x-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Fiyat Güncelleme Modülü</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          <TabsTrigger
            value="toplu"
            className="w-full px-4 py-3 text-center border border-gray-300 dark:border-white/10 text-sm font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:text-white/90 "
          >
            Toplu Fiyat Güncelleme
          </TabsTrigger>
          <TabsTrigger
            value="tekil"
            className="w-full px-4 py-3 text-center border border-gray-300 dark:border-white/10 text-sm font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:text-white/90"
          >
            Tekil Fiyat Güncelleme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="toplu" className="overflow-x-auto p-1 md:p-2 border border-gray-200 rounded-2xl dark:border-white/10 shadow-sm dark:text-white/90 ">
          <div className={classNames("space-y-4 p-4", { "opacity-30 pointer-events-none": activeTab !== "toplu" })}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Yüzde oranı girin (%): </label>
              <input
                type="number"
                value={oran}
                onChange={(e) => setOran(Number(e.target.value))}
                className="w-full sm:w-64 border rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 text-black dark:text-white border-gray-300 dark:border-white/10 focus:outline-none focus:ring focus:ring-blue-500/50"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Marka seçimi:</p>
              <div className="flex flex-wrap gap-2">
                {uniqueMarkalar.map((marka) => (
                  <label key={marka} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={secilenMarkalar.includes(marka)}
                      onChange={(e) => {
                        const val = e.target.checked;
                        if (val) setSecilenMarkalar([...secilenMarkalar, marka]);
                        else setSecilenMarkalar(secilenMarkalar.filter((m) => m !== marka));
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring focus:ring-blue-500"
                    />
                    <span className="text-sm">{marka}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleTopluGuncelle}>Toplu Güncelle</Button>
          </div>
        </TabsContent>

        <TabsContent value="tekil" className="overflow-x-auto p-1 md:p-2 border border-gray-200 rounded-2xl dark:border-white/10 shadow-sm dark:text-white/90 ">
          <div className={classNames("space-y-6 p-4", { "opacity-30 pointer-events-none": activeTab !== "tekil" })}>
            <div className="flex flex-wrap gap-2 border-b border-gray-300 dark:border-white/10 pb-2">
              {sekmeler.map((marka) => (
                <button
                  key={marka}
                  onClick={() => setAktifMarkaSekmesi(marka)}
                  className={classNames(
                    "px-4 py-2 text-sm font-medium rounded-md",
                    aktifMarkaSekmesi === marka
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-white/[0.05] text-gray-700 dark:text-white/80"
                  )}
                >
                  {marka}
                </button>
              ))}
            </div>

            <div className="space-y-2 overflow-x-auto">
              <h2 className="text-md font-semibold pb-1">{aktifMarkaSekmesi}</h2>
              <div className="w-full overflow-auto">
                <table className="min-w-full table-auto text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-white/[0.03]">
                      <th className="px-3 py-2 text-left whitespace-nowrap">Ürün</th>
                      <th className="px-3 py-2 whitespace-nowrap">Tedarik Fiyatı</th>
                      <th className="px-3 py-2 whitespace-nowrap">Mevcut Fiyat</th>
                      <th className="px-3 py-2 whitespace-nowrap">Yeni Fiyat</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrelenmisUrunler.map((u) => (
                      <tr key={u.id} className="border-t border-gray-200 rounded-2xl dark:border-white/10">
                        <td className="px-3 py-2 whitespace-nowrap">{u.isim}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">₺{u.tedarik_fiyati}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">₺{u.satis_fiyati}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <input
                            type="number"
                            value={guncellenenFiyatlar[u.id] || ""}
                            onChange={(e) =>
                              setGuncellenenFiyatlar({
                                ...guncellenenFiyatlar,
                                [u.id]: Number(e.target.value),
                              })
                            }
                            className="border rounded px-2 py-1 text-sm w-24 text-center bg-white dark:bg-white/[0.05] text-black dark:text-white border-gray-300 dark:border-white/10"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Button onClick={() => handleTekilGuncelle(u.id)} size="sm">Güncelle</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}