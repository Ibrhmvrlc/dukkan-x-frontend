import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import Button from "../../components/ui/button/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import classNames from "classnames";
import { toast } from "react-toastify";

type GuncellemeHedefi = "satis" | "tedarik" | "ikisi";

/* ---------- TR sayısal/para yardımcıları ---------- */
const toNum = (val: any): number => {
  if (val === null || val === undefined || val === "") return NaN;
  if (typeof val === "number") return val;
  let s = String(val).trim().replace(/[^\d,.\-]/g, "");
  const hasComma = s.includes(","), hasDot = s.includes(".");
  if (hasComma && hasDot) s = s.replace(/\./g, "").replace(",", ".");
  else if (hasComma && !hasDot) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};
const trNumber = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatTRY = (val: any) => {
  const n = toNum(val);
  return Number.isFinite(n) ? trNumber.format(n) : "0,00";
};
const parseTRY = (str: string): number => toNum(str);

/* ---------------- BİLEŞEN ---------------- */
export default function FiyatGuncellemeSayfasi() {
  const navigate = useNavigate();

  // Güvenlik
 // const [userRoles, setUserRoles] = useState<string[]>([]);
  const [canAccess, setCanAccess] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [unlocked, setUnlocked] = useState<boolean>(false);

  const ALLOWED_ROLES = ["admin", "yönetici", "yonetici", "müdür", "mudur", "owner"];
  const REDIRECT_PATH = "/"; // şifre girmezse gideceği sayfa (dilediğin rota)

  // Sayfa state
  const [activeTab, setActiveTab] = useState("toplu");
  const [aktifMarkaSekmesi, setAktifMarkaSekmesi] = useState<string>("Tüm Ürünler");
  const [secilenMarkalar, setSecilenMarkalar] = useState<string[]>([]);
  const [oran, setOran] = useState<number>(0);
  const [hedef, setHedef] = useState<GuncellemeHedefi>("satis");
  const [urunler, setUrunler] = useState<any[]>([]);
  const [guncellenenSatisFiyatlari, setGuncellenenSatisFiyatlari] = useState<Record<number, string>>({});
  const [guncellenenTedarikFiyatlari, setGuncellenenTedarikFiyatlari] = useState<Record<number, string>>({});

  /* 1) Rolü çek – her mount'ta parola tekrar istenecek (cache yok) */
  useEffect(() => {
    (async () => {
      try {
        const me = await axios.get("/me");
        const roles: string[] = me.data?.roles ?? [];
        
        setCanAccess(roles.some((r) => ALLOWED_ROLES.includes((r || "").toLowerCase())));
      } catch {
        setCanAccess(false);
      }
    })();
  }, []);

  /* 2) Ürünleri sadece kilit açıldıktan sonra çek */
  useEffect(() => {
    if (!unlocked || !canAccess) return;
    axios
      .get("/v1/urunler")
      .then((res) => {
        const gelen = res.data?.data;
        if (Array.isArray(gelen)) {
          const normalized = gelen.map((u: any) => ({
            ...u,
            tedarik_fiyati: toNum(u.tedarik_fiyati),
            satis_fiyati: toNum(u.satis_fiyati),
          }));
          setUrunler(normalized);
        } else {
          console.error("❌ /v1/urunler beklenen formatta değil:", res.data);
          setUrunler([]);
        }
      })
      .catch((err) => {
        console.error("❌ API isteği başarısız oldu:", err);
        setUrunler([]);
      });
  }, [unlocked, canAccess]);

  /* 3) Parola doğrulama – her gelişte zorunlu */
  const handleUnlock = async () => {
    try {
      if (!password.trim()) return toast.error("Lütfen parolanızı girin.");
      await axios.post("/v1/reauth", { password });
      setUnlocked(true);
      setPassword("");
      toast.success("Doğrulandı.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Parola doğrulanamadı.");
    }
  };

  /* Toplu güncelleme */
  const handleTopluGuncelle = () => {
    axios
      .post("/v1/urunler/toplu-guncelle", { oran, markalar: secilenMarkalar, hedef })
      .then(() => {
        const factor = 1 + oran / 100;
        setUrunler((prev) =>
          prev.map((u) => {
            const etkilenir = secilenMarkalar.length === 0 || secilenMarkalar.includes(u.marka);
            if (!etkilenir) return u;
            const next = { ...u };
            if (hedef === "satis" || hedef === "ikisi") next.satis_fiyati = +(toNum(next.satis_fiyati) * factor).toFixed(2);
            if (hedef === "tedarik" || hedef === "ikisi") next.tedarik_fiyati = +(toNum(next.tedarik_fiyati) * factor).toFixed(2);
            return next;
          })
        );
        toast.success("Toplu güncelleme yapıldı");
      })
      .catch((err) => {
        console.error("Toplu güncelleme hatası:", err);
        toast.error("Toplu güncelleme başarısız oldu.");
      });
  };

  /* Tekil güncelleme */
  const handleTekilGuncelle = (urunId: number) => {
    const payload: Record<string, number> = {};
    const satisStr = guncellenenSatisFiyatlari[urunId];
    const tedarikStr = guncellenenTedarikFiyatlari[urunId];
    const yeniSatis = parseTRY(satisStr);
    const yeniTedarik = parseTRY(tedarikStr);
    if (Number.isFinite(yeniSatis)) payload.satis_fiyati = Number(yeniSatis.toFixed(2));
    if (Number.isFinite(yeniTedarik)) payload.tedarik_fiyati = Number(yeniTedarik.toFixed(2));
    if (Object.keys(payload).length === 0) return toast.error("En az bir alan doldurun (Satış/Tedarik).");

    axios
      .put(`/v1/urunler/${urunId}/fiyat`, payload)
      .then(() => {
        setUrunler((prev) => prev.map((u) => (u.id === urunId ? { ...u, ...payload } : u)));
        setGuncellenenSatisFiyatlari((prev) => {
          const c = { ...prev };
          delete c[urunId];
          return c;
        });
        setGuncellenenTedarikFiyatlari((prev) => {
          const c = { ...prev };
          delete c[urunId];
          return c;
        });
        toast.success("Güncelleme başarılı!");
      })
      .catch((err) => {
        console.error("Tekil güncelleme hatası:", err?.response?.status, err?.response?.data || err?.message);
        toast.error(err?.response?.data?.message || "Güncelleme başarısız oldu.");
      });
  };

  const uniqueMarkalar = Array.from(new Set(urunler.map((u) => u.marka).filter((m) => m && m.trim() !== "")));
  const sekmeler = ["Tüm Ürünler", ...uniqueMarkalar, "Diğer"];
  const filtrelenmisUrunler = urunler.filter((u) => {
    if (aktifMarkaSekmesi === "Tüm Ürünler") return true;
    if (aktifMarkaSekmesi === "Diğer") return !u.marka || u.marka.trim() === "";
    return u.marka === aktifMarkaSekmesi;
  });

  /* --------- RENDER KİLİTLER --------- */

  // Rol yetkisi yoksa: 403 (içerik asla görünmez)
  if (!canAccess) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
        <h2 className="text-lg font-semibold mb-2 text-red-800">Erişim Engellendi (403)</h2>
        <p className="text-sm text-gray-600 dark:text-white/80">Bu sayfayı görüntüleme yetkiniz bulunmuyor.</p>
      </div>
    );
  }

  // Şifre zorunlu: unlocked false ise içerik ASLA render edilmez
  if (!unlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-3 dark:text-white">Ek Doğrulama</h2>
          <p className="text-sm text-gray-600 dark:text-white/80 mb-4">
            Güvenlik amacıyla lütfen oturum açarken kullandığınız parolayı girin.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parolanız"
            className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-white/10 mb-3"
          />

          <div className="flex items-center justify-between gap-2">
            {/* Şifre yoksa tek seçenek: başka sayfaya git */}
            <Button variant="outline" onClick={() => navigate(REDIRECT_PATH)}>
              Anasayfaya Dön
            </Button>
            <Button onClick={handleUnlock}>Doğrula</Button>
          </div>
        </div>
      </div>
    );
  }

  /* --------- İÇERİK (kilit açık) --------- */
  return (
    <div className="space-y-6 max-w-full overflow-x-auto">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Fiyat Güncelleme Modülü</h1>
        {/* Tekrar kilitle: içerik gizlenir, modal geri gelir (her gelişte şifre şart) */}
        <button
          onClick={() => setUnlocked(false)}
          className="ml-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-white/10 dark:text-white"
          title="Tekrar kilitle"
        >
          🔒 Kilitle
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          <TabsTrigger value="toplu" className="w-full px-4 py-3 text-center border border-gray-300 dark:border-white/10 text-sm font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:text-white/90 ">
            Toplu Fiyat Güncelleme
          </TabsTrigger>
          <TabsTrigger value="tekil" className="w-full px-4 py-3 text-center border border-gray-300 dark:border-white/10 text-sm font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:text-white/90">
            Tekil Fiyat Güncelleme
          </TabsTrigger>
        </TabsList>

        {/* TOPLU */}
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

            {/* Hedef Alan Seçimi */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Güncellenecek alan(lar):</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: "satis", label: "Sadece Satış Fiyatı" },
                  { key: "tedarik", label: "Sadece Tedarik Fiyatı" },
                  { key: "ikisi", label: "Her İkisi" },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="hedef-alan"
                      value={opt.key}
                      checked={hedef === (opt.key as GuncellemeHedefi)}
                      onChange={() => setHedef(opt.key as GuncellemeHedefi)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring focus:ring-blue-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Marka seçimi:</p>

              {/* checkbox grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {uniqueMarkalar.map((marka) => (
                  <label
                    key={marka}
                    className={classNames(
                      "flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer transition",
                      secilenMarkalar.includes(marka)
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                        : "border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white/80"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={secilenMarkalar.includes(marka)}
                      onChange={(e) => {
                        if (e.target.checked) setSecilenMarkalar([...secilenMarkalar, marka]);
                        else setSecilenMarkalar(secilenMarkalar.filter((m) => m !== marka));
                      }}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-sm truncate">{marka}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleTopluGuncelle}>Toplu Güncelle</Button>
          </div>
        </TabsContent>

        {/* TEKİL */}
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
                      <th className="px-3 py-2 whitespace-nowrap">Satış Fiyatı</th>
                      <th className="px-3 py-2 whitespace-nowrap">Yeni Tedarik</th>
                      <th className="px-3 py-2 whitespace-nowrap">Yeni Satış</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrelenmisUrunler.map((u) => (
                      <tr key={u.id} className="border-t border-gray-200 rounded-2xl dark:border-white/10">
                        <td className="px-3 py-2 whitespace-nowrap">{u.isim}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">₺{formatTRY(u.tedarik_fiyati)}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">₺{formatTRY(u.satis_fiyati)}</td>

                        {/* Yeni Tedarik */}
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={guncellenenTedarikFiyatlari[u.id] ?? ""}
                            onChange={(e) =>
                              setGuncellenenTedarikFiyatlari({ ...guncellenenTedarikFiyatlari, [u.id]: e.target.value })
                            }
                            placeholder="₺0,00"
                            className="border rounded px-2 py-1 text-sm w-28 text-center bg-white dark:bg-white/[0.05] text-black dark:text-white border-gray-300 dark:border-white/10"
                          />
                        </td>

                        {/* Yeni Satış */}
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={guncellenenSatisFiyatlari[u.id] ?? ""}
                            onChange={(e) =>
                              setGuncellenenSatisFiyatlari({ ...guncellenenSatisFiyatlari, [u.id]: e.target.value })
                            }
                            placeholder="₺0,00"
                            className="border rounded px-2 py-1 text-sm w-28 text-center bg-white dark:bg-white/[0.05] text-black dark:text-white border-gray-300 dark:border-white/10"
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