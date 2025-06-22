import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import MusteriForm from './MusteriForm';
import MusteriGenelFaturaForm from './MusteriGenelFaturaForm';
import MusteriYetkililerForm from './MusteriYetkililerForm';
import MusteriTeslimatAdresleriForm from './MusteriTeslimatAdresleriForm';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import SiparisListesi from '../../pages/Siparisler/SiparisListesi';


import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";

interface Tur {
  id: number;
  isim: string;
}

interface Yetkili {
  id?: number;
  musteri_id?: number;
  isim: string;
  telefon?: string;
  email?: string;
  pozisyon?: string;
}

interface TeslimatAdresi {
  id: number;
  baslik: string,
  adres: string;
  ilce?: string;
  il?: string;
  posta_kodu?: string;
}

interface Musteri {
  id?: number;
  unvan: string;
  telefon?: string;
  vergi_dairesi?: string;
  vergi_no?: string;
  email?: string;
  adres?: string;
  tur: string;
  musteri_tur_id: number | null;
  musteri_tur?: Tur; // İLİŞKİ BURADA
  aktif: boolean;
  yetkililer?: Yetkili[];
  teslimat_adresleri?: TeslimatAdresi[];
}

export function useModal() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (modalId: string) => setActiveModal(modalId);
  const closeModal = () => setActiveModal(null);
  const isModalOpen = (modalId: string) => activeModal === modalId;

  return { activeModal, openModal, closeModal, isModalOpen };
}

