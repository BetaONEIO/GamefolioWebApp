import { supabase } from './supabase';

interface Game {
  id: string;
  name: string;
  cover?: string;
  releaseDate?: string;
  genres?: string[];
}

interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
}

// Cache game results to reduce API calls
const gameCache = new Map<string, Game[]>();

// Default popular games list for fallback
const POPULAR_GAMES: Game[] = [
  { id: 'valorant', name: 'Valorant' },
  { id: 'csgo', name: 'Counter-Strike 2' },
  { id: 'apex', name: 'Apex Legends' },
  { id: 'fortnite', name: 'Fortnite' },
  { id: 'warzone', name: 'Call of Duty: Warzone' },
  { id: 'lol', name: 'League of Legends' },
  { id: 'dota2', name: 'Dota 2' },
  { id: 'overwatch2', name: 'Overwatch 2' },
  { id: 'minecraft', name: 'Minecraft' },
  { id: 'gtav', name: 'Grand Theft Auto V' },
  { id: 'elden-ring', name: 'Elden Ring' },
  { id: 'cyberpunk', name: 'Cyberpunk 2077' },
  { id: 'baldurs-gate-3', name: 'Baldur\'s Gate 3' },
  { id: 'starfield', name: 'Starfield' },
  { id: 'diablo4', name: 'Diablo IV' },
  { id: 'wow', name: 'World of Warcraft' },
  { id: 'destiny2', name: 'Destiny 2' },
  { id: 'r6siege', name: 'Rainbow Six Siege' },
  { id: 'fifa24', name: 'FIFA 24' },
  { id: 'nba2k24', name: 'NBA 2K24' },
  { id: 'rocket-league', name: 'Rocket League' },
  { id: 'roblox', name: 'Roblox' },
  { id: 'among-us', name: 'Among Us' },
  { id: 'genshin-impact', name: 'Genshin Impact' },
  { id: 'palworld', name: 'Palworld' },
];

// Twitch API credentials
const TWITCH_CLIENT_ID = '1prd13igz7pgbesbcr6kvj03ttlhj6';
const TWITCH_AUTH_TOKEN = 'fdt04z82yfd64fnm57qmvgpa6n4xu6';

/**
 * Search for games using the Twitch API
 */
async function searchTwitchGames(query: string): Promise<Game[]> {
  try {
    // For empty queries, get top games
    const endpoint = query.trim() 
      ? `https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(query)}`
      : 'https://api.twitch.tv/helix/games/top?first=20';
    
    const response = await fetch(endpoint, {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${TWITCH_AUTH_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Twitch games to our Game format
    const games: Game[] = data.data.map((game: TwitchGame) => ({
      id: game.id,
      name: game.name,
      cover: game.box_art_url?.replace('{width}', '400').replace('{height}', '600')
    }));

    return games;
  } catch (error) {
    console.error('Error fetching games from Twitch:', error);
    throw error;
  }
}

export async function searchGames(query: string): Promise<Game[]> {
  if (!query.trim()) {
    try {
      // Get top games from Twitch
      return await searchTwitchGames('');
    } catch (error) {
      console.error('Error getting top games, using fallback:', error);
      return POPULAR_GAMES.slice(0, 20);
    }
  }

  // Check cache first
  const cacheKey = query.toLowerCase();
  if (gameCache.has(cacheKey)) {
    return gameCache.get(cacheKey) || [];
  }

  try {
    // Try Twitch API first
    try {
      const twitchGames = await searchTwitchGames(query);
      if (twitchGames.length > 0) {
        gameCache.set(cacheKey, twitchGames);
        return twitchGames;
      }
    } catch (twitchError) {
      console.error('Twitch API search failed, falling back to database:', twitchError);
    }
    
    // If Twitch fails, try our database
    const { data: localGames, error: localError } = await supabase
      .from('games')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(20);

    if (!localError && localGames && localGames.length > 0) {
      gameCache.set(cacheKey, localGames);
      return localGames;
    }

    // Fallback to popular games if no results found
    const filteredGames = POPULAR_GAMES.filter(game => 
      game.name.toLowerCase().includes(query.toLowerCase())
    );
    
    gameCache.set(cacheKey, filteredGames);
    return filteredGames;
  } catch (error) {
    console.error('Error searching games:', error);
    
    // Return filtered popular games as fallback
    const filteredGames = POPULAR_GAMES.filter(game => 
      game.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return filteredGames;
  }
}

// Function to get all popular games
export function getPopularGames(): Game[] {
  return [...POPULAR_GAMES];
}

// Function to get top games from Twitch
export async function getTopGames(limit: number = 20): Promise<Game[]> {
  try {
    const games = await searchTwitchGames('');
    return games.slice(0, limit);
  } catch (error) {
    console.error('Error fetching top games:', error);
    return POPULAR_GAMES.slice(0, limit);
  }
}