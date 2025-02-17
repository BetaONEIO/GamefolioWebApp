import { supabase } from './supabase';

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: {
          email_confirmed: false
        }
      }
    });
    
    if (error) {
      if (error.message.includes('Email rate limit exceeded')) {
        throw new Error('Too many signup attempts. Please try again later.');
      }
      throw error;
    }

    // Email confirmation is now required
    return { data, emailConfirmationRequired: true };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
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

    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    // If no profile exists, create one
    if (!profile) {
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: data.user.id,
            username: `user_${data.user.id.substring(0, 8)}`,
            onboarding_completed: false
          }
        ]);

      if (createError) {
        console.error('Error creating profile:', createError);
      }
    }

    return data;
  } catch (error) {
    console.error('Signin error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Signout error:', error);
    throw error;
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
    console.error('Error resending confirmation email:', error);
    throw error;
  }
}