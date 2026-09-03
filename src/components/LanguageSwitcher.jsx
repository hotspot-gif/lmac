import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-white/70' : 'text-foreground/70'}`} aria-label={t('language')}>
      <Languages className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <div className={`flex items-center p-0.5 rounded-lg border ${compact ? 'border-white/20' : 'border-foreground/15'}`}>
        {['en', 'it'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setLanguage(option)}
            aria-pressed={language === option}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${language === option ? (compact ? 'bg-white text-foreground' : 'bg-foreground text-white') : ''}`}>
            {option === 'en' ? 'EN' : 'IT'}
          </button>
        ))}
      </div>
    </div>
  );
}
