import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Trophy, User, Settings as SettingsIcon, Compass, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const navItems = [
  { to: '/account', icon: Home, label: 'My Gamefolio', end: true },
  { to: '/account/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/account/profile', icon: User, label: 'My Profile' },
  { to: '/account/settings', icon: SettingsIcon, label: 'Settings' },
  { to: '/account/explore', icon: Compass, label: 'Explore' },
];

export default function AccountLayout() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    async function checkAdminStatus() {
      if (!session?.user) {
        navigate('/');
        return;
      }

      try {
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        setIsAdmin(roleData?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }

    checkAdminStatus();
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

  return (
    <div className="flex min-h-screen pt-16">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 fixed left-0 h-[calc(100vh-4rem)] top-16">
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
        <Outlet />
      </main>
    </div>
  );
}