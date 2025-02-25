import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import AccountLayout from './pages/account/AccountLayout';
import MyGamefolio from './pages/account/MyGamefolio';
import Leaderboard from './pages/account/Leaderboard';
import Account from './pages/account/Account';
import Settings from './pages/account/Settings';
import Explore from './pages/account/Explore';
import Admin from './pages/account/Admin';
import UserProfile from './pages/UserProfile';
import OnboardingModal from './components/OnboardingModal';
import UsernameSetupModal from './components/UsernameSetupModal';
import { UserProfile as UserProfileType } from './types';

function PageTitle() {
  const location = useLocation();
  const { session } = useAuth();

  useEffect(() => {
    let title = 'Gamefolio';
    const path = location.pathname;

    // Add specific titles based on routes
    if (path === '/') {
      title = 'Gamefolio - Share Your Gaming Moments';
    } else if (path === '/explore') {
      title = 'Explore - Gamefolio';
    } else if (path.startsWith('/account')) {
      if (path === '/account') title = 'My Gamefolio';
      else if (path === '/account/leaderboard') title = 'Leaderboard - Gamefolio';
      else if (path === '/account/profile') title = 'Profile - Gamefolio';
      else if (path === '/account/settings') title = 'Settings - Gamefolio';
      else if (path === '/account/explore') title = 'Explore - Gamefolio';
      else if (path === '/account/admin') title = 'Admin Dashboard - Gamefolio';
    } else if (path.startsWith('/@')) {
      const username = path.slice(2);
      title = `${username} - Gamefolio`;
    }

    document.title = title;
  }, [location]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;

        setProfile(data);
        
        // Always check onboarding status when profile is loaded
        const needsUsername = !data.username || data.username.startsWith('user_');
        const needsOnboarding = !data.onboarding_completed || !data.favorite_games || data.favorite_games.length < 5;

        // Show username setup first if needed
        if (needsUsername) {
          setShowUsernameSetup(true);
          setShowOnboarding(false);
        } 
        // Then show onboarding if needed
        else if (needsOnboarding) {
          setShowOnboarding(true);
          setShowUsernameSetup(false);
        }
        // Otherwise clear both modals
        else {
          setShowOnboarding(false);
          setShowUsernameSetup(false);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [session]);

  if (loading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/" />;
  }

  if (showUsernameSetup) {
    return <UsernameSetupModal onComplete={() => {
      setShowUsernameSetup(false);
      // Check if onboarding is needed after username setup
      if (profile && (!profile.onboarding_completed || !profile.favorite_games || profile.favorite_games.length < 5)) {
        setShowOnboarding(true);
      }
    }} />;
  }

  if (showOnboarding) {
    return <OnboardingModal onComplete={() => setShowOnboarding(false)} />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <PageTitle />
        <div className="min-h-screen bg-black text-white">
          <Header />
          <TopBar />
          <div className="pt-28">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/@:username" element={<UserProfile />} />
              <Route
                path="/account/*"
                element={
                  <ProtectedRoute>
                    <AccountLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<MyGamefolio />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="profile" element={<Account />} />
                <Route path="settings" element={<Settings />} />
                <Route path="explore" element={<Explore />} />
                <Route path="admin" element={<Admin />} />
              </Route>
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;