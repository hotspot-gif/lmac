import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'lmac_language';

const pageTextTranslations = {
  'Welcome back': 'Bentornato',
  'Pending Cases Summary': 'Riepilogo casi in sospeso',
  'Total Tickets': 'Ticket totali',
  'Open': 'Aperto',
  'In Progress': 'In lavorazione',
  'Pending': 'In sospeso',
  'Completed': 'Completato',
  'Service Impact': 'Impatto sul servizio',
  'Many Customers': 'Molti clienti',
  'Few Customers': 'Pochi clienti',
  'Single customers': 'Un solo cliente',
  'No Customer Impact': 'Nessun impatto sui clienti',
  'Cases by Status': 'Casi per stato',
  'Top Categories': 'Categorie principali',
  'Tickets Requiring Attention': 'Ticket che richiedono attenzione',
  'View all': 'Visualizza tutto',
  'All caught up!': 'Tutto aggiornato!',
  'No active tickets require attention.': 'Nessun ticket attivo richiede attenzione.',
  'All Tickets': 'Tutti i ticket',
  'Filters': 'Filtri',
  'Status': 'Stato',
  'Category': 'Categoria',
  'Sub Category': 'Sottocategoria',
  'Role': 'Ruolo',
  'Branch': 'Filiale',
  'Impact': 'Impatto',
  'Urgency': 'Urgenza',
  'Clear all filters': 'Cancella tutti i filtri',
  'No tickets found': 'Nessun ticket trovato',
  'Try adjusting your search or filters.': 'Prova a modificare la ricerca o i filtri.',
  'Completed Cases': 'Casi completati',
  'All resolved and closed tickets.': 'Tutti i ticket risolti e chiusi.',
  'No completed cases': 'Nessun caso completato',
  'Completed tickets will appear here.': 'I ticket completati appariranno qui.',
  'Report an Issue': 'Segnala un problema',
  'Total Cases': 'Casi totali',
  'High Urgency': 'Urgenza alta',
  'My Cases by Status': 'I miei casi per stato',
  'My Reported Cases': 'I miei casi segnalati',
  'No tickets reported yet': 'Nessun ticket segnalato',
  'Click "Report an Issue" to create your first ticket.': 'Fai clic su "Segnala un problema" per creare il tuo primo ticket.',
  'total tickets submitted': 'ticket totali inviati',
  'Forgot Password': 'Password dimenticata',
  'Reset password': 'Reimposta password',
  'Back to log in': 'Torna al login',
  'Email address': 'Indirizzo email',
  'Send reset link': 'Invia link di reimpostazione',
  'My Tickets': 'I miei ticket',
  'All Statuses': 'Tutti gli stati',
  'You have not reported any issues yet.': 'Non hai ancora segnalato problemi.',
  'Profile': 'Profilo',
  'Full Name': 'Nome completo',
  'Designation': 'Qualifica',
  'Mobile Number': 'Numero di cellulare',
  'Territory': 'Territorio',
  'Add Staff': 'Aggiungi personale',
  'Active': 'Attivo',
  'Inactive': 'Inattivo',
  'Edit': 'Modifica',
  'Deactivate': 'Disattiva',
  'Reactivate': 'Riattiva',
  'Save Changes': 'Salva modifiche',
  'Cancel': 'Annulla',
  'Description': 'Descrizione',
  'Back': 'Indietro',
  'Go back': 'Torna indietro',
  'Update Status': 'Aggiorna stato',
  'Save Status': 'Salva stato',
  'Add Response': 'Aggiungi risposta',
  'Post Response': 'Pubblica risposta',
  'Mark Completed': 'Segna come completato',
  'Activity Timeline': 'Cronologia attività',
  'Ticket Created': 'Ticket creato',
  'Status Updated': 'Stato aggiornato',
  'Administrator Response': 'Risposta dell’amministratore',
  'No activity recorded yet.': 'Nessuna attività registrata.',
  'Created': 'Creato',
  'Updated': 'Aggiornato',
  'Notifications': 'Notifiche',
  'Clear read': 'Cancella lette',
  'Loading...': 'Caricamento...',
  'No new notifications': 'Nessuna nuova notifica',
  'Select category': 'Seleziona categoria',
  'Select subcategory': 'Seleziona sottocategoria',
  'Select category first': 'Seleziona prima una categoria',
  'MSISDN Details': 'Dettagli MSISDN',
  'Add MSISDN': 'Aggiungi MSISDN',
  'Access Restricted': 'Accesso limitato',
  'No staff found': 'Nessun membro del personale trovato',
  'Submit Report': 'Invia segnalazione',
  'Submitting...': 'Invio in corso...',
  'Issue Reported Successfully': 'Problema segnalato con successo',
  'View My Tickets': 'Visualizza i miei ticket',
  'Report Another': 'Segnala un altro problema',
  'Create your account': 'Crea il tuo account',
  'Sign up to get started': 'Registrati per iniziare',
  'Create account': 'Crea account',
  'Already have an account?': 'Hai già un account?',
  'Log in': 'Accedi',
  'Verify your email': 'Verifica la tua email',
  'Verify': 'Verifica',
  'Resend': 'Invia di nuovo',
  'Continue with Google': 'Continua con Google',
  'or': 'oppure',
  'New password': 'Nuova password',
  'Request a new link': 'Richiedi un nuovo link',
  'Invalid reset link': 'Link di reimpostazione non valido',
  'Ticket ID': 'ID ticket',
  'Subject': 'Oggetto',
  'Reported By': 'Segnalato da',
  'Created': 'Creato',
  'Actions': 'Azioni',
  'Tool access requested': 'Accesso agli strumenti richiesto',
  'Authorize access': 'Autorizza accesso',
  'Access granted': 'Accesso autorizzato',
  'Access denied': 'Accesso negato',
  'Deny': 'Nega',
  'Approve': 'Approva',
  'Save': 'Salva',
  'Search': 'Cerca',
  'Clear': 'Cancella',
  'Yes': 'Sì',
  'No': 'No',
};

const italianToEnglish = Object.fromEntries(
  Object.entries(pageTextTranslations).map(([english, italian]) => [italian, english])
);

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
  const originalText = useRef(new WeakMap());
  const originalAttributes = useRef(new WeakMap());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;

    const translatePage = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const current = node.nodeValue;
        const source = originalText.current.get(node) || italianToEnglish[current.trim()] || current;
        originalText.current.set(node, source);
        const trimmed = source.trim();
        const translated = language === 'it' ? (pageTextTranslations[trimmed] || trimmed) : trimmed;
        const leading = source.slice(0, source.length - source.trimStart().length);
        const trailing = source.slice(source.trimEnd().length);
        const nextValue = `${leading}${translated}${trailing}`;
        if (current !== nextValue) node.nodeValue = nextValue;
      }

      document.querySelectorAll('input, textarea').forEach((element) => {
        ['placeholder', 'aria-label'].forEach((attribute) => {
          if (!element.hasAttribute(attribute)) return;
          const current = element.getAttribute(attribute);
          const stored = originalAttributes.current.get(element)?.[attribute];
          const source = stored || italianToEnglish[current] || current;
          originalAttributes.current.set(element, { ...originalAttributes.current.get(element), [attribute]: source });
          element.setAttribute(attribute, language === 'it' ? (pageTextTranslations[source] || source) : source);
        });
      });
    };

    translatePage();
    const observer = new MutationObserver(translatePage);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const translate = (key, values = {}) => {
    let value = translations[language]?.[key] || translations.en[key] || (language === 'it' ? pageTextTranslations[key] : key);
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
