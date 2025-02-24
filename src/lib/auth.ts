import { supabase } from './supabase';
import { sendConfirmationEmail } from './email';

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

    // Send confirmation email using Email.js
    await sendConfirmationEmail(email, `${window.location.origin}/confirm?email=${encodeURIComponent(email)}`);

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

    // After successful sign in, check if user needs onboarding
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('username, onboarding_completed, favorite_games')
        .eq('user_id', data.user.id)
        .single();

      if (!profileError && profile) {
        // Return onboarding status with auth data
        return {
          ...data,
          needsOnboarding: !profile.onboarding_completed || !profile.favorite_games || profile.favorite_games.length < 5,
          needsUsername: !profile.username || profile.username.startsWith('user_')
        };
      }
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

export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      // Check onboarding status whenever auth state changes
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username, onboarding_completed, favorite_games')
        .eq('user_id', session.user.id)
        .single();

      callback({
        ...session,
        needsOnboarding: !profile?.onboarding_completed || !profile?.favorite_games || profile?.favorite_games.length < 5,
        needsUsername: !profile?.username || profile?.username.startsWith('user_')
      });
    } else {
      callback(session);
    }
  });
}