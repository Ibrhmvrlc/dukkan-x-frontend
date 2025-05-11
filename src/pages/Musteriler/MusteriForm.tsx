import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

import UnvanInput from '../../components/musteriler/UnvanInput';
import TelefonInput from '../../components/musteriler/TelefonInput';
import EmailInput from '../../components/musteriler/EmailInput';
import AdresTextarea from '../../components/musteriler/AdresTextarea';
import TurSelect from '../../components/musteriler/TurSelect';
import SegmentSelect from '../../components/musteriler/SegmentSelect';
import AktifSwitch from '../../components/musteriler/AktifSwitch';
import VergiNoInput from '../../components/musteriler/VergiNoInput';
import VergiDairesiInput from '../../components/musteriler/VergiDairesiInput';
import Button from "../../components/ui/button/Button";

interface Musteri {
  id?: number;
  unvan: string;
  telefon?: string;
  email?: string;
  adres?: string;
  tur: 'bireysel' | 'kurumsal';
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
    telefon: '',
    email: '',
    adres: '',
    tur: 'bireysel',
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
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <UnvanInput value={form.unvan} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VergiNoInput value={form.vergi_no || ''} onChange={handleChange} />
        <VergiDairesiInput value={form.vergi_dairesi || ''} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <AdresTextarea value={form.adres || ''} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TelefonInput value={form.telefon || ''} onChange={handleChange} />
        <EmailInput value={form.email || ''} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TurSelect value={form.tur} onChange={handleChange} />
        <SegmentSelect value={form.musteri_tur_id ?? ''} onChange={handleChange} />
      </div>
      
     
      <AktifSwitch checked={form.aktif} onChange={handleChange} />

      <div>
        <Button
              size="md"
              variant="primary"
            >
              {musteri ? 'Güncelle' : 'Kaydet'}
            </Button>
      </div>
    </form>
  );
}