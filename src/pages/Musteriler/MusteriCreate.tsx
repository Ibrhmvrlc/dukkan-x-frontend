import MusteriForm from './MusteriForm.tsx';
import { useNavigate } from 'react-router-dom';

export default function MusteriCreate() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/musteriler'); // başarı sonrası liste sayfasına dön
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Yeni Müşteri Ekle</h1>
      <MusteriForm onSuccess={handleSuccess} />
    </div>
  );
}