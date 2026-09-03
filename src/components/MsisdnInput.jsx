import React from 'react';
import { Plus, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const MAX_MSISDNS = 10;

export const formatMsisdn = (value) => {
  const digits = value.replace(/\D/g, '');
  const nationalNumber = digits.startsWith('39') ? digits.slice(2) : digits;
  const limited = nationalNumber.slice(0, 10);
  const groups = [limited.slice(0, 3), limited.slice(3, 6), limited.slice(6, 10)].filter(Boolean);
  return `39 ${groups.join(' ')}`;
};

export const isValidMsisdn = (value) => /^39 \d{3} \d{3} \d{4}$/.test(value);

export default function MsisdnInput({ msisdns, onChange, error, maxEntries = MAX_MSISDNS }) {
  const addMsisdn = () => {
    if (msisdns.length < maxEntries) {
      onChange([...msisdns, '']);
    }
  };

  const removeMsisdn = (index) => {
    onChange(msisdns.filter((_, i) => i !== index));
  };

  const updateMsisdn = (index, value) => {
    const updated = [...msisdns];
    updated[index] = formatMsisdn(value);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-foreground font-medium">
          MSISDN Details <span className="text-red-500">*</span>
        </Label>
        <span className="text-xs text-foreground/40">{msisdns.length} / {maxEntries}</span>
      </div>
      <p className="text-xs text-foreground/50">
        {maxEntries === 1
          ? 'Enter the affected customer number.'
          : `Add the affected customer numbers (up to ${maxEntries}).`}
      </p>

      <div className="space-y-2">
        {msisdns.map((num, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={num}
              onChange={(e) => updateMsisdn(index, e.target.value)}
              placeholder="39 351 002 5000"
              inputMode="numeric"
              className="rounded-xl bg-white border-foreground/15"
            />
            {msisdns.length > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => removeMsisdn(index)}
                className="rounded-xl border-foreground/15 text-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {msisdns.length < maxEntries && (
        <Button
          type="button"
          variant="outline"
          onClick={addMsisdn}
          className="rounded-xl border-foreground/15 text-foreground hover:bg-background"
        >
          <Plus className="w-4 h-4 mr-1" /> Add MSISDN
        </Button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-foreground/40">Format: 39 XXX XXX XXXX (39 is the default country code)</p>
    </div>
  );
}