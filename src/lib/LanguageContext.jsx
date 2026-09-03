import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'lmac_language';

const translations = {
  en: {
    language: 'Language',
    english: 'English',
    italian: 'Italiano',
    marketAssistanceCenter: 'Market Assistance Center',
    dashboard: 'Dashboard',
    reportIssue: 'Report an Issue',
    myTickets: 'My Tickets',
    allTickets: 'All Tickets',
    pendingCases: 'Pending Cases',
    completedCases: 'Completed Cases',
    staffManagement: 'Staff Management',
    profile: 'Profile',
    logout: 'Logout',
    stepIdentify: 'Step 1 of 2 - Identify Yourself',
    enterEmail: 'Enter your corporate email to continue',
    hello: 'Hello, {name}',
    enterPassword: 'Enter your password to sign in',
    corporateEmail: 'Corporate Email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    continue: 'Continue',
    back: 'Back',
    verifying: 'Verifying...',
    signingIn: 'Signing in...',
    signIn: 'Sign In',
    authorized: 'Authorized personnel only. Contact your administrator for access.',
    emailRequired: 'Please enter your corporate email address.',
    userNotFound: 'User not found. Please check your corporate email address.',
    emailError: 'Unable to verify email. Please try again.',
    passwordRequired: 'Please enter your password.',
    loginError: 'Login failed. Please try again.',
    invalidPassword: 'Invalid password. Please try again.',
  },
  it: {
    language: 'Lingua',
    english: 'English',
    italian: 'Italiano',
    marketAssistanceCenter: 'Centro assistenza mercato',
    dashboard: 'Dashboard',
    reportIssue: 'Segnala un problema',
    myTickets: 'I miei ticket',
    allTickets: 'Tutti i ticket',
    pendingCases: 'Casi in sospeso',
    completedCases: 'Casi completati',
    staffManagement: 'Gestione del personale',
    profile: 'Profilo',
    logout: 'Esci',
    stepIdentify: 'Passaggio 1 di 2 - Identifica la tua utenza',
    enterEmail: 'Inserisci la tua email aziendale per continuare',
    hello: 'Ciao, {name}',
    enterPassword: 'Inserisci la password per accedere',
    corporateEmail: 'Email aziendale',
    password: 'Password',
    passwordPlaceholder: 'Inserisci la password',
    continue: 'Continua',
    back: 'Indietro',
    verifying: 'Verifica in corso...',
    signingIn: 'Accesso in corso...',
    signIn: 'Accedi',
    authorized: 'Solo personale autorizzato. Contatta l’amministratore per ottenere l’accesso.',
    emailRequired: 'Inserisci la tua email aziendale.',
    userNotFound: 'Utente non trovato. Controlla la tua email aziendale.',
    emailError: 'Impossibile verificare l’email. Riprova.',
    passwordRequired: 'Inserisci la password.',
    loginError: 'Accesso non riuscito. Riprova.',
    invalidPassword: 'Password non valida. Riprova.',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const translate = (key, values = {}) => {
    let value = translations[language]?.[key] || translations.en[key] || key;
    Object.entries(values).forEach(([name, replacement]) => {
      value = value.replace(`{${name}}`, replacement);
    });
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
