import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Musteri {
  id: number;
  unvan: string;
  telefon?: string;
  email?: string;
  tur: string;
  musteri_tur: string;
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


  if (loading) return <p>Yükleniyor...</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Müşteriler</h1>
        <Link to="/musteriler/yeni" className="btn btn-primary">+ Yeni Müşteri</Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Unvan</th>
              <th className="border px-4 py-2">Telefon</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Tür</th>
              <th className="border px-4 py-2">Segment</th>
              <th className="border px-4 py-2">Notlar</th>
              <th className="border px-4 py-2">Durum</th>
              <th className="border px-4 py-2">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {musteriler.map((musteri) => (
              <tr key={musteri.id}>
                <td className="border px-4 py-2">{musteri.unvan}</td>
                <td className="border px-4 py-2">{musteri.telefon}</td>
                <td className="border px-4 py-2">{musteri.email}</td>
                <td className="border px-4 py-2 capitalize">{musteri.tur}</td>
                <td className="border px-4 py-2">{musteri.musteri_tur}</td>
                <td className="border px-4 py-2">{musteri.not_sayisi} adet</td>
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