-- Create a view to join users with their roles and profiles
CREATE OR REPLACE VIEW users_with_roles AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  ur.role as role,
  up.username,
  up.avatar_url,
  up.banned,
  up.onboarding_completed,
  up.favorite_games
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN user_profiles up ON au.id = up.user_id;

-- Grant access to the view
GRANT SELECT ON users_with_roles TO authenticated;
GRANT SELECT ON users_with_roles TO anon;