import React, { useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function DropdownSelect({ value, onChange, options, placeholder, disabled, error }) {
  const detailsRef = useRef(null);

  const handleSelect = (val) => {
    onChange(val);
    if (detailsRef.current) detailsRef.current.open = false;
  };

  if (disabled) {
    return (
      <div className={`flex h-10 w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-foreground/50 cursor-not-allowed border border-foreground/15 opacity-50`}>
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-foreground/40 flex-shrink-0 ml-2" />
      </div>
    );
  }

  return (
    <details ref={detailsRef} className="relative">
      <summary
        className={`flex h-10 w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-foreground/20 list-none [&::-webkit-details-marker]:hidden ${error ? 'border border-red-400' : 'border border-foreground/15'}`}
      >
        <span className={value ? 'truncate' : 'text-foreground/40 truncate'}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-foreground/40 flex-shrink-0 ml-2" />
      </summary>
      <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-auto rounded-xl bg-white border border-foreground/15 shadow-lg z-50">
        {options.map(opt => (
          <div
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`block w-full text-left px-3 py-2 text-sm hover:bg-foreground/5 cursor-pointer ${value === opt.value ? 'bg-foreground/10 text-foreground font-medium' : 'text-foreground'}`}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </details>
  );
}