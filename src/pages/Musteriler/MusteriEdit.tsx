import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
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

  if (!musteri) {
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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4 dark:text-white/90">Müşteri Düzenle</h1>
      <MusteriForm musteri={musteri} onSuccess={handleSuccess} />
    </div>
  );
}