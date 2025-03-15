import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Trophy, User, Settings as SettingsIcon, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const navItems = [
  { to: '/account', icon: Home, label: 'My Gamefolio', end: true },
  { to: '/account/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/account/profile', icon: User, label: 'My Profile' },
  { to: '/account/settings', icon: SettingsIcon, label: 'Settings' },
];

export default function AccountLayout() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    async function loadUserProfile() {
      if (!session?.user) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load user profile and role
        const { data, error } = await supabase
          .from('users_with_roles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        setProfile(data);
        setIsAdmin(data?.role === 'admin');
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError('Failed to load profile');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [session, navigate]);

  const allNavItems = React.useMemo(() => {
    if (isAdmin) {
      return [
        ...navItems,
        { to: '/account/admin', icon: Shield, label: 'Admin' }
      ];
    }
    return navItems;
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#9FE64F]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error || 'Profile not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="text-[#9FE64F] hover:text-[#8FD63F]"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 fixed left-0 h-[calc(100vh-7rem)] top-28">
        <nav className="p-4">
          {allNavItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#9FE64F] text-black font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet context={{ profile }} />
      </main>
    </div>
  );
}