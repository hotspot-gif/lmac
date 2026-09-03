import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`flex items-center gap-2 ${compact ? 'text-white/70' : 'text-foreground/70'}`}>
      <Languages className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="sr-only">{t('language')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t('language')}
        className={`bg-transparent text-xs font-medium outline-none cursor-pointer ${compact ? 'text-white [&>option]:text-foreground' : 'text-foreground'}`}>
        <option value="en">{t('english')}</option>
        <option value="it">{t('italian')}</option>
      </select>
    </label>
  );
}
