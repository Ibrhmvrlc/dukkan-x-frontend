import MusteriForm from './MusteriForm.tsx';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function MusteriCreate() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/musteriler'); // başarı sonrası liste sayfasına dön
  };

  return (
    <div className="p-4">
       <div className="flex justify-between items-center mb-3">
         <p className="text-xl font-bold mb-4 dark:text-white/90">Yeni Müşteri Ekle</p>
          <Link to="/musteriler" className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600">Müşteri Listesi</Link>
        </div>
        <div className="overflow-x-auto">
          <MusteriForm onSuccess={handleSuccess} />
        </div>
    </div>
  );
}