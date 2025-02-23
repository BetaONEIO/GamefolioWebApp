import { supabase } from './supabase';

function logAuthError(action: string, error: any, details?: Record<string, any>) {
  console.error(`Auth Error (${action}):`, {
    message: error.message,
    code: error.code,
    status: error.status,
    details,
    timestamp: new Date().toISOString(),
  });
}

export async function signUp(email: string, password: string) {
  const redirectTo = `${window.location.origin}/account`;
  
  try {
    // First check if the user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // Attempt signup with a shorter timeout
    const signUpPromise = supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          email_confirmed: false
        }
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Signup request timed out')), 10000);
    });

    const { data, error } = await Promise.race([signUpPromise, timeoutPromise]) as any;

    if (error) {
      if (error.message.includes('rate limit')) {
        throw new Error('Too many signup attempts. Please try again in a few minutes.');
      }
      throw error;
    }

    if (!data?.user) {
      throw new Error('Signup failed. Please try again.');
    }

    return { data, emailConfirmationRequired: true };
  } catch (error: any) {
    // Handle specific error cases
    if (error.message.includes('timeout')) {
      logAuthError('signup', error, {
        message: 'Request timed out. Please try again.',
        email,
        redirectUrl: redirectTo
      });
      throw new Error('The signup request took too long. Please try again.');
    }

    if (error.status === 429) {
      throw new Error('Too many requests. Please wait a few minutes and try again.');
    }

    logAuthError('signup', error, { email, redirectUrl: redirectTo });
    throw new Error(error.message || 'Failed to create account. Please try again.');
  }
}

export async function signIn(email: string, password: string) {
  try {
    const signInPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sign in request timed out')), 10000);
    });

    const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;
    
    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password');
      }
      if (error.message === 'Email not confirmed') {
        throw new Error('Please verify your email before signing in');
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    if (error.message.includes('timeout')) {
      throw new Error('The sign in request took too long. Please try again.');
    }
    
    logAuthError('signin', error, { email });
    throw new Error(error.message || 'Failed to sign in. Please try again.');
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    logAuthError('signout', error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

export async function resendConfirmationEmail(email: string) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    
    if (error) throw error;
  } catch (error) {
    logAuthError('resend_confirmation', error, { email });
    throw new Error('Failed to resend confirmation email. Please try again later.');
  }
}