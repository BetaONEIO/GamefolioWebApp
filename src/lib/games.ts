import { supabase } from './supabase';

interface Game {
  id: string;
  name: string;
  cover?: string;
  releaseDate?: string;
  genres?: string[];
}

// Cache game results to reduce API calls
const gameCache = new Map<string, Game[]>();

export async function searchGames(query: string): Promise<Game[]> {
  if (!query.trim()) return [];

  // Check cache first
  const cacheKey = query.toLowerCase();
  if (gameCache.has(cacheKey)) {
    return gameCache.get(cacheKey) || [];
  }

  try {
    // First try to search in our database
    const { data: localGames, error: localError } = await supabase
      .from('games')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (!localError && localGames && localGames.length > 0) {
      gameCache.set(cacheKey, localGames);
      return localGames;
    }

    // Fallback to popular games if no results found
    const popularGames: Game[] = [
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
    ].filter(game => 
      game.name.toLowerCase().includes(query.toLowerCase())
    );

    gameCache.set(cacheKey, popularGames);
    return popularGames;
  } catch (error) {
    console.error('Error searching games:', error);
    return [];
  }
}