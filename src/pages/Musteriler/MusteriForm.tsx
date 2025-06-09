import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from '../../api/axios';
import MusteriYetkililerForm from './MusteriYetkililerForm';
import MusteriGenelFaturaForm from './MusteriGenelFaturaForm';
import MusteriTeslimatAdresleriForm from './MusteriTeslimatAdresleriForm';

import Button from "../../components/ui/button/Button";

interface TeslimatAdresi {
  id?: number;
  musteri_id?: number;
  baslik: string;
  adres: string;
  ilce?: string;
  il?: string;
  posta_kodu?: string;
}

interface Musteri {
  id?: number;
  unvan: string;
  tur: 'bireysel' | 'kurumsal';
  telefon?: string;
  email?: string;
  adres?: string;
  musteri_tur_id?: string | number | null;
  aktif: boolean;
  vergi_no?: string;
  vergi_dairesi?: string;
}

interface Yetkili {
  id?: number;
  musteri_id?: number;
  isim: string;
  telefon?: string;
  email?: string;
  pozisyon?: string;
}

interface MusteriFormProps {
  musteri?: Musteri;
  onSuccess?: () => void;
}

export default function MusteriForm({ musteri, onSuccess }: MusteriFormProps) {
  const [form, setForm] = useState<Musteri>({
    unvan: '',
    tur: 'bireysel',
    telefon: '',
    email: '',
    adres: '',
    musteri_tur_id: '',
    aktif: true,
    vergi_no: '',
    vergi_dairesi: '',
  });

  const [yetkili, setYetkili] = useState<Yetkili>({
    isim: '',
    telefon: '',
    email: '',
    pozisyon: '',
  });

  const [teslimatAdresi, setTeslimatAdresi] = useState<TeslimatAdresi>({
    baslik: '',
    adres: '',
    ilce: '',
    il: '',
    posta_kodu: ''
  });

  const handleTeslimatAdresiChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTeslimatAdresi(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleYetkiliChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setYetkili(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleYetkiliTelefonChange = (val: string) => {
    setYetkili(prev => ({
      ...prev,
      telefon: val,
    }));
  };

  useEffect(() => {
    if (musteri) {
      setForm({ ...musteri });
    }
  }, [musteri]);

  const handleTelefonChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      telefon: val,
    }));
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basit validasyon kontrolü
    if (!form.unvan || !yetkili.isim || !teslimatAdresi.baslik) {
        alert("Lütfen tüm zorunlu alanları doldurun.");
        return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };

      let musteriResponse;

      if (musteri) {
        musteriResponse = await axios.put(`/v1/musteriler/${musteri.id}`, form, config);
      } else {
        musteriResponse = await axios.post(`/v1/musteriler`, form, config);
      }

      const musteriId = musteriResponse.data.id ?? musteriResponse.data.data?.id;

      const { musteri_id: yetkiliMusteriId, ...yetkiliWithoutMusteriId } = yetkili;
      await axios.post(`/v1/yetkililer`, { ...yetkiliWithoutMusteriId, musteri_id: musteriId }, config);

      const { musteri_id: teslimatMusteriId, ...teslimatAdresiWithoutMusteriId } = teslimatAdresi;
      await axios.post(`/v1/musteriler/${musteriId}/teslimat-adresleri`, { ...teslimatAdresiWithoutMusteriId, musteri_id: musteriId }, config);

      onSuccess?.();

    } catch (err: any) {
      console.error("Kayıt hatası:", err.response?.data || err.message);
    }
};


  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="p-5 mb-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
              <MusteriGenelFaturaForm 
                form={form} 
                onChange={handleChange} 
                onTelefonChange={handleTelefonChange} 
                controlled 
              />
          </div>
        </div>
      </div>
      
      <div className="p-5 mb-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <MusteriYetkililerForm
              controlled
              form={yetkili}
              musteriId={musteri?.id ?? 0}
              onChange={handleYetkiliChange} 
              onTelefonChange={handleYetkiliTelefonChange}
            />
          </div>
        </div>
      </div>

      <div className="p-5 mb-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <MusteriTeslimatAdresleriForm
              controlled
              form={teslimatAdresi}
              musteriId={musteri?.id ?? 0}
              onChange={handleTeslimatAdresiChange}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="md"
          variant="primary"
        >
          {'Kaydet'}
        </Button>
      </div>
    </form>
  );
}