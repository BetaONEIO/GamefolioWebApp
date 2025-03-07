import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Search, X, AlertCircle } from 'lucide-react';
import { searchGames, getTopGames, getPopularGames } from '../lib/games';

interface OnboardingModalProps {
  onComplete: () => void;
}

interface Game {
  id: string;
  name: string;
  cover?: string;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const navigate = useNavigate();
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [topGames, setTopGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load top games on component mount
  useEffect(() => {
    async function loadTopGames() {
      try {
        const games = await getTopGames(30);
        setTopGames(games);
      } catch (error) {
        console.error('Error loading top games:', error);
        setApiError('Could not load top games. Using fallback list.');
        // Use the fallback list from getPopularGames
        setTopGames(getPopularGames());
      }
    }
    
    loadTopGames();
  }, []);

  // Handle game search
  useEffect(() => {
    const searchForGames = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      setApiError(null);
      
      try {
        const games = await searchGames(searchQuery);
        setSearchResults(games);
      } catch (error) {
        console.error('Error searching games:', error);
        setApiError('Game search failed. Try a different search term.');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchForGames, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Filter top games based on search query when not actively searching
  const filteredTopGames = !searchQuery ? 
    topGames : 
    topGames.filter(game => game.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Games to display - search results or filtered top games
  const displayedGames = searchQuery && searchResults.length > 0 ? 
    searchResults : 
    filteredTopGames;

  const handleGameSelect = (gameName: string) => {
    if (selectedGames.includes(gameName)) {
      setSelectedGames(selectedGames.filter(g => g !== gameName));
    } else if (selectedGames.length < 5) {
      setSelectedGames([...selectedGames, gameName]);
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

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setApiError(null);
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
              className="w-full bg-gray-800 text-white pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
            />
            {searchQuery && (
              <button 
                onClick={clearSearch}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {searchLoading && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#9FE64F]" />
            </div>
          )}
          
          {apiError && (
            <div className="flex items-center space-x-2 text-sm text-amber-400 bg-amber-400/10 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{apiError}</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2">
            {displayedGames.length > 0 ? (
              displayedGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(game.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedGames.includes(game.name)
                      ? 'bg-[#9FE64F] text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                  disabled={selectedGames.length >= 5 && !selectedGames.includes(game.name)}
                >
                  {game.name}
                </button>
              ))
            ) : searchLoading ? (
              <div className="w-full text-center py-4 text-gray-400">
                Searching...
              </div>
            ) : (
              <div className="w-full text-center py-4 text-gray-400">
                {searchQuery ? 'No games found. Try a different search term.' : 'Loading games...'}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Selected {selectedGames.length}/5 games
            </p>
            
            {selectedGames.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedGames.map(game => (
                  <div key={game} className="bg-[#9FE64F]/20 text-[#9FE64F] px-3 py-1 rounded-full text-sm flex items-center">
                    {game}
                    <button 
                      onClick={() => handleGameSelect(game)}
                      className="ml-2 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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