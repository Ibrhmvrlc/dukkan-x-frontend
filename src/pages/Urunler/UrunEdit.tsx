import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import axios from '../../api/axios';
import ComponentCard from "../../components/common/ComponentCard";
import BarChartOne from "../../components/charts/bar/BarChartOne";

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
  const navigate = useNavigate();
  const [loadingSales, setLoadingSales] = useState(true);
  const [urun, setUrun] = useState<Urunler | null>(null);
  const [form, setForm] = useState<Urunler | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [satisVerisi, setSatisVerisi] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/v1/urunler/${id}`);
        setUrun(data.data);
        setForm(data.data);

        setLoadingSales(true);
        const satisResponse = await axios.get(`/v1/urunler/${id}/satislar`);
        const raw = satisResponse?.data?.data ?? satisResponse?.data;
        setSatisVerisi(normalizeSales(raw));
      } catch (err: any) {
        console.error(err?.response ?? err?.message);
        setSatisVerisi(Array(12).fill(0)); // hata halinde boş veri
      } finally {
        setLoadingSales(false);
      }
    };
    fetchData();
  }, [id]);

  const numberKeys = new Set([
    "satis_fiyati",
    "tedarik_fiyati",
    "stok_miktari",
    "kritik_stok",
    "kdv_orani",
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(prev => {
      if (!prev) return prev;
      const v =
        type === "checkbox" ? checked
        : numberKeys.has(name) ? (value === "" ? 0 : Number(value))
        : value;
      return { ...prev, [name]: v } as Urunler;
    });
  };

  // Karşılaştırma için normalize
  const normalize = (u: Urunler | null) => {
    if (!u) return null;
    return {
      kod: u.kod ?? "",
      isim: u.isim ?? "",
      cesit: u.cesit ?? "",
      birim: u.birim ?? "",
      tedarik_fiyati: Number(u.tedarik_fiyati ?? 0),
      satis_fiyati: Number(u.satis_fiyati ?? 0),
      stok_miktari: Number(u.stok_miktari ?? 0),
      kritik_stok: Number(u.kritik_stok ?? 0),
      kdv_orani: Number(u.kdv_orani ?? 0),
      aktif: Boolean(u.aktif),
    };
  };

  const isDirty = useMemo(() => {
    if (!editMode || !urun || !form) return false;
    return JSON.stringify(normalize(urun)) !== JSON.stringify(normalize(form));
  }, [editMode, urun, form]);

  const handleSave = async () => {
    if (!form) return;
    try {
      setSaving(true);
      await axios.put(`/v1/urunler/${id}`, form);
      setUrun(form);
      setEditMode(false);
    } catch (err: any) {
      if (err.response) {
        console.error("Kaydetme hatası:", err.response);
      } else {
        console.error("Kaydetme hatası:", err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrBack = () => {
    if (editMode) {
      if (isDirty) {
        const ok = window.confirm("Kaydetmeden düzenlemeyi kapatmak istiyor musunuz?");
        if (!ok) return;
      }
      setForm(urun);
      setEditMode(false);
    } else {
      navigate(-1);
    }
  };

  
  // --- yardımcı: her şeyi 12 elemanlı number[]'a çevir
  function normalizeSales(raw: any): number[] {
    // 12 ay 0'larla başla
    const arr = Array(12).fill(0);

    if (!raw) return arr;

    // 1) Zaten number[] ise
    if (Array.isArray(raw)) {
      for (let i = 0; i < 12; i++) arr[i] = Number(raw[i] ?? 0);
      return arr;
    }

    // 2) [{month: 1..12, total: n}] gibi dizi ise
    if (Array.isArray(raw?.data)) {
      raw = raw.data;
    }
    if (Array.isArray(raw) && typeof raw[0] === "object") {
      for (const it of raw) {
        const m = Number(it.month ?? it.ay ?? it.monthIndex ?? it.m ?? 0);
        if (m >= 1 && m <= 12) arr[m - 1] = Number(it.total ?? it.sum ?? it.value ?? 0);
      }
      return arr;
    }

    // 3) { "1": 10, "2": 0, ... } ya da { "Oca": 10, "Şub": 5, ... }
    const monthMap: Record<string, number> = {
      "1":1,"01":1,"oca":1,"ocak":1,
      "2":2,"02":2,"şub":2,"sub":2,"şubat":2,
      "3":3,"03":3,"mar":3,"mart":3,
      "4":4,"04":4,"nis":4,"nisan":4,
      "5":5,"05":5,"may":5,"mayıs":5,"mayis":5,
      "6":6,"06":6,"haz":6,"haziran":6,
      "7":7,"07":7,"tem":7,"temmuz":7,
      "8":8,"08":8,"ağu":8,"agu":8,"ağustos":8,"agustos":8,
      "9":9,"09":9,"eyl":9,"eylül":9,"eylul":9,
      "10":10,"eki":10,"ekim":10,
      "11":11,"kas":11,"kasım":11,"kasim":11,
      "12":12,"ara":12,"aralık":12,"aralik":12,
    };

    if (typeof raw === "object") {
      for (const k of Object.keys(raw)) {
        const key = k.toLowerCase();
        const m = monthMap[key];
        if (m) arr[m - 1] = Number((raw as any)[k] ?? 0);
      }
      return arr;
    }

    return arr;
  }

  if (!urun) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-gray-600 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-full mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          <span className="text-blue-600 dark:text-blue-400">{urun.isim}</span>
        </h2>

        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-3 py-1.5 rounded-md text-sm text-white ${saving ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                onClick={handleCancelOrBack}
                className="px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                İptal
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setForm(urun); setEditMode(true); }}
                className="px-3 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
              >
                Düzenle
              </button>
              <button
                onClick={handleCancelOrBack}
                className="px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                Geri
              </button>
            </>
          )}
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
            <td className="py-1.5 font-medium text-red-700 dark:text-red-400 min-w-fit whitespace-nowrap">Tedarik Fiyatı:</td>
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
              %{((urun.satis_fiyati - urun.tedarik_fiyati) / urun.satis_fiyati * 100).toFixed(2).replace('.', ',')}
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
                    id="aktif"
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
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    urun.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {urun.aktif ? 'Aktif' : 'Pasif'}
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="space-y-6 mt-5">
        {loadingSales ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Satış verisi yükleniyor...</p>
        ) : satisVerisi.some(n => n > 0) ? (
          <ComponentCard title="Ürünün Yıllık Satış Grafiği">
            <BarChartOne data={satisVerisi} />
          </ComponentCard>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bu ürün için kayıtlı satış bulunamadı.
          </p>
        )}
      </div>

    </div>
  );
}