export default function MusteriEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [musteri, setMusteri] = useState<Musteri>({
    unvan: '',
    telefon: '',
    email: '',
    adres: '',
    tur: '',
    musteri_tur_id: null,
    musteri_tur: undefined, // optional alan
    aktif: true,
  });

  const [selectedAdres, setSelectedAdres] = useState<TeslimatAdresi | null>(null);

  const { openModal, closeModal, isModalOpen } = useModal();

  function capitalizeTurkish(text: string): string {
    return text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1);
  }

  useEffect(() => {
    setLoading(true); // her yeni ID geldiğinde tekrar loading başlasın
    axios.get(`/v1/musteriler/${id}`).then((res) => {
      setMusteri(res.data.data);
      setLoading(false);
    }).catch((err) => {
      console.error("Müşteri verisi alınamadı:", err);
      setLoading(false);
    });
  }, [id]);

  const handleSuccess = () => {
     navigate(0);
  };

  const handleDelete = async (yetkiliId: number | undefined) => {
    if (!yetkiliId) return; // id boşsa işlem yapma

    const confirmDelete = window.confirm("Bu yetkiliyi silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.delete(`/v1/yetkililer/${yetkiliId}`, config);

      // Silme başarılı → listeyi güncelle
      handleSuccess();
    } catch (err: any) {
      console.error('Silme hatası:', err.response?.data || err.message);
    }
  }

  const handleTADelete = async (TAId: number | undefined) => {
    if (!TAId) return; // id boşsa işlem yapma

    const confirmDelete = window.confirm("Bu teslimat adresini silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.delete(`/v1/musteriler/${musteri.id}/teslimat-adresleri/${TAId}`, config);

      // Silme başarılı → listeyi güncelle
      handleSuccess();
    } catch (err: any) {
      console.error('Silme hatası:', err.response?.data || err.message);
    }
  }

  if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <svg
              className="animate-spin h-10 w-10 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-gray-600 text-sm">Yükleniyor...</p>
          </div>
        </div>
      );
    }

  return (
    <>

    <div className="space-y-6">
      {/* PROFİL */}
      <div className="bg-white dark:bg-gray-900 p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          {/* Sol taraf */}
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img src="/images/user/owner.jpg" alt="user" />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {musteri.unvan}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {musteri?.musteri_tur?.isim ?? 'Tür bilgisi yok'}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {capitalizeTurkish(musteri.tur)}
                </p>
              </div>
            </div>
          </div>

          <Link to="/musteriler" className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600">
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
            <TabsTrigger
              value="ozet"
              className="w-full px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-colors"
            >
              Özet Bilgiler
            </TabsTrigger>
            <TabsTrigger
              value="siparisler"
              className="w-full px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-colors"
            >
              Siparişler
            </TabsTrigger>
            <TabsTrigger
              value="finans"
              className="w-full px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-colors"
            >
              Finans
            </TabsTrigger>
            <TabsTrigger
              value="destek"
              className="w-full px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-colors"
            >
              Destek
            </TabsTrigger>
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
                        Ünvan
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {musteri.unvan}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Telefon
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {musteri.telefon}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        E-posta
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {musteri.email}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Müşteri Sektörü
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {musteri?.musteri_tur?.isim ?? 'Tür bilgisi yok'}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Müşteri Türü
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {capitalizeTurkish(musteri.tur)}
                      </p>
                    </div>

                  </div>
                </div>
                <button
                  onClick={() => openModal('editGenel')}
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
            {/* FATURA BİLGİLERİ */}
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mb-3">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                    Fatura Bilgileri
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-x-12 2xl:gap-x-20">
                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Adres
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {musteri.adres}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Vergi Dairesi
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {musteri.vergi_dairesi}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Vergi Numarası
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {musteri.vergi_no}
                      </p>
                    </div>
                    
                  </div>
                </div>
                <button
                  onClick={() => openModal('editGenel')}
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
            <Modal isOpen={isModalOpen('editGenel')} onClose={closeModal} className="max-w-[700px] m-4">
              <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <MusteriGenelFaturaForm musteri={musteri} onSuccess={handleSuccess} />
              </div>
            </Modal>

            {/* YETKİLİ BİLGİLERİ */}
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mb-3">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Yetkili Bilgileri
                  </h4>

                  <button
                    onClick={() => openModal('editYetkili-new')}
                    className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Ekle
                  </button>
                </div>
          
                {musteri.yetkililer && musteri.yetkililer.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {musteri.yetkililer.map((yetkili, index) => (
                      <div key={yetkili.id} className="relative border p-4 rounded-xl bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">

                        {/* Sağ üst köşe icon grubu */}
                        <div className="absolute top-2 right-2 flex items-center gap-2">

                          {/* Düzenle İkon Butonu */}
                          <button
                            onClick={() => openModal(`editYetkili-${yetkili.id}`)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/[0.05]"
                            title="Düzenle"
                          >
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l3 3 8-8-3-3-8 8z" />
                            </svg>
                          </button>

                          {/* Sil İkon Butonu */}
                          <button
                            onClick={() => handleDelete(yetkili.id)}
                            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-600/20"
                            title="Sil"
                          >
                            <svg className="w-4 h-4 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7L5 7M10 11V17M14 11V17M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7Z" />
                            </svg>
                          </button>

                        </div>

                        {/* Kart İçeriği */}
                        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                          Yetkili {index + 1}
                        </p>

                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">
                          {yetkili.isim}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {yetkili.telefon ?? '-'} {yetkili.email ? ` / ${yetkili.email}` : ''}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {yetkili.pozisyon ?? ''}
                        </p>

                        {/* Modal */}
                        <Modal isOpen={isModalOpen(`editYetkili-${yetkili.id}`)} onClose={closeModal} className="max-w-[700px] m-4">
                          <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                            <div className="px-2">
                              <MusteriYetkililerForm
                                musteriId={musteri.id}
                                form={yetkili}
                                onSuccess={handleSuccess}
                              />
                            </div>
                          </div>
                        </Modal>

                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Yetkili bilgisi yok</p>
                )}
              </div>
            </div>
            <Modal isOpen={isModalOpen('editYetkili-new')} onClose={closeModal} className="max-w-[700px] m-4">
              <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2">
                  <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                    <MusteriYetkililerForm
                      musteriId={musteri.id}
                      onSuccess={() => {
                        handleSuccess();
                        closeModal();
                      }}
                    />
                  </p>
                </div>
              </div>
            </Modal>

            {/* TESLİMAT BİLGİLERİ */}
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                      Teslimat Bilgileri
                    </h4>
                    <button
                      onClick={() => openModal('editTeslimat-new')}
                      className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Ekle
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-x-12 2xl:gap-x-20">
                    {musteri.teslimat_adresleri && musteri.teslimat_adresleri.length > 0 ? (
                      musteri.teslimat_adresleri.map((adres, index) => (
                        <div key={adres.id} className="relative border p-4 rounded-xl bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
                          <div className="absolute top-2 right-2 flex items-center gap-2">
                            <button
                                onClick={() => {
                                  setSelectedAdres(adres);  // adresi state’e kaydet
                                  openModal('editTeslimat');
                                }}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/[0.05]"
                                title="Düzenle"
                              >
                              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l3 3 8-8-3-3-8 8z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleTADelete(adres.id)}
                              className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-600/20"
                              title="Sil"
                            >
                              <svg className="w-4 h-4 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7L5 7M10 11V17M14 11V17M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7Z" />
                              </svg>
                            </button>
                          </div>
                          <p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                            {adres.baslik ?? ''}
                          </p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{adres.adres}</p>
                          {(adres.ilce || adres.il || adres.posta_kodu) && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {adres.ilce ?? ''} {adres.il ? `, ${adres.il}` : ''} {adres.posta_kodu ? `(${adres.posta_kodu})` : ''}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Kayıtlı teslimat adresi yok.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Modal isOpen={isModalOpen('editTeslimat')} onClose={closeModal} className="max-w-[700px] m-4">
              <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-4">
                    <MusteriTeslimatAdresleriForm
                      musteriId={musteri.id}
                      form={selectedAdres ?? undefined}  // burası artık state
                      onSuccess={() => {
                        handleSuccess();
                        closeModal();
                      }}
                  />
                </div>
              </div>
            </Modal>
            <Modal isOpen={isModalOpen('editTeslimat-new')} onClose={closeModal} className="max-w-[700px] m-4">
              <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-4">
                    <MusteriTeslimatAdresleriForm
                      musteriId={musteri.id}
                      form={undefined}  // burası artık state
                      onSuccess={() => {
                        handleSuccess();
                        closeModal();
                      }}
                  />
                </div>
              </div>
            </Modal>
          </TabsContent>
          <TabsContent value="siparisler">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Siparişler</h3>
              <SiparisListesi musteriId={musteri.id!} />
            </div>
          </TabsContent>
          <TabsContent value="finans">
            {/* Finans içeriği */}
          </TabsContent>
          <TabsContent value="destek">
            {/* Destek içeriği */}
          </TabsContent>
        </div>
      </Tabs>
      
    </div>
  </>
  );
}