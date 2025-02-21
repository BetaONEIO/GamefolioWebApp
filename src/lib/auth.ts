import { supabase, signUpUser } from './supabase';
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
  
  console.log('Attempting signup:', { 
    email, 
    timestamp: new Date().toISOString(),
    redirectUrl: redirectTo
  });
  
  try {
    const maxRetries = 3;
    let retryCount = 0;
    let lastError;

    while (retryCount < maxRetries) {
      try {
        const signupPromise = signUpUser(email, password, {
          emailRedirectTo: redirectTo,
          data: {
            email_confirmed: false
          }
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timed out. Please try again.'));
          }, 15000);
        });

        const { data, error } = await Promise.race([
          signupPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          if (error.message.includes('rate limit')) {
            throw new Error('Too many signup attempts. Please try again later.');
          }
          throw error;
        }

        console.log('Signup response:', {
          userId: data.user?.id,
          email: data.user?.email,
          emailConfirmed: data.user?.email_confirmed_at,
          identities: data.user?.identities,
          timestamp: new Date().toISOString()
        });

        if (data.user && !data.user.email_confirmed_at) {
          console.log('Email confirmation required:', {
            email: data.user.email,
            timestamp: new Date().toISOString()
          });

          try {
            await sendConfirmationEmail(email, redirectTo);
          } catch (emailError) {
            console.error('Failed to send confirmation email via Resend:', emailError);
          }
        }

        return { data, emailConfirmationRequired: true };
      } catch (error) {
        lastError = error;
        
        if (error.message.includes('timeout') || error.message.includes('network')) {
          retryCount++;
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount - 1) * 1000;
            console.log(`Retry attempt ${retryCount} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else {
          break;
        }
      }
    }

    logAuthError('signup', lastError, {
      email,
      redirectUrl: redirectTo,
      retries: retryCount
    });
    throw lastError;
  } catch (error) {
    logAuthError('signup_catch', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  console.log('Attempting signin:', { email, timestamp: new Date().toISOString() });
  
  try {
    const signInPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Sign in request timed out. Please try again.'));
      }, 15000);
    });

    const { data, error } = await Promise.race([
      signInPromise,
      timeoutPromise
    ]) as any;
    
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

    try {
      const redirectTo = `${window.location.origin}/account`;
      await sendConfirmationEmail(email, redirectTo);
    } catch (emailError) {
      console.error('Failed to send confirmation email via Resend:', emailError);
      throw emailError;
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