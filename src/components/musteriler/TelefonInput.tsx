import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface TelefonInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export default function TelefonInput({
  value,
  onChange,
  label = 'Telefon',
  required = false,
}: TelefonInputProps) {
  return (
    <div className="mb-4 w-full">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-white/90">
          {label}
        </label>
      )}
      <PhoneInput
        inputClassName="dark:bg-gray-900 dark:text-white"
        countrySelectProps={{
          className: "dark:bg-gray-900 dark:text-white"
        }}
        international
        defaultCountry="TR"
        value={value}
        onChange={(val) => onChange(val || '')}
        className="react-phone-input-custom border border-stroke rounded px-4 py-2 text-sm text-black shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-white/[0.03] dark:text-white"
      />
    </div>
  );
}