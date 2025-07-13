import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from '../../api/axios';
import Button from "../../components/ui/button/Button";

import YetkiliAdSoyadInput from '../../components/tedarikciler/YetkiliAdSoyadInput';
import YetkiliTelefonInput from '../../components/tedarikciler/YetkiliTelefonInput';
import YetkiliEmailInput from '../../components/tedarikciler/YetkiliEmailInput';
import YetkiliPozisyonInput from '../../components/tedarikciler/YetkiliPozisyonInput';

// Yetkili modelin
interface Yetkili {
  id?: number;
  tedarikci_id?: number;
  isim: string;
  telefon?: string;
  email?: string;
  pozisyon?: string;
}

// Controlled props (ana form için)
type ControlledProps = {
  controlled: true;
  form: Yetkili;
  tedarikciId: number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTelefonChange: (val: string) => void;
};

// Uncontrolled props (modal için)
type UncontrolledProps = {
  controlled?: false;
  form?: Yetkili;
  tedarikciId: number;
  onSuccess?: () => void;
};

// Final birleşik props
type TedarikciYetkililerFormProps = ControlledProps | UncontrolledProps;

export default function TedarikciYetkililerForm(props: TedarikciYetkililerFormProps) {
  const [internalForm, setInternalForm] = useState<Yetkili>({
    isim: '',
    telefon: '',
    email: '',
    pozisyon: '',
    tedarikci_id: props.tedarikciId
  });

  useEffect(() => {
    if (!props.controlled && props.form) {
      setInternalForm({ ...props.form, tedarikci_id: props.tedarikciId });
    }
  }, [props.form, props.tedarikciId, props.controlled]);

  const finalForm: Yetkili = props.controlled 
    ? (props.form ?? { isim: '', telefon: '', email: '', pozisyon: '', tedarikci_id: props.tedarikciId })
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
        await axios.put(`/v1/yetkililer/${internalForm.id}`, internalForm, config);
      } else {
        await axios.post(`/v1/yetkililer`, { ...internalForm, tedarikci_id: props.tedarikciId }, config);
      }

      !props.controlled && props.onSuccess?.();
    } catch (err: any) {
      console.error('Kayıt hatası:', err.response?.data || err.message);
    }
  };

  return (
    <form onSubmit={props.controlled ? undefined : handleSubmit}>
      <div className="space-y-1">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
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

        {!props.controlled && (
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