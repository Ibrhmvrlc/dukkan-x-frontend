import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';

interface Segment {
  id: number;
  isim: string;
}

interface SegmentSelectProps {
  value: string | number | null;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  label?: string;
  required?: boolean;
}

export default function SegmentSelect({
  value,
  onChange,
  name = 'musteri_tur_id',
  label = 'Müşteri Sektörü',
  required = false,
}: SegmentSelectProps) {
  const [segmentler, setSegmentler] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useEffect triggered');
    axios
      .get('/v1/musteri-turleri', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          Accept: "application/json",
        }
      })
      .then((res) => {
        const responseData = Array.isArray(res.data.data) ? res.data.data : res.data;
        if (Array.isArray(responseData)) {
          setSegmentler(responseData);
        } else {
          console.error("Veri beklenen formatta değil:", res.data);
        }
      })
      .catch((err) => {
        console.error('Segment listesi alınamadı:', err.response?.data || err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-white/90"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        className="w-full rounded border border-stroke bg-white px-4 py-2 text-sm text-black shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-white/[0.03] dark:text-white/90"
      >
        <option value="" className="bg-white dark:bg-gray-900 text-black dark:text-white">Seçiniz</option>
        {!loading &&
          segmentler.map((s) => (
            <option key={s.id} value={s.id} className="bg-white dark:bg-gray-900 text-black dark:text-white">
              {s.isim}
            </option>
          ))}
      </select>
    </div>
  );
}