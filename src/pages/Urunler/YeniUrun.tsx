import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import Button from "../../components/ui/button/Button"; // Eğer özel buton bileşenin varsa

export default function YeniUrun() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    kod: "",
    isim: "",
    cesit: "",
    birim: "",
    tedarik_fiyati: "",
    satis_fiyati: "",
    stok_miktari: "",
    kritik_stok: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/v1/urunler", {
        ...form,
        tedarik_fiyati: parseFloat(form.tedarik_fiyati),
        satis_fiyati: parseFloat(form.satis_fiyati),
        stok_miktari: parseInt(form.stok_miktari),
        kritik_stok: parseInt(form.kritik_stok)
      });
      navigate("/urunler");
    } catch (err: any) {
      console.error("Ürün eklenemedi:", err.response?.data || err.message);
      alert("Ürün eklenirken hata oluştu.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-white/[0.03] rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 dark:text-white/90">Yeni Ürün Ekle</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {[
          { name: "kod", label: "Ürün Kodu" },
          { name: "isim", label: "Ürün Adı" },
          { name: "cesit", label: "Ürün Çeşidi" },
          { name: "birim", label: "Birim (örneğin kg, adet...)" },
          { name: "tedarik_fiyati", label: "Tedarik Fiyatı" },
          { name: "satis_fiyati", label: "Satış Fiyatı" },
          { name: "stok_miktari", label: "Stok Miktarı" },
          { name: "kritik_stok", label: "Kritik Stok" }
        ].map(({ name, label }) => (
          <div key={name}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-white/90">
              {label}
            </label>
            <input
              type="text"
              id={name}
              name={name}
              value={(form as any)[name]}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-white/[0.05] dark:text-white/90 dark:border-white/10"
            />
          </div>
        ))}

        <div className="flex justify-end mt-4">
          <Button type="submit">Kaydet</Button>
        </div>
      </form>
    </div>
  );
}