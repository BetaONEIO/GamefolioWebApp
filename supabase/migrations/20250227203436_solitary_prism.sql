-- Query to find all admin users with their email addresses and usernames
SELECT 
  au.id,
  au.email,
  up.username,
  ur.role,
  au.created_at
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE ur.role = 'admin'
ORDER BY au.created_at ASC;