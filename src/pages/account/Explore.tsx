import React, { useState, useEffect } from 'react';
import { Search, Trophy, Users, TrendingUp, Gamepad, Loader2 } from 'lucide-react';
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

// Game cover images mapping
const GAME_COVERS: Record<string, string> = {
  'Valorant': 'https://cdn.cloudflare.steamstatic.com/steam/apps/2284190/header.jpg',
  'Counter-Strike 2': 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
  'Apex Legends': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg',
  'Fortnite': 'https://cdn.akamai.steamstatic.com/steam/apps/1665460/header.jpg',
  'Call of Duty: Warzone': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1962663/header.jpg',
  'League of Legends': 'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt9a2715ced150cb6c/5ef1374f6aaf2924fb240ba5/league-client-update.jpg',
  'Dota 2': 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg',
  'Overwatch 2': 'https://cdn.cloudflare.steamstatic.com/steam/apps/2357570/header.jpg',
  'Minecraft': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/header.jpg',
  'Grand Theft Auto V': 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg',
  'Elden Ring': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
  'Cyberpunk 2077': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
  'Baldur\'s Gate 3': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg',
  'Starfield': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/header.jpg',
  'Diablo IV': 'https://blz-contentstack-images.akamaized.net/v3/assets/blt77f4425de611b362/blt6d7b0fd8453e72b9/646e720a71d2143e3e4da6b5/d4-open-graph_001.jpg',
  'World of Warcraft': 'https://blz-contentstack-images.akamaized.net/v3/assets/blt3452e3b114fab0cd/bltd4f5d41c1022ed6d/6384ae4746dd6510aa3137fd/WoW_WotLK_Social-Thumbnail_JP.png',
  'Destiny 2': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/header.jpg',
  'Rainbow Six Siege': 'https://cdn.cloudflare.steamstatic.com/steam/apps/359550/header.jpg',
  'FIFA 24': 'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/header.jpg',
  'NBA 2K24': 'https://cdn.cloudflare.steamstatic.com/steam/apps/2338770/header.jpg',
  'Rocket League': 'https://cdn.cloudflare.steamstatic.com/steam/apps/252950/header.jpg',
  'Roblox': 'https://images.rbxcdn.com/d66ae37d46e00a1ecacfe9531986690a.jpg',
  'Among Us': 'https://cdn.cloudflare.steamstatic.com/steam/apps/945360/header.jpg',
  'Genshin Impact': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1971870/header.jpg',
  'Palworld': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1623730/header.jpg'
};

// Default cover for games without a specific cover
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800';

interface Category {
  id: string;
  name: string;
  games: string[];
  icon: React.ReactNode;
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [clips, setClips] = useState<GameClip[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Categories with their associated games - using exact game names from the database
  const categories: Category[] = [
    {
      id: 'fps',
      name: 'FPS',
      icon: <Trophy className="w-4 h-4" />,
      games: [
        'Valorant',
        'Counter-Strike 2',
        'Apex Legends',
        'Call of Duty: Warzone',
        'Rainbow Six Siege',
        'Overwatch 2'
      ]
    },
    {
      id: 'moba',
      name: 'MOBA',
      icon: <TrendingUp className="w-4 h-4" />,
      games: [
        'League of Legends',
        'Dota 2'
      ]
    },
    {
      id: 'battle-royale',
      name: 'Battle Royale',
      icon: <Users className="w-4 h-4" />,
      games: [
        'Fortnite',
        'PUBG: BATTLEGROUNDS',
        'Apex Legends',
        'Call of Duty: Warzone'
      ]
    },
    {
      id: 'rpg',
      name: 'RPG',
      icon: <Gamepad className="w-4 h-4" />,
      games: [
        'Elden Ring',
        'Baldur\'s Gate 3',
        'Cyberpunk 2077',
        'Starfield',
        'Diablo IV',
        'World of Warcraft'
      ]
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
      const transformedGames: Game[] = (gamesData || []).map((game: any) => ({
        name: game.game,
        clipCount: game.clip_count,
        activePlayers: Math.floor(Math.random() * 200000) + 50000, // Mock data
        trending: Math.floor(Math.random() * 40) + 10, // Mock data
        coverUrl: GAME_COVERS[game.game] || DEFAULT_COVER
      }));

      setGames(transformedGames);

      // Build the query
      let query = supabase
        .from('clips_with_profiles')
        .select('*')
        .eq('visibility', 'public');

      // Apply category filter
      if (selectedCategory) {
        const categoryGames = categories.find(c => c.id === selectedCategory)?.games || [];
        if (categoryGames.length > 0) {
          query = query.in('game', categoryGames);
        }
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.ilike('game', `%${searchQuery.trim()}%`);
      }

      // Add ordering
      query = query.order('created_at', { ascending: false });

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
      <div className="max-w-7xl mx-auto px-4">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex justify-center space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center space-x-2 ${
              !selectedCategory
                ? 'bg-[#9FE64F] text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Gamepad className="w-4 h-4" />
            <span>All Games</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center space-x-2 ${
                selectedCategory === category.id
                  ? 'bg-[#9FE64F] text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {category.icon}
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Games */}
      <div className="max-w-7xl mx-auto px-4">
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
                  loading="lazy"
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
      <div className="max-w-7xl mx-auto px-4">
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
            <Loader2 className="w-8 h-8 animate-spin text-[#9FE64F]" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadGamesAndClips}
              className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Try Again</span>
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