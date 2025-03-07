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

// Function to check if a user is an admin
export async function checkAdminStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Function to get all admin users
export async function getAdminUsers() {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        user_profiles:user_id (
          username,
          avatar_url
        ),
        auth_users:user_id (
          email,
          created_at
        )
      `)
      .eq('role', 'admin');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting admin users:', error);
    throw error;
  }
}