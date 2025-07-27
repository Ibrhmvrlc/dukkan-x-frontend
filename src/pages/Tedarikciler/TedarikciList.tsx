import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { Link } from 'react-router-dom';
import { formatPhoneNumberIntl } from 'react-phone-number-input';
import Button from "../../components/ui/button/Button";
import { Mail, MessageCircle } from "lucide-react";

interface Tedarikci {
  id: number;
  unvan: string;
  vergi_dairesi: string;
  vergi_no: string;
  adres: string;
  yetkili_ad?: string;
  telefon?: string;
  email?: string;
}

export default function TedarikcilerList() {
  const [tedarikciler, setTedarikciler] = useState<Tedarikci[]>([]);
  const [loading, setLoading] = useState(true);
  
 useEffect(() => {
    axios.get('/v1/tedarikciler')
        .then(res => {
        console.log("API cevabı:", res.data); // geçici log
        if (Array.isArray(res.data.data)) {
            setTedarikciler(res.data.data);
        } else {
            console.error("Beklenmeyen API formatı", res.data);
            setTedarikciler([]); // hata varsa listeyi boş ver
        }
        })
        .catch(err => {
        console.error("API hatası:", err.response?.data || err.message);
        setTedarikciler([]);
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
          <h1 className="text-xl font-bold dark:text-white/90">Tedarikçiler</h1>
          <Link to="/tedarikciler/yeni" className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600">+ Tedarikçi Ekle</Link>
        </div>
       <div className="overflow-x-auto p-2 border border-gray-200 rounded-2xl dark:border-white/10 shadow-sm">
          <table className="min-w-full table-auto border-collapse text-sm text-gray-800 dark:text-white/90">
            <thead className="bg-gray-100 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left font-medium border-b dark:border-white/10">Unvan</th>
                {/* <th className="px-4 py-3 text-left font-medium border-b dark:border-white/10 md:table-cell">Bakiye</th> */}
                <th className="px-4 py-3 text-left font-medium border-b dark:border-white/10 hidden md:table-cell">Telefon</th>
                <th className="px-4 py-3 text-left font-medium border-b dark:border-white/10 hidden md:table-cell">Email</th>
                 {/*<th className="px-4 py-3 text-center font-medium border-b dark:border-white/10">Sipariş Ver</th> */}
              </tr>
            </thead>
            <tbody>
              {tedarikciler
                .filter((tedarikci) => tedarikci.id !== 1) // ID'si 1 olanı hariç tut
                .map((tedarikci) => (
                  <tr key={tedarikci.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border dark:border-white/10">
                    <td className="px-4 py-3 border-b dark:border-white/10">
                      <Link 
                        to={`/tedarikciler/${tedarikci.id}/duzenle`} 
                        className="hover:bg-blue-100 text-blue-600 dark:text-blue-400"
                      >
                        {tedarikci.unvan}
                      </Link>
                    </td>
                    {/* <td className="px-4 py-3 border-b dark:border-white/10 md:table-cell">
                      100.000 (A)
                    </td>
                    */}
                    <td className="px-4 py-3 border-b dark:border-white/10 hidden md:table-cell">
                      <a href={`tel:+${tedarikci.telefon}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {tedarikci.telefon ? formatPhoneNumberIntl(tedarikci.telefon) : '-'}
                      </a>
                    </td>
                    <td className="px-4 py-3 border-b dark:border-white/10 hidden md:table-cell">{tedarikci.email}</td>
                    {/* <td className="px-4 py-3 border-b dark:border-white/10 align-middle text-center">
                      <Link to={`/siparis/ver/${tedarikci.id}`}>
                        <button
                          className="m-1 p-2 rounded-md border border-gray-300 dark:border-gray-700 text-gray-400 hover:text-green-500 hover:border-green-500 transition-colors"
                          title="WhatsApp ile Sipariş Ver"
                          disabled
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link to={`/siparis/ver/${tedarikci.id}`}>
                        <button
                          className="p-2 rounded-md border border-gray-300 dark:border-gray-700 text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-colors"
                          title="E-Posta ile Sipariş Ver"
                          disabled
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </Link>
                    </td> */}
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
}