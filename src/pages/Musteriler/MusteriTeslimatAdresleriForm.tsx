import { useState, ChangeEvent, FormEvent } from 'react';
import axios from '../../api/axios';
import Button from '../../components/ui/button/Button';
import TeslimatAdresBaslikInput from '../../components/musteriler/TeslimatAdresBaslikInput';
import TeslimatAdresTextarea from '../../components/musteriler/TeslimatAdresTextarea';
import TeslimatAdresIlceInput from '../../components/musteriler/TeslimatAdresIlceInput';
import TeslimatAdresIlInput from '../../components/musteriler/TeslimatAdresIlInput';
import TeslimatAdresPostaKoduInput from '../../components/musteriler/TeslimatAdresPostaKoduInput';

interface TeslimatAdresi {
  id?: number;
  musteri_id?: number;
  baslik: string;
  adres: string;
  ilce?: string;
  il?: string;
  posta_kodu?: string;
}

type ControlledProps = {
  controlled: true;
  form: TeslimatAdresi;
  musteriId: number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

type UncontrolledProps = {
  controlled?: false;
  form?: TeslimatAdresi;
  musteriId: number;
  onSuccess?: () => void;
};

type MusteriTeslimatAdresleriFormProps = ControlledProps | UncontrolledProps;

export default function MusteriTeslimatAdresleriForm(props: MusteriTeslimatAdresleriFormProps) {
  const [internalForm, setInternalForm] = useState<TeslimatAdresi>(
    props.form ?? { baslik: '', adres: '', ilce: '', il: '', posta_kodu: '' }
  );
  const [submitting, setSubmitting] = useState(false); // 👈 eklendi

  const finalForm = props.controlled ? props.form : internalForm;

  const handleInternalChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInternalForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;          // çift tıklama koruması
    try {
      setSubmitting(true);           // loading başlat

      if (finalForm.id) {
        await axios.put(
          `/v1/musteriler/${props.musteriId}/teslimat-adresleri/${finalForm.id}`,
          finalForm
        );
      } else {
        await axios.post(
          `/v1/musteriler/${props.musteriId}/teslimat-adresleri`,
          { ...finalForm, musteri_id: props.musteriId }
        );
      }

      if (!props.controlled) {
        props.onSuccess?.();
        // yeni kayıt ise formu temizlemek istersen:
        // setInternalForm({ baslik: '', adres: '', ilce: '', il: '', posta_kodu: '' });
      }
    } catch (err: any) {
      console.error('Kayıt hatası:', err?.response?.data || err?.message);
      // burada toast gösterebilirsin
    } finally {
      setSubmitting(false);          // loading kapat
    }
  };


  return (
    <form onSubmit={props.controlled ? undefined : handleSubmit}>
      <div className="space-y-1">
        <div className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Teslimat Adresi Bilgileri
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TeslimatAdresBaslikInput
                value={finalForm.baslik}
                onChange={props.controlled ? props.onChange : handleInternalChange}
                />
                <TeslimatAdresIlceInput
                    value={finalForm.ilce ?? ''}
                    onChange={props.controlled ? props.onChange : handleInternalChange}
                />
                <TeslimatAdresIlInput
                    value={finalForm.il ?? ''}
                    onChange={props.controlled ? props.onChange : handleInternalChange}
                />
                <TeslimatAdresPostaKoduInput
                    value={finalForm.posta_kodu ?? ''}
                    onChange={props.controlled ? props.onChange : handleInternalChange}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
               <TeslimatAdresTextarea
                value={finalForm.adres}
                onChange={props.controlled ? props.onChange : handleInternalChange}
              />
            </div>
          </div>
        </div>

        {!props.controlled && (
          <div className="flex justify-end mt-4">
            <Button
                className="w-full"
                variant="primary"
                size="sm"
                type="submit"          // 👈 kritik
                loading={submitting}   // 👈 spinner + disable
                disabled={submitting}  // (opsiyonel, loading zaten disable ediyor)
              >
                {'Kaydet'}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}