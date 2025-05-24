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
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold dark:text-white/90">Müşteriler</h1>
          <Link to="/musteriler/yeni" className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600">+ Yeni Müşteri</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300 dark:text-white/90">
            <thead>
              <tr className="bg-gray-100 dark:bg-white/[0.03]">
                <th className="border px-4 py-2">Unvan</th>
                <th className="border px-4 py-2">Telefon</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Tür</th>
                <th className="border px-4 py-2">Sektör</th>
                <th className="border px-4 py-2">Durum</th>
                <th className="border px-4 py-2">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {musteriler.map((musteri) => (
                <tr key={musteri.id}>
                  <td className="border px-4 py-2">{musteri.unvan}</td>
                  <td className="border px-4 py-2">
                    <a href={`tel:+${musteri.telefon}`}>
                    {musteri.telefon ? formatPhoneNumberIntl(musteri.telefon) : '-'}
                    </a>
                  </td>
                  <td className="border px-4 py-2">{musteri.email}</td>
                  <td className="border px-4 py-2 capitalize">{musteri.tur}</td>
                  <td className="border px-4 py-2">{musteri.musteri_tur?.isim}</td>
                  <td className="border px-4 py-2">
                    <span className={`text-sm px-2 py-1 rounded ${musteri.aktif ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {musteri.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="border px-4 py-2 space-x-2">
                    <Link to={`/musteriler/${musteri.id}/profil`} className="btn btn-sm btn-outline">Profil</Link>
                    <Link to={`/musteriler/${musteri.id}/duzenle`} className="btn btn-sm btn-outline">Düzenle</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
}