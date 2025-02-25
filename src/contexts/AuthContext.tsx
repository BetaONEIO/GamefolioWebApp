import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { onAuthStateChange } from '../lib/auth';

interface AuthSession extends Session {
  needsOnboarding?: boolean;
  needsUsername?: boolean;
}

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });

// Mock user session for demonstration
const mockSession: AuthSession = {
  access_token: 'mock_token',
  refresh_token: 'mock_refresh',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  user: {
    id: '123',
    email: 'demo@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  needsOnboarding: false,
  needsUsername: false
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(mockSession); // Set mock session
  const [loading, setLoading] = useState(false); // Set loading to false

  // Comment out the real auth state change listener for demo
  /*
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  */

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}