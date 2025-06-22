import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import ComponentCard from "../../components/common/ComponentCard";
import BarChartOne from "../../components/charts/bar/BarChartOne";
import { useNavigate } from 'react-router-dom';

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
  const [satisVerisi, setSatisVerisi] = useState<number[]>([]);

  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Urunler | null>(null); // düzenlenebilir form

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/v1/urunler/${id}`);
        setUrun(response.data.data);
        setForm(response.data.data); // Form için ayrı state

        const satisResponse = await axios.get(`/v1/urunler/${id}/satislar`);
        console.log("Satış verisi:", satisResponse.data.data); // BURADA KONTROL ET
        setSatisVerisi(satisResponse.data.data);
      } catch (err: any) {
       if (err.response) {
        console.error("Sunucu hatası (Laravel):", {
          status: err.response.status,
          message: err.response.data.message,
          trace: err.response.data, // varsa diğer hata detayları
        });
      } else {
        console.error("Axios Hatası:", err.message);
      }
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let newValue: string | number | boolean | null;

    if (type === "checkbox" && "checked" in e.target) {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (
      ['satis_fiyati', 'tedarik_fiyati', 'stok_miktari', 'kritik_stok', 'kdv_orani'].includes(name)
    ) {
      newValue = value === '' ? null : Number(value);
    } else {
      newValue = value;
    }

    setForm((prevForm) => ({
      ...prevForm!,
      [name]: newValue,
    }));
  };


  const handleSave = async () => {
    console.log("Kaydedilecek form:", form); // BURAYI EKLE
    try {
      await axios.put(`/v1/urunler/${id}`, form);
      setUrun(form); // Güncellenmiş veriyi yansıt
      setEditMode(false);
    } catch (err: any) {
      if (err.response) {
        console.error("Kaydetme hatası:", {
          status: err.response.status,
          message: err.response.data.message,
          errors: err.response.data.errors, // <--- BURADA VALIDATION HATALARI OLACAK
        });
      } else {
        console.error("Kaydetme hatası:", err.message);
      }
    }
  };

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
  <div className="min-w-full mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-6 border-b pb-2">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
        <span className="text-blue-600 dark:text-blue-400">{urun.isim}</span>
      </h2>

      <div className="flex items-center gap-2">
        {editMode ? (
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Kaydet
          </button>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="px-3 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
          >
            Düzenle
          </button>
        )}

        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
        >
          Geri
        </button>
      </div>
    </div>

    <table className="w-full text-sm text-left text-gray-700 dark:text-white/90">
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        <tr>
          <td className="py-1.5 font-medium min-w-fit whitespace-nowrap">Kod:</td>
           <td className="py-1.5 w-full">
            {editMode ? (
              <input
                name="kod"
                value={form?.kod || ''}
                onChange={handleChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full dark:bg-white/10 dark:text-white/90"
              />
            ) : (
              urun.kod ?? '-'
            )}
          </td>
        </tr>
        <tr>
          <td className="py-1.5 font-medium min-w-fit whitespace-nowrap">Çeşidi:</td>
          <td className="py-1.5 w-full">
            {editMode ? (
              <input
                type="text"
                name="cesit"
                value={form?.cesit || ''}
                onChange={handleChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full dark:bg-white/10 dark:text-white/90"
              />
            ) : (
              urun.cesit ?? '-'
            )}
          </td>
        </tr>
        <tr>
          <td className="py-1.5 font-medium min-w-fit whitespace-nowrap">Birim:</td>
          <td className="py-1.5 w-full">
            {editMode ? (
              <input
                type="text"
                name="birim"
                value={form?.birim || ''}
                onChange={handleChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full dark:bg-white/10 dark:text-white/90"
              />
            ) : (
              urun.birim
            )}
          </td>
        </tr>
        <tr>
          <td className="py-1.5 font-medium text-red-700 dark:text-red-400 min-w-fit whitespace-nowrap">Tedarik Fiyatı: &nbsp;</td>
          <td className="py-1.5 text-red-700 dark:text-red-400 w-full">
            {editMode ? (
              <input
                type="number"
                step="0.01"
                name="tedarik_fiyati"
                value={form?.tedarik_fiyati ?? 0}
                onChange={handleChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full dark:bg-white/10 dark:text-white/90"
              />
            ) : (
              `${urun.tedarik_fiyati} ₺`
            )}
          </td>
        </tr>
        <tr>
          <td className="py-1.5 font-medium text-green-700 dark:text-green-400 min-w-fit whitespace-nowrap">Satış Fiyatı:</td>
          <td className="py-1.5 text-green-700 dark:text-green-400 w-full">
            {editMode ? (
              <input
                type="number"
                step="0.01"
                name="satis_fiyati"
                value={form?.satis_fiyati ?? 0}
                onChange={handleChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full dark:bg-white/10 dark:text-white/90"
              />
            ) : (
              `${urun.satis_fiyati} ₺`
            )}
          </td>
        </tr>
         <tr>
          <td className="py-1.5 font-medium min-w-fit whitespace-nowrap">Kar Marjı:</td>
          <td className="py-1.5 w-full">
            %{((urun.satis_fiyati - urun.tedarik_fiyati) / urun.satis_fiyati * 100)
            .toFixed(2)
            .replace('.', ',')}
          </td>
        </tr>
        <tr>
          <td className="py-1.5 font-medium min-w-fit whitespace-nowrap">Stok Miktarı:</td>
          <td
            className={`py-1.5 w-full ${
              urun.kritik_stok != null && (Number(form?.stok_miktari ?? urun.stok_miktari)) <= Number(urun.kritik_stok)
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : ''
            }`}
          >
            {editMode ? (
              <input
                type="number"
                name="stok_miktari"
                value={Number(form?.stok_miktari) ?? 0}
                onChange={handleChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full dark:bg-white/10 dark:text-white/90"
              />
            ) : (
              Number(urun.stok_miktari)
            )}
          </td>
        </tr>
        <tr>
          <td className="py-1.5 font-medium min-w-fit whitespace-nowrap">Kritik Stok:</td>
          <td className="py-1.5 w-full">
            {editMode ? (
              <input
                type="number"
                name="kritik_stok"
                value={Number(form?.kritik_stok) ?? 0}
                onChange={handleChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full dark:bg-white/10 dark:text-white/90"
              />
            ) : (
             Number(urun.kritik_stok)
            )}
          </td>
        </tr>
        <tr>
          <td className="py-1.5 font-medium min-w-fit whitespace-nowrap">KDV Oranı:</td>
          <td className="py-1.5 w-full">
            {editMode ? (
              <input
                type="number"
                step="0.01"
                name="kdv_orani"
                value={Number(form?.kdv_orani) ?? 0}
                onChange={handleChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full dark:bg-white/10 dark:text-white/90"
              />
            ) : (
              `%${Number(urun.kdv_orani)}` 
            )}
          </td>
        </tr>
        <tr>
          <td className="py-1.5 font-medium min-w-fit whitespace-nowrap">Aktif:</td>
          <td className="py-1.5 w-full">
            {editMode ? (
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                    type="checkbox"
                    name="aktif"
                    checked={form?.aktif ?? false}
                    onChange={handleChange}
                    className={`toggle-checkbox absolute block w-6 h-6 rounded-full border-4 appearance-none cursor-pointer top-0 left-0 transition-transform duration-300 ease-in-out
                      ${form?.aktif ? 'bg-green-500 translate-x-6' : 'bg-white'}
                    `}
                  />
                <label
                  htmlFor="aktif"
                  className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                ></label>
              </div>
            ) : (
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${form?.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {form?.aktif ? 'Aktif' : 'Pasif'}
              </span>
            )}
          </td>
        </tr>

      </tbody>
    </table>

    <div className="space-y-6 mt-5">
      {!satisVerisi.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Satış verisi yükleniyor...</p>
      ) : (
        <ComponentCard title="Ürünün Yıllık Satış Grafiği">
          <BarChartOne data={satisVerisi} />
        </ComponentCard>
      )}
    </div>
  </div>
  );
}