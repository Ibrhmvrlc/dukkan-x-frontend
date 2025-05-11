import React from 'react';

interface TurSelectProps {
  value: 'bireysel' | 'kurumsal';
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  label?: string;
  required?: boolean;
}

export default function TurSelect({
  value,
  onChange,
  name = 'tur',
  label = 'Müşteri Türü',
  required = true,
}: TurSelectProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded border border-stroke bg-white px-4 py-2 text-sm text-black shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="bireysel">Bireysel</option>
        <option value="kurumsal">Kurumsal</option>
      </select>
    </div>
  );
}