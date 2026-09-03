import React, { createContext, useContext, useState, useEffect } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { ADMIN_ROLES } from '@/lib/categories';

const CustomAuthContext = createContext(null);

const STORAGE_KEY = 'mirt_auth_session';

function friendlyAuthError(message) {
  if (message === 'Invalid login credentials') {
    return 'Invalid password. Please try again.';
  }
  if (message === 'Email not confirmed') {
    return 'Your account has not been confirmed. Please contact your administrator.';
  }
  return message;
}

export function CustomAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Step 1 of the login flow — checks the email against active staff accounts.
  // Runs before sign-in, so it is backed by the staff_validate_email() SQL
  // function (SECURITY DEFINER) and never exposes password material.
  const validateEmail = async (email) => {
    const { data, error } = await supabase.rpc('staff_validate_email', { p_email: email });
    if (error) throw new Error(error.message);
    if (!data?.found) return { found: false };
    return { found: true, user: { full_name: data.user.full_name } };
  };

  // Step 2 of the login flow — the password check happens in Supabase Auth
  // (bcrypt in auth.users). The staff profile row shares the auth user id.
  const login = async (email, password) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (authError) {
      return { success: false, error: friendlyAuthError(authError.message) };
    }
    const { data: staffRow, error: staffError } = await supabase
      .from('staff')
      .select('id, full_name, role, designation, corporate_email, territory, mobile_number, is_active')
      .eq('id', authData.user.id)
      .maybeSingle();
    if (staffError || !staffRow) {
      await supabase.auth.signOut();
      return { success: false, error: 'Signed in, but no staff profile was found. Please contact your administrator.' };
    }
    if (!staffRow.is_active) {
      await supabase.auth.signOut();
      return { success: false, error: 'This account is inactive. Please contact your administrator.' };
    }
    const sessionUser = {
      id: staffRow.id,
      full_name: staffRow.full_name,
      role: staffRow.role,
      designation: staffRow.designation,
      corporate_email: staffRow.corporate_email,
      territory: staffRow.territory,
      mobile_number: staffRow.mobile_number,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);
    return { success: true, user: sessionUser };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    supabase.auth.signOut().catch(() => {});
    setCurrentUser(null);
  };

  const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.role);

  return (
    <CustomAuthContext.Provider value={{ currentUser, login, logout, loading, isAdmin, validateEmail }}>
      {children}
    </CustomAuthContext.Provider>
  );
}

export function useCustomAuth() {
  const ctx = useContext(CustomAuthContext);
  if (!ctx) throw new Error('useCustomAuth must be used within CustomAuthProvider');
  return ctx;
}