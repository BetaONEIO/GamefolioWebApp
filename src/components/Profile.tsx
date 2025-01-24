import React, { useState } from 'react';
import { User } from '../types';
import { Users, Activity, Eye, MessageCircle } from 'lucide-react';
import SignUpModal from './SignUpModal';

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const handleAction = () => {
    setShowSignUpModal(true);
  };

  return (
    <div className="pt-20 pb-8 text-white">
      <div className="px-4">
        <div className="flex items-center space-x-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#9FE64F]">
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAction}
                  className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-full font-medium"
                >
                  Follow
                </button>
                <button
                  onClick={handleAction}
                  className="border border-gray-600 hover:border-[#9FE64F] text-white px-6 py-2 rounded-full font-medium flex items-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </div>
            </div>
            <p className="text-gray-400 mb-4">{user.bio}</p>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>{user.followers.toLocaleString()} followers</span>
              </div>
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                <span>{user.following.toLocaleString()} following</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                <span>{user.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Favorite Games</h2>
          <div className="flex flex-wrap gap-2">
            {user.favoriteGames.map((game) => (
              <span
                key={game}
                className="px-3 py-1 bg-gray-800 rounded-full text-sm hover:bg-[#9FE64F] hover:text-black transition-colors"
              >
                {game}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showSignUpModal && (
        <SignUpModal onClose={() => setShowSignUpModal(false)} />
      )}
    </div>
  );
}