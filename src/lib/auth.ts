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
  
  console.log('Attempting signup:', { 
    email, 
    timestamp: new Date().toISOString(),
    redirectUrl: redirectTo
  });
  
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
      logAuthError('signup', error, {
        email,
        redirectUrl: redirectTo
      });
      
      if (error.message.includes('Email rate limit exceeded')) {
        throw new Error('Too many signup attempts. Please try again later.');
      }
      throw error;
    }

    // Log detailed signup response
    console.log('Signup response:', {
      userId: data.user?.id,
      email: data.user?.email,
      emailConfirmed: data.user?.email_confirmed_at,
      identities: data.user?.identities,
      timestamp: new Date().toISOString()
    });

    // Check if confirmation was sent
    if (data.user && !data.user.email_confirmed_at) {
      console.log('Email confirmation required:', {
        email: data.user.email,
        timestamp: new Date().toISOString()
      });
    }

    return { data, emailConfirmationRequired: true };
  } catch (error) {
    logAuthError('signup_catch', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  console.log('Attempting signin:', { email, timestamp: new Date().toISOString() });
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logAuthError('signin', error, { email });
      
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password');
      }
      if (error.message === 'Email not confirmed') {
        throw new Error('Please verify your email before signing in');
      }
      throw error;
    }

    console.log('Signin successful:', {
      userId: data.user?.id,
      timestamp: new Date().toISOString()
    });

    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logAuthError('fetch_profile', profileError, {
        userId: data.user.id
      });
    }

    // If no profile exists, create one
    if (!profile) {
      console.log('Creating profile for user:', {
        userId: data.user.id,
        timestamp: new Date().toISOString()
      });

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
        logAuthError('create_profile', createError, {
          userId: data.user.id
        });
      }
    }

    return data;
  } catch (error) {
    logAuthError('signin_catch', error);
    throw error;
  }
}

export async function signOut() {
  console.log('Attempting signout:', { timestamp: new Date().toISOString() });
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logAuthError('signout', error);
      throw error;
    }
    console.log('Signout successful:', { timestamp: new Date().toISOString() });
  } catch (error) {
    logAuthError('signout_catch', error);
    throw error;
  }
}

export function onAuthStateChange(callback: (session: any) => void) {
  console.log('Setting up auth state change listener');
  
  return supabase.auth.onAuthStateChange((_event, session) => {
    console.log('Auth state changed:', {
      event: _event,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    });
    callback(session);
  });
}

export async function resendConfirmationEmail(email: string) {
  console.log('Attempting to resend confirmation email:', {
    email,
    timestamp: new Date().toISOString()
  });
  
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    
    if (error) {
      logAuthError('resend_confirmation', error, { email });
      throw error;
    }
    
    console.log('Confirmation email resent successfully:', {
      email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logAuthError('resend_confirmation_catch', error);
    throw error;
  }
}