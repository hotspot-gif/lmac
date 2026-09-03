import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function DropdownSelect({ value, onChange, options, placeholder, disabled, error }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`h-10 w-full appearance-none rounded-xl bg-white px-3 py-2 pr-9 text-left text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:cursor-not-allowed disabled:text-foreground/50 disabled:opacity-50 ${error ? 'border border-red-400' : 'border border-foreground/15'}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
    </div>
  );
}