import React from 'react';

interface AdresTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  name?: string;
  label?: string;
  required?: boolean;
  rows?: number;
}

export default function AdresTextarea({
  value,
  onChange,
  name = 'adres',
  label = 'Adres',
  required = false,
  rows = 3,
}: AdresTextareaProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        required={required}
        rows={rows}
        className="w-full rounded border border-stroke bg-white px-4 py-2 text-sm text-black shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        placeholder="Adres bilgisi giriniz..."
      />
    </div>
  );
}