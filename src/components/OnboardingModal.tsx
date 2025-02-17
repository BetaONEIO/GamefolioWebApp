import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Search, X, Eye, EyeOff } from 'lucide-react';

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

const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, text: 'At least 8 characters long' },
  { regex: /[A-Z]/, text: 'Contains at least one uppercase letter' },
  { regex: /[a-z]/, text: 'Contains at least one lowercase letter' },
  { regex: /[0-9]/, text: 'Contains at least one number' },
  { regex: /[^A-Za-z0-9]/, text: 'Contains at least one special character' },
];

export default function OnboardingModal() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const filteredGames = popularGames.filter(game =>
    game.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const passwordStrength = PASSWORD_REQUIREMENTS.filter(req => req.regex.test(password)).length;
  const passwordsMatch = password === confirmPassword;

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

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (!PASSWORD_REQUIREMENTS.every(req => req.regex.test(password))) {
      setError('Password does not meet all requirements');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
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
      if (!validatePassword()) {
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
            {step === 1 ? 'Create Your Profile' : 'Select Your Favorite Games'}
          </h2>
          <p className="text-gray-400">
            {step === 1
              ? 'Choose a username and secure password'
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

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className={`w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F] ${
                  confirmPassword && !passwordsMatch ? 'border-red-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-400 font-medium">Password Requirements:</p>
              <div className="space-y-1">
                {PASSWORD_REQUIREMENTS.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className={req.regex.test(password) ? 'text-green-500' : 'text-gray-500'}>
                      {req.regex.test(password) ? '✓' : '○'}
                    </span>
                    <span className={`text-sm ${req.regex.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {confirmPassword && !passwordsMatch && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
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
            disabled={loading || (step === 1 && (!username || !usernameAvailable || !validatePassword()))}
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