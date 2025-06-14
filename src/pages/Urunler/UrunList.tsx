import { useEffect, useState, ChangeEvent } from 'react';
import axios from '../../api/axios'; // senin mevcut axios instance
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

interface Urun {
  id: number;
  kod: string;
  isim: string;
  cesit: string;
  birim: string;
  tedarik_fiyati: number;
  satis_fiyati: number;
  stok_miktari: number;
  kritik_stok: number;
}

export default function UrunList() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<boolean>(true); // <-- burada tanımla
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get('/v1/urunler');
        setUrunler(response.data.data);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false); // Her durumda yükleme durumu sona erer
      }
    };

    loadData();
  }, []);


  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredUrunler = urunler.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.isim.toLowerCase().includes(term) ||
      (item.cesit?.toLowerCase().includes(term) ?? false)
    );
  });

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
    <div className="overflow-x-auto p-2 border border-gray-200 rounded-2xl dark:border-white/10 shadow-sm">
      <div className="p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Ürün Ara..."
            value={search}
            onChange={handleSearchChange}
            className="w-half p-2 dark:text-white/90 border border-gray-200 rounded dark:border-white/10"
          />
        </div>

        <table className="min-w-full table-auto border-collapse text-sm text-gray-800 dark:text-white/90">
          <thead className='bg-gray-100 dark:bg-white/[0.03]'>
            <tr>
              <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">Adı</th>
              <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">Çeşidi</th>
              <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">Birim</th>
              <th className="px-4 py-3 text-right font-medium border-b border-gray-300/20 dark:border-white/10 text-red-700 dark:text-red-300 hidden md:table-cell">Tedarik Fiyatı</th>
              <th className="px-4 py-3 text-right font-medium border-b border-gray-300/20 dark:border-white/10 text-green-700 dark:text-green-300">Satış Fiyatı</th>
              <th className="px-4 py-3 text-right font-medium border-b border-gray-300/20 dark:border-white/10 hidden md:table-cell">Stok</th>
              <th className="px-4 py-3 text-center font-medium border-b border-gray-300/20 dark:border-white/10">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filteredUrunler.map((urun) => (
              <tr key={urun.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="p-2">{urun.isim}</td>
                <td className="p-2">{urun.cesit}</td>
                <td className="p-2">{urun.birim}</td>
                <td className="p-2 text-right text-red-700 dark:text-red-300 hidden md:table-cell">{urun.tedarik_fiyati} ₺</td>
                <td className="p-2 text-right text-green-700 dark:text-green-300">{urun.satis_fiyati} ₺</td>
                <td className={`p-2 text-right hidden md:table-cell ${
                  urun.kritik_stok != null && Number(urun.stok_miktari) <= Number(urun.kritik_stok)
                    ? 'text-red-500'
                    : ''
                }`}>
                  {urun.stok_miktari}
                </td>
                <td className="p-2 text-center">
                  <Link 
                    to={`/urunler/${urun.id}`} 
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-100 text-blue-600 dark:text-blue-400"
                  >
                    <svg className="fill-current w-5 h-5" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}

            {filteredUrunler.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">Kayıt bulunamadı</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}