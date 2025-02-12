import React, { useState, useEffect } from 'react';
import { Trophy, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TrendingGame {
  id: string;
  name: string;
  thumbnail: string;
  activePlayers: number;
  clipCount: number;
  trending: number;
}

const defaultThumbnails = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
  'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=400',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400'
];

export default function TrendingGames() {
  const [games, setGames] = useState<TrendingGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingGames();
  }, []);

  async function loadTrendingGames() {
    try {
      setLoading(true);
      
      // Get unique games and their clip counts
      const { data, error } = await supabase
        .from('clips')
        .select('game, count')
        .group('game')
        .order('count', { ascending: false })
        .limit(4);

      if (error) throw error;

      const trendingGames: TrendingGame[] = data.map((game, index) => ({
        id: index.toString(),
        name: game.game,
        thumbnail: defaultThumbnails[index % defaultThumbnails.length],
        activePlayers: Math.floor(Math.random() * 200000) + 50000, // Mock data
        clipCount: parseInt(game.count),
        trending: Math.floor(Math.random() * 40) + 10 // Mock trending percentage
      }));

      setGames(trendingGames);
    } catch (error) {
      console.error('Error loading trending games:', error);
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Trending Games</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#9FE64F] transition-all"
          >
            <div className="aspect-video relative">
              <img
                src={game.thumbnail}
                alt={game.name}
                className="w-full h-full object-cover"
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