import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from '../../api/axios';
import MusteriYetkililerForm from './MusteriYetkililerForm';

import UnvanInput from '../../components/musteriler/UnvanInput';
import TelefonInput from '../../components/musteriler/TelefonInput';
import EmailInput from '../../components/musteriler/EmailInput';
import AdresTextarea from '../../components/musteriler/AdresTextarea';
import SegmentSelect from '../../components/musteriler/SegmentSelect';
import TurSelect from '../../components/musteriler/TurSelect';
import AktifSwitch from '../../components/musteriler/AktifSwitch';
import VergiNoInput from '../../components/musteriler/VergiNoInput';
import VergiDairesiInput from '../../components/musteriler/VergiDairesiInput';
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
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Genel ve Fatura Bilgileri
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <UnvanInput value={form.unvan} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VergiDairesiInput value={form.vergi_dairesi || ''} onChange={handleChange} />
              <VergiNoInput value={form.vergi_no || ''} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SegmentSelect value={form.musteri_tur_id ?? ''} onChange={handleChange} />
            <TurSelect value={form.tur} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <AdresTextarea value={form.adres || ''} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TelefonInput value={form.telefon || ''} onChange={handleTelefonChange} />
              <EmailInput value={form.email || ''} onChange={handleChange} />
              <AktifSwitch checked={form.aktif} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 mb-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Yetkili Bilgileri
            </h4>
            <MusteriYetkililerForm yetkili={musteri} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="md"
          variant="primary"
        >
          {musteri ? 'Güncelle' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}