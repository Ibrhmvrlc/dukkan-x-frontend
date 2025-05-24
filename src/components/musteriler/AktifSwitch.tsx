import React from 'react';

interface AktifSwitchProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  label?: string;
}

export default function AktifSwitch({
  checked,
  onChange,
  name = 'aktif',
  label = 'Aktif',
}: AktifSwitchProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <label
        htmlFor={name}
        className="text-sm font-medium text-gray-700 dark:text-white/90"
      >
        {label}
      </label>
      <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
        <input
          type="checkbox"
          name={name}
          id={name}
          checked={checked}
          onChange={onChange}
          className={`toggle-checkbox absolute block w-6 h-6 rounded-full border-4 appearance-none cursor-pointer top-0 left-0 transition-transform duration-300 ease-in-out
            ${checked ? 'bg-green-500 translate-x-6' : 'bg-white'}
          `}
        />
        <label
          htmlFor={name}
          className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
        />
      </div>
    </div>
  );
}