import { useState } from "react";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import CustomerSelect from "../../components/selects/CustomerSelect";
import { toast } from "react-toastify";
import LoadingButton from "../../components/ui/button/LoadingButton";

type Form = {
  musteri_id: number | null;
  tarih: string;
  tutar: string | number;
  kanal?: string;
  referans_no?: string;
  aciklama?: string;
  selectedCustomer?: any | null;
};

export default function TahsilatEklePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>({
    musteri_id: null,
    tarih: new Date().toISOString().split("T")[0],
    tutar: "",
    kanal: "",
    referans_no: "",
    aciklama: "",
    selectedCustomer: null,
  });

  const submit = async () => {
    const t = Number(form.tutar);
    if (!form.musteri_id) {
      toast.error("Müşteri seçin.");
      return;
    }
    if (!t || t <= 0) {
      toast.error("Geçerli bir tutar girin.");
      return;
    }
    if (!form.kanal?.trim()) {
      toast.error("Kanal girilmesi zorunludur.");
      return;
    }
    if (!form.referans_no?.trim()) {
      toast.error("Belge No girilmesi zorunludur.");
      return;
    }

    try {
      setSaving(true);
      await axios.post(`/v1/musteriler/${form.musteri_id}/tahsilatlar`, {
        tarih: form.tarih,
        tutar: t,
        kanal: form.kanal,
        referans_no: form.referans_no,
        aciklama: form.aciklama || null,
      });
      toast.success("Tahsilat eklendi.");
      navigate(`/musteriler/${form.musteri_id}/duzenle`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-6 dark:bg-gray-900 dark:text-gray-100 dark:border-white/20">
        <h1 className="text-2xl font-semibold">Tahsilat Ekle</h1>
        <p className="text-gray-500">Müşteri seçin, detayı girin, kaydedin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Müşteri seçimi (geniş alan) */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-4 shadow-sm dark:bg-gray-900 dark:text-gray-100 dark:border-white/20">
          <label className="block text-sm font-medium mb-2">Müşteri</label>
          <CustomerSelect
            value={form.musteri_id}
            onChange={(id, selected) =>
              setForm((f) => ({ ...f, musteri_id: id, selectedCustomer: selected || null }))
            }
            placeholder="İsim/ünvan/telefon/email ile ara…"
            onlyActive
          />
          {form.selectedCustomer && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-100">
              <div className="font-medium">
                {(form.selectedCustomer.unvan ||
                  form.selectedCustomer.isim ||
                  form.selectedCustomer.name) ?? `#${form.musteri_id}`}
              </div>
              <div className="text-xs">
                {form.selectedCustomer.telefon || ""}{" "}
                {form.selectedCustomer.email ? `• ${form.selectedCustomer.email}` : ""}
              </div>
            </div>
          )}
        </div>

        {/* Sağ: Tahsilat detayları */}
        <div className="bg-white border rounded-xl p-4 shadow-sm dark:bg-gray-900 dark:text-gray-100 dark:border-white/20">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tarih</label>
              <input
                type="date"
                value={form.tarih}
                onChange={(e) => setForm((f) => ({ ...f, tarih: e.target.value }))}
                className="w-full border p-2 rounded-lg dark:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tutar</label>
              <input
                type="number"
                step="0.01"
                value={form.tutar}
                onChange={(e) => setForm((f) => ({ ...f, tutar: e.target.value }))}
                className="w-full border p-2 rounded-lg dark:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kanal</label>
              <input
                type="text"
                required   // ✅ tarayıcı bazlı kontrol
                placeholder="Nakit, Havale/EFT, Kredi Kartı"
                value={form.kanal}
                onChange={(e) => setForm((f) => ({ ...f, kanal: e.target.value }))}
                className="w-full border p-2 rounded-lg dark:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Belge No</label>
              <input
                type="text"
                required   // ✅ tarayıcı bazlı kontrol
                value={form.referans_no}
                onChange={(e) => setForm((f) => ({ ...f, referans_no: e.target.value }))}
                className="w-full border p-2 rounded-lg dark:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Açıklama</label>
              <input
                type="text"
                value={form.aciklama}
                onChange={(e) => setForm((f) => ({ ...f, aciklama: e.target.value }))}
                className="w-full border p-2 rounded-lg dark:border-white/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alt sabit aksiyon çubuğu (alanı iyi kullanma + hızlı kayıt) */}
      <div className="sticky mt-8 backdrop-blur bg-white border rounded-xl p-4 shadow-sm dark:bg-gray-900 dark:text-gray-100 dark:border-white/20">
        <div className="max-w-8xl mx-auto p-4 flex items-center justify-end gap-3">
          <button
            onClick={() => history.back()}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 dark:border-white/20"
          >
            İptal
          </button>
           <LoadingButton full onClick={submit} disabled={saving}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
           </LoadingButton>
        </div>
      </div>
    </div>
  );
}