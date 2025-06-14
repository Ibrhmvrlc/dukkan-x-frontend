import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { Link } from 'react-router-dom';
import { formatPhoneNumberIntl } from 'react-phone-number-input';

interface tur {
  id: number;
  isim: string;
}

interface Musteri {
  id: number;
  unvan: string;
  telefon?: string;
  email?: string;
  tur: string;
  musteri_tur: tur | null;
  aktif: boolean;
  not_sayisi: number;
}

export default function MusterilerList() {
  const [musteriler, setMusteriler] = useState<Musteri[]>([]);
  const [loading, setLoading] = useState(true);
  
 useEffect(() => {
    axios.get('/v1/musteriler')
        .then(res => {
        console.log("API cevabı:", res.data); // geçici log
        if (Array.isArray(res.data.data)) {
            setMusteriler(res.data.data);
        } else {
            console.error("Beklenmeyen API formatı", res.data);
            setMusteriler([]); // hata varsa listeyi boş ver
        }
        })
        .catch(err => {
        console.error("API hatası:", err.response?.data || err.message);
        setMusteriler([]);
        })
        .finally(() => setLoading(false));
    }, []);

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
      <div className="">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold dark:text-white/90">Müşteriler</h1>
          <Link to="/musteriler/yeni" className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600">+ Yeni Müşteri</Link>
        </div>
       <div className="overflow-x-auto p-2 border border-gray-200 rounded-2xl dark:border-white/10 shadow-sm">
          <table className="min-w-full table-auto border-collapse text-sm text-gray-800 dark:text-white/90">
            <thead className="bg-gray-100 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">Unvan</th>
                <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">Telefon</th>
                <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">Email</th>
                <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">Tür</th>
                <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">Sektör</th>
                <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">Durum</th>
                <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {musteriler.map((musteri) => (
                <tr key={musteri.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 border-b border-gray-200/20">{musteri.unvan}</td>
                  <td className="px-4 py-3 border-b border-gray-200/20 dark:border-white/10">
                    <a href={`tel:+${musteri.telefon}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {musteri.telefon ? formatPhoneNumberIntl(musteri.telefon) : '-'}
                    </a>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-200/20 dark:border-white/10">{musteri.email}</td>
                  <td className="px-4 py-3 border-b border-gray-200/20 dark:border-white/10 capitalize">{musteri.tur}</td>
                  <td className="px-4 py-3 border-b border-gray-200/20 dark:border-white/10">{musteri.musteri_tur?.isim}</td>
                  <td className="px-4 py-3 border-b border-gray-200/20 dark:border-white/10">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${musteri.aktif ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {musteri.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-200/20 dark:border-white/10 text-center align-middle">
                    <Link 
                      to={`/musteriler/${musteri.id}/duzenle`} 
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-100 text-blue-600 dark:text-blue-400"
                    >
                    <svg className="fill-current w-5 h-5" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                    </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
}