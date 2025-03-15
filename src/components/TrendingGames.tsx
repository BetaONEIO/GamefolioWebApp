import React, { useState, useEffect } from 'react';
import { Trophy, Users, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DEFAULT_COVERS, DEFAULT_COVER } from '../lib/igdb';

interface Game {
  name: string;
  clipCount: number;
  activePlayers: number;
  trending: number;
  coverUrl: string;
}

export default function TrendingGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadTrendingGames();
  }, [retryCount]);

  async function loadTrendingGames() {
    try {
      setLoading(true);
      setError(null);
      
      // Get trending games from Supabase
      const { data: gamesData, error: gamesError } = await supabase.rpc('get_trending_games');

      if (gamesError) throw gamesError;

      // Transform games data
      const transformedGames: Game[] = (gamesData || []).map((game: any) => ({
        name: game.game,
        clipCount: game.clip_count,
        activePlayers: Math.floor(Math.random() * 200000) + 50000, // Mock data
        trending: Math.floor(Math.random() * 40) + 10, // Mock data
        coverUrl: DEFAULT_COVERS[game.game] || DEFAULT_COVER
      }));

      setGames(transformedGames);
    } catch (error) {
      console.error('Error loading trending games:', error);
      setError(error instanceof Error ? error.message : 'Failed to load trending games');
    } finally {
      setLoading(false);
    }
  }

  const handleRetry = () => {
    setRetryCount(count => count + 1);
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Trending Games</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-900 rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-800" />
              <div className="p-4">
                <div className="h-4 bg-gray-800 rounded w-2/3 mb-3" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Trending Games</h2>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Trending Games</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {games.map((game) => (
          <div
            key={game.name}
            className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#9FE64F] transition-all"
          >
            <div className="aspect-video relative">
              <img
                src={game.coverUrl}
                alt={game.name}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                fetchpriority="high"
              />
              <div className="absolute top-2 right-2 bg-[#9FE64F] text-black px-2 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>+{game.trending}%</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-white mb-3">{game.name}</h3>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{(game.activePlayers / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4" />
                  <span>{(game.clipCount / 1000).toFixed(1)}K clips</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}