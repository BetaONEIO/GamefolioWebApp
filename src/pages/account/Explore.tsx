import React, { useState, useEffect } from 'react';
import { Search, Trophy, Users, TrendingUp, Gamepad } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ClipGrid from '../../components/ClipGrid';
import { GameClip } from '../../types';

interface Game {
  name: string;
  clipCount: number;
  activePlayers: number;
  trending: number;
  coverUrl: string;
}

interface Category {
  id: string;
  name: string;
  games: string[];
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [clips, setClips] = useState<GameClip[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock categories - in production these would come from the database
  const categories: Category[] = [
    {
      id: 'fps',
      name: 'FPS',
      games: ['Valorant', 'Counter-Strike 2', 'Apex Legends', 'Call of Duty: Warzone']
    },
    {
      id: 'moba',
      name: 'MOBA',
      games: ['League of Legends', 'Dota 2']
    },
    {
      id: 'battle-royale',
      name: 'Battle Royale',
      games: ['Fortnite', 'PUBG: BATTLEGROUNDS', 'Apex Legends']
    },
    {
      id: 'rpg',
      name: 'RPG',
      games: ['Elden Ring', 'Baldur\'s Gate 3', 'Cyberpunk 2077']
    }
  ];

  useEffect(() => {
    loadGamesAndClips();
  }, [selectedCategory, searchQuery]);

  async function loadGamesAndClips() {
    try {
      setLoading(true);
      setError(null);

      // Get trending games
      const { data: gamesData, error: gamesError } = await supabase.rpc('get_trending_games');

      if (gamesError) throw gamesError;

      // Transform games data
      const transformedGames: Game[] = (gamesData || []).map((game: any, index: number) => ({
        name: game.game,
        clipCount: game.clip_count,
        activePlayers: Math.floor(Math.random() * 200000) + 50000, // Mock data
        trending: Math.floor(Math.random() * 40) + 10, // Mock data
        coverUrl: `https://images.unsplash.com/photo-${1550745165 + index}?w=400` // Mock covers
      }));

      setGames(transformedGames);

      // Get clips with filters using the view
      let query = supabase
        .from('clips_with_profiles')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      // Apply category filter
      if (selectedCategory) {
        const categoryGames = categories.find(c => c.id === selectedCategory)?.games || [];
        query = query.in('game', categoryGames);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.ilike('game', `%${searchQuery}%`);
      }

      const { data: clipsData, error: clipsError } = await query.limit(12);

      if (clipsError) throw clipsError;

      const formattedClips: GameClip[] = (clipsData || []).map(clip => ({
        id: clip.id,
        userId: clip.user_id,
        username: clip.username,
        userAvatar: clip.avatar_url || getAvatarUrl(clip.username),
        title: clip.title,
        videoUrl: clip.video_url,
        thumbnail: clip.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
        game: clip.game,
        likes: clip.likes || 0,
        comments: clip.comments || 0,
        shares: clip.shares || 0,
        createdAt: clip.created_at
      }));

      setClips(formattedClips);
    } catch (error) {
      console.error('Error loading explore data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const getAvatarUrl = (username: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=9FE64F&textColor=000000`;
  };

  return (
    <div className="space-y-8">
      {/* Search and Categories */}
      <div className="space-y-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              !selectedCategory
                ? 'bg-[#9FE64F] text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All Games
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-[#9FE64F] text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Top Games */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Top Games</h2>
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

      {/* Top Clips */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">
          {selectedCategory 
            ? `Top ${categories.find(c => c.id === selectedCategory)?.name} Clips`
            : searchQuery
              ? 'Search Results'
              : 'Top Clips'
          }
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-[#9FE64F] border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={loadGamesAndClips}
              className="mt-4 text-[#9FE64F] hover:text-[#8FD63F]"
            >
              Try Again
            </button>
          </div>
        ) : clips.length > 0 ? (
          <ClipGrid clips={clips} />
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Gamepad className="w-12 h-12 mx-auto mb-4" />
            <p>No clips found. Try a different search or category!</p>
          </div>
        )}
      </div>
    </div>
  );
}