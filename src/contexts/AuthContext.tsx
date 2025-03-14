import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { onAuthStateChange, signIn } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface AuthSession extends Session {
  needsOnboarding?: boolean;
  needsUsername?: boolean;
}

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });

const TEST_USER = {
  email: 'test@gamefolio.dev',
  password: 'Test123!@#'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auto-login test user in development
  useEffect(() => {
    async function loginTestUser() {
      if (isDevelopment && !session) {
        try {
          // First check if test user exists
          const { data: existingUser } = await supabase
            .from('users_with_roles')
            .select('id, email')
            .eq('email', TEST_USER.email)
            .single();

          if (!existingUser) {
            // Create test user if doesn't exist
            const { error: signUpError } = await supabase.auth.signUp({
              email: TEST_USER.email,
              password: TEST_USER.password,
              options: {
                data: {
                  email_confirmed: true
                }
              }
            });

            if (signUpError) throw signUpError;

            // Wait a moment for the user to be created
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Sign in as test user
          await signIn(TEST_USER.email, TEST_USER.password);
        } catch (error) {
          console.error('Error setting up test user:', error);
        }
      }
    }

    loginTestUser();
  }, [isDevelopment, session]);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}