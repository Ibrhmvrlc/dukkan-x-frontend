import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MusteriForm from './MusteriForm';

export default function MusteriEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [musteri, setMusteri] = useState(null);

  useEffect(() => {
    axios.get(`/v1/musteriler/${id}`).then((res) => {
      setMusteri(res.data.data);
    });
  }, [id]);

  const handleSuccess = () => {
    navigate('/musteriler');
  };

  if (!musteri) return <p>Yükleniyor...</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Müşteri Düzenle</h1>
      <MusteriForm musteri={musteri} onSuccess={handleSuccess} />
    </div>
  );
}