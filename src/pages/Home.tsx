import React from 'react';
import TopClips from '../components/TopClips';
import TrendingGames from '../components/TrendingGames';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

export default function Home() {
  const { session } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  return (
    <div className="min-h-screen bg-black pt-20 pb-12">
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

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} defaultMode="signup" />
      )}
    </div>
  );
}