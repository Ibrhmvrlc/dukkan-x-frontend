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
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          {/* Sol taraf */}
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img src="/images/user/owner.jpg" alt="user" />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {tedarikci.unvan}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <a href={`mailto:${tedarikci.email}`}>{tedarikci.email}</a>
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <a href={`tel:${tedarikci.telefon}`}>{tedarikci.telefon}</a>
                </p>
              </div>
            </div>
          </div>
          <Link to="/tedarikciler" className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600">
            <svg className="fill-current w-5 h-5" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12.707 14.707a1 1 0 010-1.414L9.414 10l3.293-3.293a1 1 0 10-1.414-1.414l-4 4a1 1 0 000 1.414l4 4a1 1 0 001.414 0z" />
            </svg>
            Geri
          </Link>
        </div>
      </div>  
      <Tabs defaultValue="ozet" className="w-full">
        <div className="">
          <TabsList className="grid grid-cols-4 text-center">
            <TabsTrigger value="ozet"
              className="w-full px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-colors"
            >Genel</TabsTrigger>
            <TabsTrigger value="siparisler"
              className="w-full px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-colors"
            >Siparişler</TabsTrigger>
          </TabsList>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-b-xl p-6 rounded-xl">
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
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                    Tedarikçi Bilgileri
                  </h4>
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
            <div className="flex flex-col items-center justify-center text-center px-6 py-12 bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-inner border border-dashed border-gray-300 dark:border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-white/20 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2a4 4 0 014-4h5.586a1 1 0 00.707-1.707l-3.586-3.586A1 1 0 0015.586 5H9a2 2 0 00-2 2v10" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7h4v12H3z" />
              </svg>

              <h2 className="text-2xl font-bold mb-2 text-gray-700 dark:text-white">
                Tedarikçi Sipariş Sayfası Çok Yakında!
              </h2>

              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-6">
                Bu bölüm, çok yakında devreye alınacak güçlü bir entegrasyon sayesinde aktif hale gelecektir. Geliştirilen sistem, tedarikçilerinizin kesmiş olduğu faturaları otomatik olarak algılayacak ve bu faturalara göre stoklarınıza otomatik ürün girişleri sağlayacaktır.
              </p>

              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-6">
                Böylece manuel stok takibiyle zaman kaybetmeye son verilecek. Aynı zamanda her tedarikçiye ait finansal işlemler izlenebilir hale gelecek ve karşılıklı cari hesaplar sistemli şekilde yönetilecektir. 
              </p>

              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-6">
                Kısacası bu sayfa; stok yönetiminizi otomatikleştiren, hataları en aza indiren ve muhasebe süreçlerinizi dijitalleştirerek size ciddi zaman ve maliyet avantajı sağlayacak profesyonel bir kontrol paneli olacaktır.
              </p>

              <span className="text-sm text-gray-400 dark:text-gray-600 italic">
                (Sayfa, fatura entegrasyon süreci tamamlandığında aktif hale gelecektir.)
              </span>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}