import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { Modal } from "../../components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import TedarikciGenelFaturaForm from './TedarikciGenelFaturaForm';
import TedarikciYetkililerForm from './TedarikciYetkililerForm';
import SiparisListesi from '../Siparisler/SiparisListesi'; // aynı component kullanılabilir

interface Tedarikci {
  id: number;
  unvan: string;
  vergi_dairesi?: string;
  vergi_no?: string;
  telefon?: string;
  email?: string;
  adres?: string;
  yetkililer?: Yetkili[];
}

interface Yetkili {
  id?: number;
  tedarikci_id?: number;
  isim: string;
  telefon?: string;
  email?: string;
  pozisyon?: string;
}

export function useModal() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const openModal = (modalId: string) => setActiveModal(modalId);
  const closeModal = () => setActiveModal(null);
  const isModalOpen = (modalId: string) => activeModal === modalId;
  return { activeModal, openModal, closeModal, isModalOpen };
}

export default function TedarikciEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tedarikci, setTedarikci] = useState<Tedarikci>({
    id: 0,
    unvan: '',
    telefon: '',
    email: '',
    adres: '',
  });

  const { openModal, closeModal, isModalOpen } = useModal();

  useEffect(() => {
    setLoading(true);
    axios.get(`/v1/tedarikciler/${id}`).then((res) => {
      setTedarikci(res.data.data);
      setLoading(false);
    }).catch((err) => {
      console.error("Tedarikçi verisi alınamadı:", err);
      setLoading(false);
    });
  }, [id]);

  const handleSuccess = () => {
    navigate(0); // sayfayı yenile
  };

  const handleYetkiliDelete = async (yetkiliId: number | undefined) => {
    if (!yetkiliId) return;
    const confirmDelete = window.confirm("Yetkili silinsin mi?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`/v1/yetkililer/${yetkiliId}`);
      handleSuccess();
    } catch (err) {
      console.error('Yetkili silme hatası:', err);
    }
  };

  if (loading) {
    return <p>Yükleniyor...</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">{tedarikci.unvan}</h1>
        <p className="text-sm text-gray-500">{tedarikci.email} / {tedarikci.telefon}</p>
        <Link to="/tedarikciler">← Geri</Link>
      </div>

      <Tabs defaultValue="ozet">
        <TabsList>
          <TabsTrigger value="ozet">Genel</TabsTrigger>
          <TabsTrigger value="siparisler">Siparişler</TabsTrigger>
        </TabsList>

        <TabsContent value="ozet">
          <div className="p-4 border rounded-xl mb-4">
            <h2 className="font-semibold mb-2">Fatura Bilgileri</h2>
            <p>Vergi Dairesi: {tedarikci.vergi_dairesi ?? '-'}</p>
            <p>Vergi No: {tedarikci.vergi_no ?? '-'}</p>
            <p>Adres: {tedarikci.adres ?? '-'}</p>
            <button onClick={() => openModal('faturaEdit')}>Düzenle</button>
            <Modal isOpen={isModalOpen('faturaEdit')} onClose={closeModal}>
                <TedarikciGenelFaturaForm
                    tedarikci={tedarikci}
                    onSuccess={() => {
                    handleSuccess();
                    closeModal();
                    }}
                />
            </Modal>
          </div>

          <div className="p-4 border rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Yetkililer</h2>
              <button onClick={() => openModal('yetkili-new')}>+ Ekle</button>
            </div>
            {tedarikci.yetkililer?.map((y) => (
              <div key={y.id} className="flex justify-between border-b py-2">
                <div>
                  <p>{y.isim}</p>
                  <p className="text-sm text-gray-500">{y.email} / {y.telefon}</p>
                </div>
                <div>
                  <button onClick={() => openModal(`yetkili-${y.id}`)}>Düzenle</button>
                  <button onClick={() => handleYetkiliDelete(y.id)}>Sil</button>
                </div>

                <Modal isOpen={isModalOpen(`yetkili-${y.id}`)} onClose={closeModal}>
                  <TedarikciYetkililerForm
                    tedarikciId={tedarikci.id}
                    form={y}
                    onSuccess={() => {
                      handleSuccess();
                      closeModal();
                    }}
                  />
                </Modal>
              </div>
            ))}

            <Modal isOpen={isModalOpen('yetkili-new')} onClose={closeModal}>
              <TedarikciYetkililerForm
                tedarikciId={tedarikci.id}
                onSuccess={() => {
                  handleSuccess();
                  closeModal();
                }}
              />
            </Modal>
          </div>
        </TabsContent>

        <TabsContent value="siparisler">
          <SiparisListesi tedarikciId={tedarikci.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}