import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { Modal } from "../../components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import TedarikciGenelFaturaForm from './TedarikciGenelFaturaForm';
import SiparisListesi from '../Siparisler/SiparisListesi'; // aynı component kullanılabilir

interface Tedarikci {
  id: number;
  unvan: string;
  vergi_dairesi?: string;
  vergi_no?: string;
  telefon?: string;
  email?: string;
  adres?: string;
  yetkili_ad?: string;
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
            {/* GENEL BİLGİLER */}
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mb-3">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                    Genel Bilgiler
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-x-12 2xl:gap-x-20">
                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Vergi Dairesi:
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {tedarikci.vergi_dairesi ?? '-'}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Vergi No:
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {tedarikci.vergi_no ?? '-'}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Adres:
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {tedarikci.adres ?? '-'}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Yetkili:
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {tedarikci.yetkili_ad ?? '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openModal('faturaEdit')}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                >
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                      fill=""
                    />
                  </svg>
                  Düzenle
                </button>
              </div>
            </div>
            <Modal isOpen={isModalOpen('faturaEdit')} onClose={closeModal} className="max-w-[700px] m-4">
              <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <TedarikciGenelFaturaForm
                    tedarikci={tedarikci}
                    onSuccess={() => {
                    handleSuccess();
                    closeModal();
                    }}
                />
              </div>
            </Modal>














        </TabsContent>

        <TabsContent value="siparisler">
          <SiparisListesi tedarikciId={tedarikci.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}