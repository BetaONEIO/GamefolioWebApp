import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Search, X } from 'lucide-react';

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

export default function OnboardingModal() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const filteredGames = popularGames.filter(game =>
    game.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(false);
        return;
      }

      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('username', username)
          .single();

        setUsernameAvailable(!data && !error);
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username]);

  const handleGameSelect = (game: string) => {
    if (selectedGames.includes(game)) {
      setSelectedGames(selectedGames.filter(g => g !== game));
    } else if (selectedGames.length < 5) {
      setSelectedGames([...selectedGames, game]);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!username || username.length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }
      if (!usernameAvailable) {
        setError('Username is not available');
        return;
      }
      setStep(2);
      setError(null);
    } else {
      if (selectedGames.length < 5) {
        setError('Please select 5 games');
        return;
      }
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          username,
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
        p_details: { username, favorite_games: selectedGames }
      });

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
            {step === 1 ? 'Choose Your Username' : 'Select Your Favorite Games'}
          </h2>
          <p className="text-gray-400">
            {step === 1
              ? 'This will be your unique identifier in the community'
              : 'Choose 5 games you love to play or watch'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="Enter username"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
              />
              {username.length >= 3 && (
                <div className="absolute right-3 top-3">
                  {checkingUsername ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  ) : usernameAvailable ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <X className="w-6 h-6 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Username must be at least 3 characters long and can only contain letters, numbers, and underscores.
            </p>
          </div>
        ) : (
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
        )}

        <div className="mt-8 flex justify-end space-x-4">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-400 hover:text-white"
              disabled={loading}
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={loading || (step === 1 && (!username || !usernameAvailable))}
            className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{step === 1 ? 'Next' : 'Complete'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}