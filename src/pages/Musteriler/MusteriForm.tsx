import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from '../../api/axios';
import MusteriYetkililerForm from './MusteriYetkililerForm';
import MusteriGenelFaturaForm from './MusteriGenelFaturaForm';
import Button from "../../components/ui/button/Button";

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
  

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };

      if (musteri) {
        await axios.put(`/v1/musteriler/${musteri.id}`, form, config);
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
              musteriId={yetkili.musteri_id!}
              onChange={handleYetkiliChange} 
              onTelefonChange={handleYetkiliTelefonChange}
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