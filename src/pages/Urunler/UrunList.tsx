import { useEffect, useState, ChangeEvent } from 'react';
import axios from '../../api/axios';
import { Link } from 'react-router-dom';
import { Modal } from "../../components/ui/modal";
import { toast } from 'react-toastify';
import Button from "../../components/ui/button/Button";
import { BoxCubeIcon, PlusIcon } from "../../icons";
import { ArrowUpIcon } from "../../icons";
import { ArrowDownIcon } from "../../icons";

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
  aktif: boolean;
  marka: string;
  tedarikci_id: number;
  tedarikci?: {
    id: number;
    unvan: string;
    [key: string]: any; // diğerleri lazım olursa
  };
}

export default function UrunList() {
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);          // Tekil ürün modalı
  const [showBulkModal, setShowBulkModal] = useState(false);  // Toplu yükleme modalı
  const [showStokModal, setShowStokModal] = useState(false);  // Stok ekeleme modalı
  const [markalar, setMarkalar] = useState<string[]>([]);
  const [tedarikciler, setTedarikciler] = useState<{ id: number; unvan: string }[]>([]);
  const [tabType, setTabType] = useState<'all' | 'marka' | 'tedarikci'>('all');
  const [selectedValue, setSelectedValue] = useState<string | number | null>(null);
  const [urunQuery, setUrunQuery] = useState("");
  const [stokUrunAdaylari, setStokUrunAdaylari] = useState<Urun[]>([]);


  const [bulkFile, setBulkFile] = useState<File | null>(null); // Toplu dosya state

  const [stokForm, setStokForm] = useState({
    urun_id: "",
    miktar: ""
  });

  const handleUrunQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrunQuery(value);

    const results = urunler.filter((urun) =>
      urun.isim.toLocaleLowerCase('tr-TR').includes(value.toLocaleLowerCase())
    );
    setStokUrunAdaylari(results);
  };


  const handleStokFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "miktar") {
      // Noktaları temizle (örn. 100.000 → 100000)
      const rawValue = value.replace(/\./g, "").replace(/[^0-9]/g, "");

      setStokForm((prev) => ({
        ...prev,
        miktar: rawValue
      }));
    } else {
      setStokForm((prev) => ({ ...prev, [name]: value }));
    }
  };


  const handleStokSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.patch(`/v1/urunler/${stokForm.urun_id}/stok-ekle`, {
        miktar: parseInt(stokForm.miktar)
      });

      toast.success("Stok başarıyla eklendi");
      setShowStokModal(false);
      fetchUrunler(); // listeyi güncelle

      // 🔧 Tüm ilgili state'leri sıfırla:
      setStokForm({ urun_id: "", miktar: "" });
      setUrunQuery("");                     // input içindeki yazıyı temizle
      setStokUrunAdaylari([]);              // öneri listesini kapat
    } catch (err: any) {
      console.error("Stok eklenemedi:", err.response?.data || err.message);
      toast.error("Stok eklenirken hata oluştu");
    }
  };


  const [form, setForm] = useState({
    kod: "",
    isim: "",
    cesit: "",
    birim: "",
    tedarik_fiyati: "",
    satis_fiyati: "",
    stok_miktari: "",
    kritik_stok: "",
    marka: "",
    aktif: true,
  });

  const generateUniqueKod = (marka: string) => {
    const clean = (str: string) => {
      const turkishMap: Record<string, string> = {
        ç: "c", Ç: "C",
        ğ: "g", Ğ: "G",
        ı: "i", İ: "I",
        ö: "o", Ö: "O",
        ş: "s", Ş: "S",
        ü: "u", Ü: "U"
      };

      const replaced = str
        .split("")
        .map(c => turkishMap[c] || c)
        .join("");

      return replaced
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 3);
    };

    const markaKodu = clean(marka || "XXX");
    const timestamp = Date.now().toString().slice(-5);
    const random = Math.floor(1000 + Math.random() * 9000);

    return `${markaKodu}-${timestamp}-${random}`;
  };


  const fetchUrunler = async () => {
    try {
      const response = await axios.get('/v1/urunler');
      const data: Urun[] = response.data.data;
      setUrunler(data);

      // marka listesi
      const uniqueMarkalar = Array.from(new Set(data.map((u) => u.marka).filter(Boolean)));
      setMarkalar(uniqueMarkalar);

    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTedarikciler = async () => {
    try {
      const response = await axios.get('/v1/tedarikciler');
      const allTedarikciler = response.data.data;
      setTedarikciler(allTedarikciler); // response verisi: { id, unvan }[]
    } catch (error) {
      console.error("Tedarikçi verisi alınamadı:", error);
    }
  };

  useEffect(() => {
    fetchUrunler();
    fetchTedarikciler(); // 💡 Tüm tedarikçileri çek
  }, []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    if (name === "marka") {
      const yeniKod = generateUniqueKod(value);
      setForm((prev) => ({ ...prev, [name]: value, kod: yeniKod }));
    } else {
      setForm((prev) => ({ ...prev, [name]: val }));
    }
  };


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/v1/urunler', {
        ...form,
        tedarik_fiyati: parseFloat(form.tedarik_fiyati),
        satis_fiyati: parseFloat(form.satis_fiyati),
        stok_miktari: parseInt(form.stok_miktari),
        kritik_stok: parseInt(form.kritik_stok)
      });
      await fetchUrunler();
      setShowModal(false);
      setForm({
        kod: "",
        isim: "",
        cesit: "",
        birim: "",
        tedarik_fiyati: "",
        satis_fiyati: "",
        stok_miktari: "",
        kritik_stok: "",
        marka: "",
        aktif: true, // <-- yeni eklendi
      });
    } catch (error: any) {
      console.error("Ürün eklenemedi:", error.response?.data || error.message);
      alert("Ürün eklenirken hata oluştu.");
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkFile) {
      toast.warn("Lütfen bir dosya seçin", {
        position: "top-right",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", bulkFile);

    try {
      await axios.post('/v1/urunler/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchUrunler(); // tabloyu güncelle
      setShowBulkModal(false);
      setBulkFile(null);

      toast.success("Ürünler başarıyla yüklendi.", {
        position: "top-right",
      });
    } catch (err: any) {
      console.error("Yükleme hatası:", err.response?.data || err.message);
      toast.error("Yükleme başarısız oldu.", {
        position: "top-right",
      });
    }
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token'); // eksikse bu satır olsun

      const response = await axios.post('/v1/urunler/export', {}, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'urunler.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Excel başarıyla indirildi", { position: "top-right" });
    } catch (error) {
      console.error("Excel dışa aktarma hatası:", error);
      toast.error("Excel dışa aktarma başarısız oldu", { position: "top-right" });
    }
  };

  const filteredUrunler = urunler.filter((item) => {
    const isim = item.isim?.toLocaleLowerCase('tr-TR') || '';
    const cesit = item.cesit?.toLocaleLowerCase('tr-TR') || '';
    const arama = search.toLocaleLowerCase('tr-TR');

    const eslesme = isim.includes(arama) || cesit.includes(arama);

    if (tabType === 'marka' && selectedValue) {
      return eslesme && item.marka === selectedValue;
    }

    if (tabType === 'tedarikci' && selectedValue !== null) {
      return eslesme && item.tedarikci_id === selectedValue;
    }

    return eslesme;
  });

  const ortalamaKarOrani = filteredUrunler.length > 0
  ? filteredUrunler.reduce((acc, urun) => {
      const karYuzdesi = ((urun.satis_fiyati - urun.tedarik_fiyati) / urun.satis_fiyati) * 100;
      return acc + karYuzdesi;
    }, 0) / filteredUrunler.length
  : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 text-sm">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
       <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ürün Yönetimi</h1>
      </div>
      <div className="overflow-x-auto p-1 md:p-2 border border-gray-200 rounded-2xl dark:border-white/10 shadow-sm">
        <div className="p-3 md:p-6">
          {/* Arama ve Butonlar */}
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              placeholder="Ürün Ara..."
              value={search}
              onChange={handleSearchChange}
              className="w-full md:w-1/3 p-2 dark:text-white/90 border border-gray-200 rounded dark:border-white/10"
            />

            <div className="flex flex-nowrap gap-2 overflow-x-auto">
              <Button
                onClick={() => setShowStokModal(true)}
                size="sm"
                variant="outline"
                startIcon={<BoxCubeIcon />}
                className="whitespace-nowrap shrink-0"
              >
                Stok Ekle
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                size="sm"
                variant="outline"
                startIcon={<PlusIcon />}
                className="whitespace-nowrap shrink-0"
              >
                Ürün Yükle
              </Button>
              <Button
                onClick={() => setShowBulkModal(true)}
                size="sm"
                variant="outline"
                startIcon={<ArrowUpIcon />}
                className="whitespace-nowrap shrink-0"
              >
                Toplu Yükle
              </Button>
              <Button
                onClick={handleExport}
                size="sm"
                variant="outline"
                startIcon={<ArrowDownIcon />}
                className="whitespace-nowrap shrink-0"
              >
                Excel İndir
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2 md:mt-0 table-cell md:hidden">{/* genis ekranlarda gizli dar ekranlarda acik */}
              <small className='text-gray-300'>Tüm parametreleri görmek için yatay pozisyona getirin.</small>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => {
                setTabType('all');
                setSelectedValue(null);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md ${tabType === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-white/80'} text-sm`}
            >
              TÜM ÜRÜNLER
            </button>

            {markalar.map((marka) => (
              <button
                key={marka}
                onClick={() => {
                  setTabType('marka');
                  setSelectedValue(marka);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md ${tabType === 'marka' && selectedValue === marka ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-white/80'} text-sm`}
              >
                {marka}
              </button>
            ))}

            {tedarikciler.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTabType('tedarikci');
                  setSelectedValue(t.id);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md ${tabType === 'tedarikci' && selectedValue === t.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-white/80'} text-sm`}
              >
                {t.unvan.length > 12 ? t.unvan.slice(0, 12) + '…' : t.unvan}
              </button>
            ))}
          </div>

          {/* Ürün Tablosu */}
          <table className="min-w-full table-auto border-collapse text-sm text-gray-800 dark:text-white/90">
            <thead className="bg-gray-100 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left font-medium border-b border-gray-300/20 dark:border-white/10">Adı</th>
                <th className="px-4 py-3 text-center font-medium border-b border-gray-300/20 dark:border-white/10">Çeşidi</th>

                {tabType === 'marka' && (
                  <th className="px-4 py-3 text-center font-medium border-b border-gray-300/20 dark:border-white/10 hidden md:table-cell">Tedarikçi</th>
                )}
                {tabType === 'tedarikci' && (
                  <th className="px-4 py-3 text-center font-medium border-b border-gray-300/20 dark:border-white/10 hidden md:table-cell">Marka</th>
                )}

                <th className="px-4 py-3 text-center font-medium border-b border-gray-300/20 dark:border-white/10 text-red-700 dark:text-red-700 hidden md:table-cell">Tedarik Fiyatı</th>
                <th className="px-4 py-3 text-center font-medium border-b border-gray-300/20 dark:border-white/10 text-green-700 dark:text-green-300">Satış Fiyatı</th>
                <th className="px-4 py-3 text-center font-medium border-b border-gray-300/20 dark:border-white/10">Kar Marjı</th>
                <th className="px-4 py-3 text-center font-medium border-b border-gray-300/20 dark:border-white/10 hidden md:table-cell">Stok</th>
              </tr>
            </thead>
            <tbody>
              {filteredUrunler.length > 0 ? (
                filteredUrunler.map((urun) => (
                  <tr key={urun.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border dark:border-white/10">
                    <td className="p-2">
                      <Link 
                        to={`/urunler/${urun.id}`} 
                        className="hover:bg-blue-100 text-blue-600 dark:text-blue-400"
                      >
                        {urun.isim}
                      </Link>
                    </td>
                    <td className="p-2 text-center">{urun.cesit}</td>

                    {tabType === 'marka' && (
                      <td className="p-2 text-center hidden md:table-cell">
                        {urun.tedarikci?.unvan || '—'}
                      </td>
                    )}
                    {tabType === 'tedarikci' && (
                      <td className="p-2 text-center hidden md:table-cell">
                        {urun.marka || '—'}
                      </td>
                    )}

                    <td className="p-2 text-center text-red-600 dark:text-red-300 hidden md:table-cell">
                      {new Intl.NumberFormat('tr-TR', {
                        minimumFractionDigits: urun.tedarik_fiyati % 1 === 0 ? 0 : 2,
                        maximumFractionDigits: 2,
                      }).format(urun.tedarik_fiyati)} ₺
                    </td>
                    <td className="p-2 text-center text-green-700 dark:text-green-300">
                      {new Intl.NumberFormat('tr-TR', {
                        minimumFractionDigits: urun.satis_fiyati % 1 === 0 ? 0 : 2,
                        maximumFractionDigits: 2,
                      }).format(urun.satis_fiyati)} ₺
                    </td>
                    <td className="p-2 text-center">
                      %{((urun.satis_fiyati - urun.tedarik_fiyati) / urun.satis_fiyati * 100)
                        .toFixed(2)
                        .replace('.', ',')}
                    </td>
                    <td className={`p-2 text-center hidden md:table-cell ${
                      urun.kritik_stok != null && Number(urun.stok_miktari) <= Number(urun.kritik_stok)
                        ? 'text-red-500'
                        : ''
                    }`}>
                      {new Intl.NumberFormat('tr-TR').format(Math.floor(Number(urun.stok_miktari)))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">Kayıt bulunamadı</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td className="hidden md:table-cell"></td>
                <td className="hidden md:table-cell"></td>
                <td className="p-4 text-right font-semibold">Beklenen Kar:</td>
                <td className="p-4 text-center font-semibold text-green-700 dark:text-green-300">
                  %{ortalamaKarOrani.toFixed(2).replace('.', ',')}
                </td>
                <td className="hidden md:table-cell"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} className="max-w-[700px] m-4">
          <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white/90">Yeni Ürün Ekle</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">×</button>
            </div>

            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ürün Adı - tam genişlik */}
              <div className="md:col-span-2">
                <label htmlFor="isim" className="block text-sm font-medium text-gray-700 dark:text-white/80">Ürün Adı</label>
                <input
                  type="text"
                  name="isim"
                  id="isim"
                  value={form.isim}
                  onChange={handleFormChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded dark:border-white/10 dark:bg-white/[0.05] dark:text-white/90"
                />
              </div>

              <div>
                <label htmlFor="tedarikci_id" className="block text-sm font-medium text-gray-700 dark:text-white/80">Tedarikçi</label>
                <select
                  name="tedarikci_id"
                  id="tedarikci_id"
                  value={(form as any).tedarikci_id || ""}
                  onChange={handleSelectChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded dark:border-white/10 dark:bg-white/[0.05] dark:text-white/90"
                >
                  <option value="" className="bg-white dark:bg-gray-700 text-black dark:text-white">Tedarikçi Seçiniz</option>
                  {tedarikciler.map((tedarikci) => (
                    <option key={tedarikci.id} value={tedarikci.id} className="bg-white dark:bg-gray-700 text-black dark:text-white">
                      {tedarikci.unvan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tedarikci_id" className="block text-sm font-medium text-gray-700 dark:text-white/80">Ürün Kodu</label>
                <input
                  type="text"
                  name="kod"
                  id="kod"
                  value={form.kod}
                  readOnly
                  disabled
                  className="w-full p-2 border border-gray-300 rounded dark:border-white/10 dark:bg-white/[0.05] dark:text-white/90"
                />
              </div>

              {/* Diğer inputlar - 2'li kolon yapısı */}
              {[
                { name: "marka", label: "Marka" },
                { name: "cesit", label: "Çeşit" },
                { name: "birim", label: "Birim" },
                { name: "tedarik_fiyati", label: "Tedarik Fiyatı" },
                { name: "satis_fiyati", label: "Satış Fiyatı" },
                { name: "stok_miktari", label: "Stok Miktarı" },
                { name: "kritik_stok", label: "Kritik Stok" },
                { name: "kdv_orani", label: "KDV Oranı" },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-white/80">{label}</label>
                  <input
                    type="text"
                    name={name}
                    id={name}
                    value={(form as any)[name]}
                    onChange={handleFormChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded dark:border-white/10 dark:bg-white/[0.05] dark:text-white/90"
                  />
                </div>
              ))}

              {/* Aktif toggle */}
              <div className="md:col-span-2 flex items-center gap-4 mt-2">
                <label htmlFor="aktif" className="text-sm font-medium text-gray-700 dark:text-white/80">Aktif</label>
                <div className="relative w-12 h-6">
                  <input
                    type="checkbox"
                    name="aktif"
                    id="aktif"
                    checked={form.aktif}
                    onChange={handleFormChange}
                    className={`toggle-checkbox absolute block w-6 h-6 rounded-full border-4 appearance-none cursor-pointer top-0 left-0 transition-transform duration-300 ease-in-out
                      ${form.aktif ? 'bg-green-500 translate-x-6' : 'bg-white'}
                    `}
                  />
                  <div className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                </div>
              </div>

              {/* Butonlar */}
              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white rounded">
                  Vazgeç
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </Modal>

        <Modal isOpen={showStokModal} onClose={() => setShowStokModal(false)} className="max-w-[700px] m-4">
          <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white/90">Stok Ekle</h2>
              <button onClick={() => setShowStokModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">×</button>
            </div>

            <form onSubmit={handleStokSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 relative">
                <label htmlFor="urun_ara" className="block text-sm font-medium text-gray-700 dark:text-white/80">Ürün Ara ve Seç</label>
                <input
                  type="text"
                  name="urun_ara"
                  id="urun_ara"
                  value={urunQuery}
                  onChange={handleUrunQueryChange}
                  placeholder="Ürün ismi girin..."
                  className="w-full p-2 border border-gray-300 rounded dark:border-white/10 dark:bg-white/[0.05] dark:text-white/90"
                />

                {urunQuery && stokUrunAdaylari.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 dark:text-white/90 rounded shadow-lg">
                    {stokUrunAdaylari.map((urun) => (
                      <li
                        key={urun.id}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-white/10 cursor-pointer"
                        onClick={() => {
                          setStokForm((prev) => ({ ...prev, urun_id: urun.id.toString() }));
                          setUrunQuery(urun.isim); // input'ta ismi göster
                          setStokUrunAdaylari([]); // listeyi gizle
                        }}
                      >
                        {urun.isim}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="miktar" className="block text-sm font-medium text-gray-700 dark:text-white/80">Eklenecek Miktar</label>
                <input
                  type="text"
                  name="miktar"
                  id="miktar"
                  value={Number(stokForm.miktar || "0").toLocaleString('tr-TR')}
                  onChange={handleStokFormChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded dark:border-white/10 dark:bg-white/[0.05] dark:text-white/90"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowStokModal(false)} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white rounded">
                  Vazgeç
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  Stok Ekle
                </button>
              </div>
            </form>
          </div>
        </Modal>

        <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} className="max-w-[600px] m-4">
          <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white/90">Toplu Ürün Yükle</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">×</button>
            </div>

            <form onSubmit={handleBulkUpload} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  Excel veya CSV Dosyası seçilmelidir. Ayrıca Dosya içeriği sırasıyla "kod, isim, cesit, birim, tedarik_fiyati, satis_fiyati, stok_miktari, kritik_stok, aktif, marka, tedarikci" sütunlarından oluşmalıdır.
                </label>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white rounded"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Yükle
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </div>
  );
}