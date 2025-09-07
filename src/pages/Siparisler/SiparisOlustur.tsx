// SiparisOlustur.tsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Button from '../../components/ui/button/Button';
import { toast } from 'react-toastify';

type Urun = {
  id: number;
  isim: string;
  cesit?: string | null;
  stok_miktari?: number | string | null;
  satis_fiyati: number | string;
  kdv_orani?: number | string | null; // ÜRÜN TABLOSUNDAN
};

type SepetItem = {
  urun_id: number;
  miktar: number;
  fiyat: number;       // birim fiyat (ürünün temel satış fiyatı)
  kdv_orani: number;   // sadece önizleme için (backend yine üründen alıyor)
  iskonto?: number;    // item bazlı override (yoksa müşteri iskontosu kullanılır)
};

// güvenli sayı dönüştürücü
const toNum = (v: unknown): number => {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/\s/g, ''));
  return isNaN(n) ? 0 : n;
};

// para formatlayıcı
const money = (n: unknown) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(toNum(n)) + ' ₺';

export default function SiparisOlustur() {
  const { musteriId } = useParams();
  const musteriNumericId = useMemo(() => toNum(musteriId), [musteriId]);
  const navigate = useNavigate();

  const [musteri, setMusteri] = useState<any>(null);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [search, setSearch] = useState('');
  const [miktarlar, setMiktarlar] = useState<Record<number, number>>({});
  const [sepet, setSepet] = useState<SepetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [not, setNot] = useState('');
  const [teslimatAdresiId, setTeslimatAdresiId] = useState<number | null>(null);
  const [teslimatAdresleri, setTeslimatAdresleri] = useState<any[]>([]);
  const [yetkiliId, setYetkiliId] = useState<number | null>(null);
  const [yetkililer, setYetkililer] = useState<any[]>([]);

  // Müşteri iskonto oranı (0–100 clamp)
  const musteriIskonto = useMemo(
    () => Math.min(Math.max(toNum(musteri?.iskonto_orani), 0), 100),
    [musteri]
  );

  useEffect(() => {
    let mounted = true;
    axios
      .get(`/v1/siparisler/create/${musteriNumericId}`)
      .then(res => {
        if (!mounted) return;
        setMusteri(res.data.musteri);
        setUrunler(res.data.urunler || []);
        setTeslimatAdresleri(res.data.teslimat_adresleri || []);
        setYetkililer(res.data.yetkililer || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err?.response?.data ?? err);
        setLoading(false);
        toast.error('Veriler alınamadı.');
      });
    return () => { mounted = false; };
  }, [musteriNumericId]);

  const handleMiktarDegistir = (urunId: number, fark: number) => {
    setMiktarlar(prev => {
      const yeniDeger = (prev[urunId] || 1) + fark;
      return { ...prev, [urunId]: Math.max(yeniDeger, 1) };
    });
  };

  const handleSepeteEkle = (urunId: number) => {
    const urun = urunler.find(u => u.id === urunId);
    if (!urun) return;
    const miktar = miktarlar[urunId] || 1;
    const fiyat = toNum(urun.satis_fiyati);     // temel fiyat; iskonto satır hesabında uygulanacak
    const kdvOran = toNum(urun.kdv_orani);      // ürün KDV oranı (önizleme)

    setSepet(prev => {
      const mevcut = prev.find(it => it.urun_id === urunId);
      if (mevcut) {
        return prev.map(it =>
          it.urun_id === urunId ? { ...it, miktar: it.miktar + miktar, fiyat, kdv_orani: kdvOran } : it
        );
      }
      return [...prev, { urun_id: urunId, miktar, fiyat, kdv_orani: kdvOran }];
    });
  };

  const updateSepetMiktar = (urunId: number, fark: number) => {
    setSepet(prev =>
      prev.map(item =>
        item.urun_id === urunId ? { ...item, miktar: Math.max(item.miktar + fark, 1) } : item
      )
    );
  };

  const removeFromSepet = (urunId: number) => {
    setSepet(prev => prev.filter(item => item.urun_id !== urunId));
  };

  // (opsiyonel) satır bazlı iskonto override inputu
  const changeItemIskonto = (urunId: number, val: string) => {
    const n = Math.min(Math.max(toNum(val), 0), 100);
    setSepet(prev =>
      prev.map(it => (it.urun_id === urunId ? { ...it, iskonto: n } : it))
    );
  };

  // Siparişi gönder
  const handleSubmit = async () => {
    if (!yetkiliId || !teslimatAdresiId) {
      toast.error('Lütfen yetkili ve teslimat adresi seçin.', { position: 'top-right' });
      return;
    }
    if (sepet.length === 0) {
      toast.error('Sepet boş.', { position: 'top-right' });
      return;
    }

    try {
      const payload = {
        musteri_id: musteriNumericId,
        urunler: sepet.map(item => ({
          urun_id: item.urun_id,
          miktar: item.miktar,
          fiyat: item.fiyat,
          // Backend bu alanı destekliyorsa açabilirsin:
          // iskonto: item.iskonto != null ? item.iskonto : musteriIskonto,
          // kdv: item.kdv_orani,
        })),
        yetkili_id: yetkiliId,
        not,
        teslimat_adresi_id: teslimatAdresiId,
        // Backend genel iskonto alanı destekliyorsa:
        // genel_iskonto_orani: musteriIskonto,
      };

      const res = await axios.post('/v1/siparisler', payload);
      toast.success('Sipariş başarıyla oluşturuldu!', { position: 'top-right' });

      const yeniId = res?.data?.data;
      if (yeniId) {
        navigate(`/siparisler/${yeniId}?created=1`);
      } else {
        navigate(`/musteriler/${musteriNumericId}/siparisler`);
      }
    } catch (error: any) {
      console.error("Sipariş oluşturulamadı:", error);
      const status = error?.response?.status;

      if (status === 422) {
        const validationErrors = error.response.data.errors;
        const firstKey = Object.keys(validationErrors)[0];
        const firstError = validationErrors[firstKey]?.[0] ?? 'Doğrulama hatası.';
        toast.error(`Doğrulama Hatası: ${firstError}`, { position: 'top-right' });
      } else if (status === 500) {
        toast.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.', { position: 'top-right' });
      } else if (error.request) {
        toast.error('Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.', { position: 'top-right' });
      } else {
        toast.error(`Beklenmeyen Hata: ${error.message}`, { position: 'top-right' });
      }
    }
  };

  const filteredUrunler = useMemo(() => {
    const q = (search || '').toLowerCase();
    return (urunler || []).filter(u => (u.isim || '').toLowerCase().includes(q));
  }, [urunler, search]);

  // Sepet toplamları (KDV oranlarına göre ayrışık) — müşteri iskontosu fallback
  const { araToplam, netToplam, kdvGruplari, toplamKdv, genelToplam } = useMemo(() => {
    let ara = 0;
    let net = 0;
    const gruplar: Record<string, number> = {};

    sepet.forEach(item => {
      const adet = toNum(item.miktar);
      const fiyat = toNum(item.fiyat);
      const brut = adet * fiyat;

      // Etkin iskonto: satırda varsa onu, yoksa müşteri iskontosunu kullan
      const satirIskonto = item.iskonto != null ? toNum(item.iskonto) : musteriIskonto;
      const netSatir = brut * (1 - satirIskonto / 100);

      const kdv = toNum(item.kdv_orani);
      const kdvTutar = netSatir * (kdv / 100);

      ara += brut;
      net += netSatir;

      const key = String(kdv);
      gruplar[key] = (gruplar[key] ?? 0) + kdvTutar;
    });

    const toplamKdvLocal = Object.values(gruplar).reduce((a, b) => a + b, 0);
    const genel = net + toplamKdvLocal;

    return { araToplam: ara, netToplam: net, kdvGruplari: gruplar, toplamKdv: toplamKdvLocal, genelToplam: genel };
  }, [sepet, musteriIskonto]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <p className="text-gray-600 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
      <div className="lg:col-span-2 space-y-4 dark:text-gray-100">
        <div className="sticky top-9 bg-white dark:bg-gray-900 z-10 rounded shadow">
          <h1 className="text-lg font-bold pt-2 pl-2">Sipariş Oluştur</h1>
          <small className='pt-2 pl-2'>
            {musteri?.unvan}
            {musteriIskonto > 0 && (
              <span className="ml-2 text-emerald-600 font-semibold">Müşteri İskontosu: %{musteriIskonto}</span>
            )}
          </small>
          <input
            type="text"
            placeholder="Ürün ara..."
            className="w-full mt-2 p-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUrunler.map(urun => {
            const base = toNum(urun.satis_fiyati);
            const indirimli = base * (1 - musteriIskonto / 100);
            return (
              <div key={urun.id} className="border p-4 rounded shadow bg-white dark:bg-gray-800 dark:border-gray-500">
                <p className="font-semibold truncate" title={urun.isim}>{urun.isim}</p>
                <p className="text-sm text-gray-500">{urun.cesit}</p>

                <p className="text-green-600 font-bold">
                  {musteriIskonto > 0 ? (
                    <>
                      <span className="line-through mr-2 text-gray-500">{money(base)}</span>
                      <span>{money(indirimli)}</span>
                      <span className="ml-2 text-xs text-emerald-600">(-%{musteriIskonto})</span>
                    </>
                  ) : (
                    money(base)
                  )}
                </p>

                <p className="text-xs text-gray-500">Stok: {toNum(urun.stok_miktari)}</p>
                <p className="text-xs text-gray-500">KDV: %{toNum(urun.kdv_orani).toFixed(2)}</p>

                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => handleMiktarDegistir(urun.id, -1)} className="px-2 py-1 bg-gray-300 rounded dark:text-gray-800">−</button>
                  <span>{miktarlar[urun.id] || 1}</span>
                  <button onClick={() => handleMiktarDegistir(urun.id, 1)} className="px-2 py-1 bg-gray-300 rounded dark:text-gray-800">+</button>
                </div>
                <Button onClick={() => handleSepeteEkle(urun.id)} className="mt-3 w-full">Sepete Ekle</Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky top-19 h-fit bg-white dark:bg-gray-900 p-4 border rounded shadow dark:text-gray-100 dark:border-gray-500">
        <small>{musteri?.unvan}</small>
        <h2 className="text-lg font-semibold mb-4">Sepet</h2>

        {sepet.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz ürün seçilmedi.</p>
        ) : (
          <div className="space-y-2">
            {sepet.map((item, idx) => {
              const urun = urunler.find(u => u.id === item.urun_id);
              if (!urun) return null;
              const adet = toNum(item.miktar);
              const fiyat = toNum(item.fiyat);
              const brutSatir = adet * fiyat;
              const etkinIskonto = item.iskonto != null ? toNum(item.iskonto) : musteriIskonto;
              return (
                <div key={idx} className="flex flex-col border-b pb-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="scrolling-text-container" title={urun.isim}>
                        <span className="scrolling-text" data-text={urun.isim}>{urun.isim}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {adet} x {money(fiyat)} = <strong>{money(brutSatir)}</strong>
                        {etkinIskonto > 0 && <span className="ml-1">(-%{etkinIskonto} iskonto)</span>}
                        <span className="ml-1">(+ %{toNum(item.kdv_orani).toFixed(2)} KDV)</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => updateSepetMiktar(item.urun_id, -1)} className="px-2 bg-gray-200 rounded dark:text-gray-800">−</button>
                      <span>{adet}</span>
                      <button onClick={() => updateSepetMiktar(item.urun_id, 1)} className="px-2 bg-gray-200 rounded dark:text-gray-800">+</button>
                    </div>
                    <button onClick={() => removeFromSepet(item.urun_id)} className="text-red-500 text-xs ml-2">✕</button>
                  </div>

                  {/* opsiyonel: satır bazlı iskonto override */}
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-xs text-gray-500">Satır İskonto %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={item.iskonto ?? ''}
                      placeholder={String(musteriIskonto)}
                      onChange={(e) => changeItemIskonto(item.urun_id, e.target.value)}
                      className="w-24 p-1 text-sm border rounded dark:bg-gray-900"
                    />
                  </div>
                </div>
              );
            })}

            <div className="border-t pt-2 mt-2 text-sm space-y-1">
              <div className="flex justify-between"><span>Ara Toplam (iskontosuz):</span><span>{money(araToplam)}</span></div>
              <div className="flex justify-between"><span>Net Toplam (iskontolu, KDV hariç):</span><span>{money(netToplam)}</span></div>

              {/* KDV oranlarına göre ayrıştırılmış toplamlar */}
              {Object.entries(kdvGruplari)
                .sort(([a],[b]) => toNum(a) - toNum(b))
                .map(([oran, tutar]) => (
                  <div key={oran} className="flex justify-between">
                    <span>KDV (%{oran}):</span>
                    <span>{money(tutar)}</span>
                  </div>
                ))}
              <div className="flex justify-between text-base mt-2"><span>Toplam KDV:</span><span>{money(toplamKdv)}</span></div>
              <div className="flex justify-between font-bold text-base mt-2"><span>Genel Toplam:</span><span>{money(genelToplam)}</span></div>
            </div>

            <textarea
              className="w-full mt-4 p-2 border rounded text-sm dark:bg-gray-900"
              placeholder="Sipariş notu..."
              value={not}
              onChange={(e) => setNot(e.target.value)}
            />

            <select
              className="w-full mt-2 p-2 border rounded text-sm dark:bg-gray-900"
              value={teslimatAdresiId ?? ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTeslimatAdresiId(!isNaN(val) ? val : null);
              }}
            >
              <option value="" disabled>⟶ Teslimat adresi seçin</option>
              {teslimatAdresleri.map((adres: any) => (
                <option key={adres.id} value={adres.id}>
                  {adres.baslik} - {adres.adres}
                </option>
              ))}
            </select>

            <select
              className="w-full mt-2 p-2 border rounded text-sm dark:bg-gray-900"
              value={yetkiliId ?? ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setYetkiliId(!isNaN(val) ? val : null);
              }}
            >
              <option value="" disabled>⟶ Yetkili Seçin</option>
              {yetkililer.map((yetkili: any) => (
                <option key={yetkili.id} value={yetkili.id}>
                  {yetkili.isim} - {yetkili.pozisyon} - {yetkili.telefon}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          className="bg-green-600 text-white hover:bg-green-700 mt-4 w-full"
          disabled={sepet.length === 0 || teslimatAdresiId === null || yetkiliId === null}
        >
          Siparişi Kaydet
        </Button>
      </div>
    </div>
  );
}