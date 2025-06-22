import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from '../../api/axios';
import Button from "../../components/ui/button/Button";

import YetkiliAdSoyadInput from '../../components/musteriler/YetkiliAdSoyadInput';
import YetkiliTelefonInput from '../../components/musteriler/YetkiliTelefonInput';
import YetkiliEmailInput from '../../components/musteriler/YetkiliEmailInput';
import YetkiliPozisyonInput from '../../components/musteriler/YetkiliPozisyonInput';

// Yetkili modelin
interface Yetkili {
  id?: number;
  musteri_id?: number;
  isim: string;
  telefon?: string;
  email?: string;
  pozisyon?: string;
}

// Controlled props (ana form için)
type ControlledProps = {
  controlled: true;
  form: Yetkili;
  musteriId: number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTelefonChange: (val: string) => void;
};

// Uncontrolled props (modal için)
type UncontrolledProps = {
  controlled?: false;
  form?: Yetkili;
  musteriId: number;
  onSuccess?: () => void;
};

// Final birleşik props
type MusteriYetkililerFormProps = ControlledProps | UncontrolledProps;

export default function MusteriYetkililerForm(props: MusteriYetkililerFormProps) {
  const [internalForm, setInternalForm] = useState<Yetkili>({
    isim: '',
    telefon: '',
    email: '',
    pozisyon: '',
    musteri_id: props.musteriId
  });

  // props.form değiştiğinde internalForm'u güncelle (uncontrolled modda)
  useEffect(() => {
    if (!props.controlled && props.form) {
      setInternalForm({ ...props.form, musteri_id: props.musteriId });
    }
  }, [props.form, props.musteriId, props.controlled]);

  // Form verisini unified şekilde alıyoruz
  const finalForm: Yetkili = props.controlled 
  ? (props.form ?? { isim: '', telefon: '', email: '', pozisyon: '', musteri_id: props.musteriId })
  : internalForm;

  const handleInternalChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setInternalForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' && 'checked' in e.target
        ? (e.target as HTMLInputElement).checked
        : value,
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

      if (internalForm.id) {
        // Güncelleme (PUT)
        await axios.put(`/v1/yetkililer/${internalForm.id}`, internalForm, config);
      } else {
        // Yeni kayıt (POST)
        await axios.post(`/v1/yetkililer`, { ...internalForm, musteri_id: props.musteriId }, config);
      }

      !props.controlled && props.onSuccess?.();
    } catch (err: any) {
      console.error('Kayıt hatası:', err.response?.data || err.message);
    }
  };

  return (
    <form onSubmit={props.controlled ? undefined : handleSubmit}>
      <div className="space-y-1">
        <div className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Yetkili Bilgileri
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <YetkiliAdSoyadInput 
                value={finalForm.isim} 
                onChange={props.controlled ? props.onChange : handleInternalChange} 
              />
              <YetkiliTelefonInput 
                value={finalForm.telefon ?? ''} 
                onChange={props.controlled ? props.onTelefonChange : handleInternalTelefonChange} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <YetkiliEmailInput 
                value={finalForm.email ?? ''} 
                onChange={props.controlled ? props.onChange : handleInternalChange} 
              />
              <YetkiliPozisyonInput 
                value={finalForm.pozisyon ?? ''} 
                onChange={props.controlled ? props.onChange : handleInternalChange} 
              />
            </div>
          </div>
        </div>

        {!props.controlled && (
          <div className="flex justify-end">
            <Button size="md" variant="primary">
              {'Kaydet'}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}