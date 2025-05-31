import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from '../../api/axios';

import YetkiliAdSoyadInput from '../../components/musteriler/YetkiliAdSoyadInput';
import YetkiliTelefonInput from '../../components/musteriler/YetkiliTelefonInput';
import YetkiliEmailInput from '../../components/musteriler/YetkiliEmailInput';
import YetkiliPozisyonInput from '../../components/musteriler/YetkiliPozisyonInput';
import Button from "../../components/ui/button/Button";

interface Yetkili {
  id?: number;
  musteri_id?: number;
  isim: string;
  telefon?: string;
  email?: string;
  pozisyon?: string;
}

interface MusteriFormProps {
  yetkili?: Yetkili;
  onSuccess?: () => void;
}

export default function MusteriForm({ yetkili, onSuccess }: MusteriFormProps) {
  const [form, setForm] = useState<Yetkili>({
    isim: '',
    telefon: '',
    email: '',
    pozisyon: '',
  });

  useEffect(() => {
    if (yetkili) {
      setForm({ ...yetkili });
    }
  }, [yetkili]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };

      if (yetkili) {
        await axios.put(`/v1/musteriler/${yetkili.id}`, form, config);
      } else {
        await axios.post('/v1/musteriler', form, config);
      }

      onSuccess?.();
    } catch (err: any) {
      console.error('Kayıt hatası:', err.response?.data || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="p-5 mb-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Genel ve Fatura Bilgileri
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <YetkiliAdSoyadInput value={form.isim || ''} onChange={handleChange} />
              <YetkiliTelefonInput value={form.telefon || ''} onChange={handleTelefonChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <YetkiliEmailInput value={form.email ?? ''} onChange={handleChange} />
            <YetkiliPozisyonInput value={form.pozisyon ?? ''} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="md"
          variant="primary"
        >
          {yetkili ? 'Güncelle' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}