// SiparisOlustur.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Button from '../../components/ui/button/Button';
import { toast } from 'react-toastify';

export default function SiparisOlustur() {
  const { musteriId } = useParams();
  const navigate = useNavigate();

  const [musteri, setMusteri] = useState<any>(null);
  const [urunler, setUrunler] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [miktarlar, setMiktarlar] = useState<{ [key: number]: number }>({});
  const [sepet, setSepet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [not, setNot] = useState('');
  const [teslimatAdresiId, setTeslimatAdresiId] = useState<number | null>(null);
  const [teslimatAdresleri, setTeslimatAdresleri] = useState<any[]>([]);
  const [yetkiliId, setYetkiliId] = useState<number | null>(null);
  const [yetkililer, setYetkililer] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`/v1/siparisler/create/${musteriId}`).then(res => {
      setMusteri(res.data.musteri);
      setUrunler(res.data.urunler);
      setTeslimatAdresleri(res.data.teslimat_adresleri);
      setYetkililer(res.data.yetkililer);
      setLoading(false);
    });
  }, [musteriId]);

  const handleMiktarDegistir = (urunId: number, fark: number) => {
    setMiktarlar(prev => {
      const yeniDeger = (prev[urunId] || 1) + fark;
      return {
        ...prev,
        [urunId]: yeniDeger < 1 ? 1 : yeniDeger
      };
    });
  };

  const handleSepeteEkle = (urunId: number) => {
    const urun = urunler.find(u => u.id === urunId);
    const miktar = miktarlar[urunId] || 1;

    const mevcut = sepet.find(item => item.urun_id === urunId);
    if (mevcut) {
      setSepet(sepet.map(item =>
        item.urun_id === urunId
          ? { ...item, miktar: item.miktar + miktar }
          : item
      ));
    } else {
      setSepet([...sepet, {
        urun_id: urun.id,
        miktar,
        fiyat: urun.satis_fiyati
      }]);
    }
  };

  const updateSepetMiktar = (urunId: number, fark: number) => {
    setSepet(prev =>
      prev.map(item =>
        item.urun_id === urunId
          ? { ...item, miktar: Math.max(item.miktar + fark, 1) }
          : item
      )
    );
  };

  const removeFromSepet = (urunId: number) => {
    setSepet(prev => prev.filter(item => item.urun_id !== urunId));
  };

  // Siparişi gönder
  const handleSubmit = async () => {
    try {
      const res = await axios.post('/v1/siparisler', {
        musteri_id: musteriId,
        urunler: sepet.map(item => ({
          urun_id: item.urun_id,
          miktar: item.miktar,
          fiyat: item.fiyat,
        })),
        yetkili_id: yetkiliId,
        kdv: 10,
        iskonto: 0,
        not: not,
        teslimat_adresi_id: teslimatAdresiId,
      });

      if (!yetkiliId || !teslimatAdresiId) {
        toast.error('Lütfen yetkili ve teslimat adresi seçin.', { position: 'top-right' });
        return;
      }

      toast.success('Sipariş başarıyla oluşturuldu!', { position: 'top-right' });
      navigate(`/siparisler/${res.data.siparis_id}`); // İstersen listeye de dönebilirsin
    } catch (error: any) {
      console.error("Sipariş oluşturulamadı:", error);
      const status = error.response?.status;

      if (status === 422) {
        const validationErrors = error.response.data.errors;
        const firstError = validationErrors[Object.keys(validationErrors)[0]][0];
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


  const filteredUrunler = urunler.filter(u =>
    u.isim.toLowerCase().includes(search.toLowerCase())
  );

  const toplamTutar = sepet.reduce((acc, item) => acc + item.miktar * item.fiyat, 0);
  const kdvOrani = 10;
  const iskontoOrani = 0;
  const kdvTutari = toplamTutar * (kdvOrani / 100);
  const iskontoTutari = toplamTutar * (iskontoOrani / 100);
  const genelToplam = toplamTutar + kdvTutari - iskontoTutari;

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
          <small className='pt-2 pl-2'>{musteri.unvan}</small>
          <input
            type="text"
            placeholder="Ürün ara..."
            className="w-full mt-2 p-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUrunler.map(urun => (
            <div key={urun.id} className="border p-4 rounded shadow bg-white dark:bg-gray-800 dark:border-gray-500">
              <p className="font-semibold truncate" title={urun.isim}>{urun.isim}</p>
              <p className="text-sm text-gray-500">{urun.cesit}</p>
              <p className="text-green-600 font-bold">{urun.satis_fiyati} ₺</p>
              <p className="text-xs text-gray-500">Stok: {urun.stok_miktari}</p>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => handleMiktarDegistir(urun.id, -1)} className="px-2 py-1 bg-gray-300 rounded dark:text-gray-800">−</button>
                <span>{miktarlar[urun.id] || 1}</span>
                <button onClick={() => handleMiktarDegistir(urun.id, 1)} className="px-2 py-1 bg-gray-300 rounded dark:text-gray-800">+</button>
              </div>
              <Button onClick={() => handleSepeteEkle(urun.id)} className="mt-3 w-full">Sepete Ekle</Button>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky top-19 h-fit bg-white dark:bg-gray-900 p-4 border rounded shadow dark:text-gray-100 dark:border-gray-500">
        <small>{musteri.unvan}</small>
        <h2 className="text-lg font-semibold mb-4">Sepet</h2>
        {sepet.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz ürün seçilmedi.</p>
        ) : (
          <div className="space-y-2">
            {sepet.map((item, idx) => {
              const urun = urunler.find(u => u.id === item.urun_id);
              if (!urun) return null;
              return (
                <div key={idx} className="flex justify-between items-center text-sm border-b pb-1">
                  <div className="flex-1 min-w-0">
                    <div className="scrolling-text-container" title={urun.isim}>
                      <span className="scrolling-text" data-text={urun.isim}>{urun.isim}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{item.miktar} x {item.fiyat} ₺</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => updateSepetMiktar(item.urun_id, -1)} className="px-2 bg-gray-200 rounded dark:text-gray-800">−</button>
                    <span>{item.miktar}</span>
                    <button onClick={() => updateSepetMiktar(item.urun_id, 1)} className="px-2 bg-gray-200 rounded dark:text-gray-800">+</button>
                  </div>
                  <button onClick={() => removeFromSepet(item.urun_id)} className="text-red-500 text-xs ml-2">✕</button>
                </div>
              );
            })}

            <div className="border-t pt-2 mt-2 text-sm">
              <div className="flex justify-between"><span>Ara Toplam:</span><span>{toplamTutar.toFixed(2)} ₺</span></div>
              <div className="flex justify-between"><span>KDV ({kdvOrani}%):</span><span>{kdvTutari.toFixed(2)} ₺</span></div>
              <div className="flex justify-between"><span>İskonto:</span><span>{iskontoTutari.toFixed(2)} ₺</span></div>
              <div className="flex justify-between font-bold text-base mt-2"><span>Genel Toplam:</span><span>{genelToplam.toFixed(2)} ₺</span></div>
            </div>

            <textarea
              className="w-full mt-4 p-2 border rounded text-sm"
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
              {teslimatAdresleri.map(adres => (
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
              {yetkililer.map(yetkili => (
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
          disabled={sepet.length === 0 || teslimatAdresiId === null}
        >
          Siparişi Kaydet
        </Button>
      </div>
    </div>
  );
}