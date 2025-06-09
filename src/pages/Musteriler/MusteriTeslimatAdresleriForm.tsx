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

  const finalForm = props.controlled ? props.form : internalForm;

  const handleInternalChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInternalForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const request = finalForm.id
      ? axios.put(`/v1/musteriler/${props.musteriId}/teslimat-adresleri/${finalForm.id}`, finalForm)
      : axios.post(`/v1/musteriler/${props.musteriId}/teslimat-adresleri`, { ...finalForm, musteri_id: props.musteriId });

    request.then(() => {
      props.onSuccess?.();
    });
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
            <Button type="submit" size="md" variant="primary">
              {'Kaydet'}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}