import { supabase } from './supabase';

export async function makeUserAdmin(email: string) {
  try {
    // First get the user ID
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) throw userError;
    if (!userData?.id) throw new Error('User not found');

    // Add admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userData.id,
        role: 'admin'
      }, {
        onConflict: 'user_id'
      });

    if (roleError) throw roleError;

    return { success: true };
  } catch (error) {
    console.error('Error making user admin:', error);
    throw error;
  }
}