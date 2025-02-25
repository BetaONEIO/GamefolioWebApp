import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Search } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

const popularGames = [
  'Valorant',
  'League of Legends',
  'Counter-Strike 2',
  'Apex Legends',
  'Fortnite',
  'Call of Duty: Warzone',
  'Dota 2',
  'Overwatch 2',
  'Minecraft',
  'Grand Theft Auto V',
  'Elden Ring',
  'Cyberpunk 2077',
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const navigate = useNavigate();
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredGames = popularGames.filter(game =>
    game.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGameSelect = (game: string) => {
    if (selectedGames.includes(game)) {
      setSelectedGames(selectedGames.filter(g => g !== game));
    } else if (selectedGames.length < 5) {
      setSelectedGames([...selectedGames, game]);
    }
  };

  const handleComplete = async () => {
    if (selectedGames.length < 5) {
      setError('Please select 5 games');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          favorite_games: selectedGames,
          onboarding_completed: true
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Create activity log
      await supabase.rpc('create_activity_log', {
        p_user_id: user.id,
        p_action_type: 'complete_onboarding',
        p_resource_type: 'profile',
        p_resource_id: user.id,
        p_details: { favorite_games: selectedGames }
      });

      onComplete();
      navigate('/account');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6 relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Select Your Favorite Games
          </h2>
          <p className="text-gray-400">
            Choose 5 games you love to play or watch
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredGames.map((game) => (
              <button
                key={game}
                onClick={() => handleGameSelect(game)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedGames.includes(game)
                    ? 'bg-[#9FE64F] text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
                disabled={selectedGames.length >= 5 && !selectedGames.includes(game)}
              >
                {game}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            Selected {selectedGames.length}/5 games
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleComplete}
            disabled={loading || selectedGames.length < 5}
            className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Complete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}