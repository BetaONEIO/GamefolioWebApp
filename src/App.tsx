import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Header from './components/Header';
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
import { UserProfile as UserProfileType } from './types';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
        setShowOnboarding(!data.onboarding_completed);
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

  if (showOnboarding) {
    return <OnboardingModal />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black text-white">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/user/:userId" element={<UserProfile />} />
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
      </Router>
    </AuthProvider>
  );
}

export default App;