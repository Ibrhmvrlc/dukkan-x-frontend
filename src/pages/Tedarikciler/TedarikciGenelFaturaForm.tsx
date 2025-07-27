import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from '../../api/axios';
import Button from "../../components/ui/button/Button";
import UnvanInput from '../../components/tedarikciler/UnvanInput';
import TelefonInput from '../../components/tedarikciler/TelefonInput';
import EmailInput from '../../components/tedarikciler/EmailInput';
import AdresTextarea from '../../components/tedarikciler/AdresTextarea';
import VergiNoInput from '../../components/tedarikciler/VergiNoInput';
import VergiDairesiInput from '../../components/tedarikciler/VergiDairesiInput';
import YetkiliAdSoyadInput from '../../components/tedarikciler/YetkiliAdSoyadInput';

interface Tedarikci {
  id?: number;
  unvan: string;
  telefon?: string;
  email?: string;
  adres?: string;
  vergi_no?: string;
  vergi_dairesi?: string;
  yetkili_ad?: string;
}

interface TedarikciGenelFaturaFormProps {
  tedarikci?: Tedarikci; // Modal için
  onSuccess?: () => void; // Modal için
  form?: Tedarikci; // Controlled için
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTelefonChange?: (val: string) => void;
  controlled?: boolean;
}

export default function TedarikciGenelFaturaForm({
  tedarikci,
  onSuccess,
  form,
  onChange,
  onTelefonChange,
  controlled = false
}: TedarikciGenelFaturaFormProps) {
  const [internalForm, setInternalForm] = useState<Tedarikci>({
    unvan: '',
    telefon: '',
    email: '',
    adres: '',
    vergi_no: '',
    vergi_dairesi: ''
  });

  useEffect(() => {
    if (tedarikci) {
      setInternalForm({ ...tedarikci });
    }
  }, [tedarikci]);

  const finalForm = controlled ? form! : internalForm;

  const handleInternalChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInternalForm(prev => ({
      ...prev,
      [name]: value,
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
      if (tedarikci && tedarikci.id) {
        await axios.put(`/v1/tedarikciler/${tedarikci.id}`, internalForm, config);
      } else {
        await axios.post('/v1/tedarikciler', internalForm, config);
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
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <UnvanInput value={finalForm.unvan} onChange={controlled ? onChange! : handleInternalChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VergiDairesiInput value={finalForm.vergi_dairesi || ''} onChange={controlled ? onChange! : handleInternalChange} />
              <VergiNoInput value={finalForm.vergi_no || ''} onChange={controlled ? onChange! : handleInternalChange} />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <AdresTextarea value={finalForm.adres || ''} onChange={controlled ? onChange! : handleInternalChange} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <YetkiliAdSoyadInput value={finalForm.yetkili_ad || ''} onChange={controlled ? onChange! : handleInternalChange} />
              <TelefonInput value={finalForm.telefon || ''} onChange={controlled ? onTelefonChange! : handleInternalTelefonChange} />
              <EmailInput value={finalForm.email || ''} onChange={controlled ? onChange! : handleInternalChange} />
            </div>
          </div>
        </div>
        {!controlled && (
          <div className="flex justify-end mt-4">
            <Button size="md" variant="primary">
              Kaydet
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}