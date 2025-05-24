import React from 'react';

interface VergiDairesiInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  label?: string;
  required?: boolean;
}

export default function VergiDairesiInput({
  value,
  onChange,
  name = 'vergi_dairesi',
  label = 'Vergi Dairesi',
  required = false,
}: VergiDairesiInputProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700 dark:text-white/90"
      >
        {label}
      </label>
      <input
        type="text"
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        required={required}
        className="w-full rounded border border-stroke bg-white px-4 py-2 text-sm text-black shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-white/[0.03] dark:text-white/90"
        placeholder="İstanbul Vergi Dairesi"
      />
    </div>
  );
}