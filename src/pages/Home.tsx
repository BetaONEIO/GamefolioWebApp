import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, Search, Compass, PlayCircle, MessageCircle, Bell, PlusSquare, BarChart2, User, Settings, Menu, X } from 'lucide-react';
import TopClips from '../components/TopClips';
import TrendingGames from '../components/TrendingGames';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

const navItems = [
  { to: '/', icon: HomeIcon, label: 'Home', end: true },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/clips', icon: PlayCircle, label: 'Clips' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/create', icon: PlusSquare, label: 'Create' },
  { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export default function Home() {
  const { session } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="lg:hidden fixed top-20 left-4 z-50 p-2 text-gray-400 hover:text-white"
        >
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Sidebar - Hidden on mobile unless menu is open */}
        <aside className={`${
          showMobileMenu ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 bg-gray-900 border-r border-gray-800 fixed left-0 h-[calc(100vh-4rem)] top-16 transition-transform duration-300 ease-in-out z-40`}>
          <nav className="p-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setShowMobileMenu(false)}
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
        <main className={`flex-1 transition-all duration-300 ${
          showMobileMenu ? 'lg:ml-64' : 'ml-0 lg:ml-64'
        } pt-28 pb-12`}>
          <div className="max-w-7xl mx-auto px-4">
            {!session && (
              <div className="bg-gray-900 rounded-lg p-8 mb-12 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">
                  Welcome to Gamefolio
                </h1>
                <p className="text-gray-400 mb-6">
                  Join our gaming community to share your best gaming moments and connect with other players.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-3 rounded-lg font-medium"
                >
                  Get Started
                </button>
              </div>
            )}
            
            <div className="space-y-12">
              <TopClips />
              <TrendingGames />
            </div>
          </div>
        </main>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
        )}
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} defaultMode="signup" />
      )}
    </div>
  );
}