import TedarikciGenelFaturaForm from './TedarikciGenelFaturaForm.tsx';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function MusteriCreate() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/tedarikciler'); // başarı sonrası liste sayfasına dön
  };

  return (
    <div className="p-4">
        <div className="flex justify-between items-center mb-3">
        <p className="text-xl font-bold mb-4 dark:text-white/90">Yeni Tedarikçi Ekle</p>
        <Link to="/tedarikciler" className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600">Tedarikçi Listesi</Link>
        </div>
        <div className="p-5 mb-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="overflow-x-auto">
            <TedarikciGenelFaturaForm onSuccess={handleSuccess} />
            </div>
        </div>
    </div>
  );
}