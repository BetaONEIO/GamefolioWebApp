import React from 'react';
import { Trophy, Users, TrendingUp } from 'lucide-react';

interface TrendingGame {
  id: string;
  name: string;
  thumbnail: string;
  activePlayers: number;
  clipCount: number;
  trending: number;
}

// Mock data - replace with real data from Supabase
const mockTrendingGames: TrendingGame[] = [
  {
    id: '1',
    name: 'Valorant',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    activePlayers: 125000,
    clipCount: 8500,
    trending: 25,
  },
  {
    id: '2',
    name: 'League of Legends',
    thumbnail: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=400',
    activePlayers: 245000,
    clipCount: 12400,
    trending: 15,
  },
  {
    id: '3',
    name: 'Elden Ring',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400',
    activePlayers: 89000,
    clipCount: 6200,
    trending: 40,
  },
  {
    id: '4',
    name: 'Counter-Strike 2',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    activePlayers: 185000,
    clipCount: 9800,
    trending: 10,
  },
];

export default function TrendingGames() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Trending Games</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockTrendingGames.map((game) => (
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