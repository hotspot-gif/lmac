// Legacy provider kept for compatibility with the original Base44 export.
// The app authenticates through CustomAuthProvider (@/lib/customAuth), which
// is backed by Supabase Auth. This context intentionally provides neutral
// values so any remaining consumers render without touching platform APIs.
import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

const noop = () => {};
const asyncNoop = async () => {};

export const AuthProvider = ({ children }) => (
  <AuthContext.Provider value={{
    user: null,
    isAuthenticated: false,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    authChecked: true,
    logout: noop,
    navigateToLogin: noop,
    checkUserAuth: asyncNoop,
    checkAppState: asyncNoop,
  }}>
    {children}
  </AuthContext.Provider>
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
