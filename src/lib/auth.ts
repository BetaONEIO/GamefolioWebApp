import { supabase } from './supabase';
import { sendConfirmationEmail, sendPasswordResetEmail } from './email';

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
  const redirectTo = `${window.location.origin}/`;
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          email_confirmed: false
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('An account with this email already exists');
      }
      throw error;
    }

    if (!data?.user) {
      throw new Error('Signup failed. Please try again.');
    }

    await sendConfirmationEmail(email, redirectTo);

    return { data, emailConfirmationRequired: true };
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error('Too many requests. Please wait a few minutes and try again.');
    }

    logAuthError('signup', error, { email, redirectUrl: redirectTo });
    throw new Error(error.message || 'Failed to create account. Please try again.');
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
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
    if (error.status === 429) {
      throw new Error('Too many requests. Please wait a few minutes and try again.');
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

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    // Send password reset email using EmailJS
    await sendPasswordResetEmail(email);

    return { success: true };
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error('Too many requests. Please wait a few minutes and try again.');
    }
    
    logAuthError('reset-password', error, { email });
    throw new Error(error.message || 'Failed to send password reset email. Please try again.');
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    logAuthError('update-password', error);
    throw new Error(error.message || 'Failed to update password. Please try again.');
  }
}

export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}