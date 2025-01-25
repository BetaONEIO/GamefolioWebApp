import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import AccountLayout from './pages/account/AccountLayout';
import MyGamefolio from './pages/account/MyGamefolio';
import Leaderboard from './pages/account/Leaderboard';
import Account from './pages/account/Account';
import Settings from './pages/account/Settings';
import Explore from './pages/account/Explore';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black text-white">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<MyGamefolio />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="profile" element={<Account />} />
              <Route path="settings" element={<Settings />} />
              <Route path="explore" element={<Explore />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;