import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from '../../api/axios';

interface Urunler {
  id: number;
  kod: string;
  isim: string;
  cesit: string;
  birim: string;
  tedarik_fiyati: number;
  satis_fiyati: number;
  stok_miktari: number;
  kritik_stok: number;
  kdv_orani: number;
  aktif: boolean;
}

export default function UrunEdit() {
  const { id } = useParams<{ id: string }>();
  const [urun, setUrun] = useState<Urunler | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/v1/urunler/${id}`);
        setUrun(response.data.data);
      } catch (err) {
        console.error("Ürün verisi çekilemedi:", err);
      }
    };

    fetchData();
  }, [id]);

  if (!urun) {
    return  <div className="flex items-center justify-center h-64">
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
        </div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Ürün Detayı: {urun.isim}
      </h2>

      <div className="space-y-3">
        <p><strong>Kod:</strong> {urun.kod ?? '-'}</p>
        <p><strong>Çeşidi:</strong> {urun.cesit ?? '-'}</p>
        <p><strong>Birim:</strong> {urun.birim}</p>
        <p><strong>Tedarik Fiyatı:</strong> {urun.tedarik_fiyati} ₺</p>
        <p><strong>Satış Fiyatı:</strong> {urun.satis_fiyati} ₺</p>
        <p><strong>Stok Miktarı:</strong> {urun.stok_miktari}</p>
        <p><strong>Kritik Stok:</strong> {urun.kritik_stok}</p>
        <p><strong>KDV Oranı:</strong> %{urun.kdv_orani}</p>
      </div>
    </div>
  );
}