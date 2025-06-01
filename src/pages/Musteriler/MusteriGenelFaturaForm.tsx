import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from '../../api/axios';
import Button from "../../components/ui/button/Button";
import UnvanInput from '../../components/musteriler/UnvanInput';
import TelefonInput from '../../components/musteriler/TelefonInput';
import EmailInput from '../../components/musteriler/EmailInput';
import AdresTextarea from '../../components/musteriler/AdresTextarea';
import SegmentSelect from '../../components/musteriler/SegmentSelect';
import TurSelect from '../../components/musteriler/TurSelect';
import AktifSwitch from '../../components/musteriler/AktifSwitch';
import VergiNoInput from '../../components/musteriler/VergiNoInput';
import VergiDairesiInput from '../../components/musteriler/VergiDairesiInput';

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

interface MusteriGenelFaturaFormProps {
  musteri?: Musteri; // Modal için
  onSuccess?: () => void; // Modal için
  form?: Musteri; // Controlled için
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTelefonChange?: (val: string) => void;
  controlled?: boolean; // hangi modda çalıştığını belirtir
}

export default function MusteriGenelFaturaForm({
  musteri,
  onSuccess,
  form,
  onChange,
  onTelefonChange,
  controlled = false
}: MusteriGenelFaturaFormProps) {

  const [internalForm, setInternalForm] = useState<Musteri>({
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
      setInternalForm({ ...musteri });
    }
  }, [musteri]);

  const finalForm = controlled ? form! : internalForm;

  const handleInternalChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setInternalForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleInternalTelefonChange = (val: string) => {
    setInternalForm(prev => ({
      ...prev,
      telefon: val,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      if (musteri) {
        await axios.put(`/v1/musteriler/${musteri.id}`, internalForm, config);
      } else {
        await axios.post('/v1/musteriler', internalForm, config);
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Kayıt hatası:', err.response?.data || err.message);
    }
  };

  return (
    <form onSubmit={controlled ? undefined : handleSubmit}>
      <div className="space-y-1">
        <div className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Genel ve Fatura Bilgileri
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <UnvanInput value={finalForm.unvan} onChange={controlled ? onChange! : handleInternalChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VergiDairesiInput value={finalForm.vergi_dairesi || ''} onChange={controlled ? onChange! : handleInternalChange} />
              <VergiNoInput value={finalForm.vergi_no || ''} onChange={controlled ? onChange! : handleInternalChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SegmentSelect value={finalForm.musteri_tur_id ?? ''} onChange={controlled ? onChange! : handleInternalChange} />
              <TurSelect value={finalForm.tur} onChange={controlled ? onChange! : handleInternalChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <AdresTextarea value={finalForm.adres || ''} onChange={controlled ? onChange! : handleInternalChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TelefonInput value={finalForm.telefon || ''} onChange={controlled ? onTelefonChange! : handleInternalTelefonChange} />
              <EmailInput value={finalForm.email || ''} onChange={controlled ? onChange! : handleInternalChange} />
              <AktifSwitch checked={finalForm.aktif} onChange={controlled ? onChange! : handleInternalChange} />
            </div>
          </div>
        </div>

        {!controlled && (
          <div className="flex justify-end">
            <Button type="submit" size="md" variant="primary">
              {'Kaydet'}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}