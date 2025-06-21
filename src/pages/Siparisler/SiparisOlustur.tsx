import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Button from '../../components/ui/button/Button';

export default function SiparisOlustur() {
  const { musteriId } = useParams();
  const navigate = useNavigate();

  const [musteri, setMusteri] = useState<any>(null);
  const [urunler, setUrunler] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [miktarlar, setMiktarlar] = useState<{ [key: number]: number }>({});
  const [sepet, setSepet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/v1/siparisler/create/${musteriId}`).then(res => {
      setMusteri(res.data.musteri);
      setUrunler(res.data.urunler);
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

  const handleSubmit = async () => {
    try {
      await axios.post('/v1/siparisler', {
        musteri_id: musteriId,
        urunler: sepet,
        yetkili: "Test Yetkili",
        kdv: 18,
        iskonto: 0
      });
      navigate('/siparisler');
    } catch (e) {
      console.error("Sipariş oluşturulamadı:", e);
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


  const filteredUrunler = urunler.filter(u =>
    u.isim.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <svg
              className="animate-spin h-10 w-10 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-gray-600 text-sm">Yükleniyor...</p>
          </div>
        </div>
      );
    }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Sipariş Oluştur - {musteri.unvan}</h1>

      <input
        type="text"
        placeholder="Ürün ara..."
        className="w-full mb-4 p-2 border rounded dark:bg-gray-800 dark:text-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {filteredUrunler.map(urun => (
          <div key={urun.id} className="border p-4 rounded shadow">
            <p className="font-semibold">{urun.isim}</p>
            <p className="text-sm text-gray-500">{urun.cesit}</p>
            <p className="text-green-600 font-bold">{urun.satis_fiyati} ₺</p>

            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => handleMiktarDegistir(urun.id, -1)} className="px-2 py-1 bg-gray-300 rounded">−</button>
              <span>{miktarlar[urun.id] || 1}</span>
              <button onClick={() => handleMiktarDegistir(urun.id, 1)} className="px-2 py-1 bg-gray-300 rounded">+</button>
            </div>

            <Button onClick={() => handleSepeteEkle(urun.id)} className="mt-3 w-full">
              Sepete Ekle
            </Button>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Sepet</h2>
      {sepet.length === 0 ? (
        <p className="text-sm text-gray-500">Henüz ürün seçilmedi.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-gray-800 dark:text-white/90">
            <thead className="bg-gray-100 dark:bg-white/10">
              <tr>
                <th className="px-4 py-2 border-b">Ürün</th>
                <th className="px-4 py-2 border-b text-center">Fiyat</th>
                <th className="px-4 py-2 border-b text-center">Miktar</th>
                <th className="px-4 py-2 border-b text-center">Ara Toplam</th>
                <th className="px-4 py-2 border-b text-center">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {sepet.map((item, idx) => {
                const urun = urunler.find(u => u.id === item.urun_id);
                if (!urun) return null;

                return (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <td className="px-4 py-2 border-b">{urun.isim}</td>
                    <td className="px-4 py-2 border-b text-center">{item.fiyat} ₺</td>
                    <td className="px-4 py-2 border-b text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => updateSepetMiktar(item.urun_id, -1)} className="px-2 bg-gray-200 rounded">−</button>
                        <span>{item.miktar}</span>
                        <button onClick={() => updateSepetMiktar(item.urun_id, 1)} className="px-2 bg-gray-200 rounded">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-2 border-b text-center">
                      {(item.fiyat * item.miktar).toFixed(2)} ₺
                    </td>
                    <td className="px-4 py-2 border-b text-center">
                      <button onClick={() => removeFromSepet(item.urun_id)} className="text-red-500 hover:underline">
                        Kaldır
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={3} className="px-4 py-2 font-semibold text-right border-t">Toplam</td>
                <td className="px-4 py-2 text-center font-bold border-t">
                  {sepet.reduce((acc, item) => acc + item.miktar * item.fiyat, 0).toFixed(2)} ₺
                </td>
                <td className="border-t"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}


      <Button
        onClick={handleSubmit}
        className="bg-green-600 text-white hover:bg-green-700"
        disabled={sepet.length === 0}
      >
        Siparişi Kaydet
      </Button>
    </div>
  );
}