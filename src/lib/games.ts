import { igdbClient, IGDBGame } from './igdb-api';
import { supabase } from './supabase';
import { DEFAULT_COVER } from './igdb';

export interface Game {
  id: string;
  name: string;
  coverUrl: string;
  description?: string;
  releaseDate?: string;
  genres?: string[];
}

export interface GameSearchOptions {
  category?: string;
  genre?: string;
}

// Search games using IGDB
export async function searchGames(query: string, options: GameSearchOptions = {}): Promise<Game[]> {
  try {
    // First try IGDB search
    const igdbGames = await igdbClient.searchGames(query);
    return igdbGames.map(game => igdbClient.transformGame(game));
  } catch (error) {
    console.error('IGDB search failed, falling back to local search:', error);
    
    // Fallback to database search
    const { data: games, error: dbError } = await supabase
      .from('games')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(20);

    if (dbError) throw dbError;
    
    return (games || []).map(game => ({
      id: game.id,
      name: game.name,
      coverUrl: game.cover_url || DEFAULT_COVER,
      description: game.description,
      releaseDate: game.release_date,
      genres: game.genres
    }));
  }
}

// Get popular games
export async function getPopularGames(): Promise<Game[]> {
  try {
    const igdbGames = await igdbClient.getPopularGames();
    return igdbGames.map(game => igdbClient.transformGame(game));
  } catch (error) {
    console.error('Failed to fetch popular games from IGDB:', error);
    
    // Fallback to database
    const { data: games, error: dbError } = await supabase
      .from('games')
      .select('*')
      .order('popularity', { ascending: false })
      .limit(20);

    if (dbError) throw dbError;
    
    return (games || []).map(game => ({
      id: game.id,
      name: game.name,
      coverUrl: game.cover_url || DEFAULT_COVER,
      description: game.description,
      releaseDate: game.release_date,
      genres: game.genres
    }));
  }
}

// Get game details
export async function getGameDetails(gameId: string): Promise<Game> {
  try {
    const game = await igdbClient.getGameById(parseInt(gameId));
    return igdbClient.transformGame(game);
  } catch (error) {
    console.error('Failed to fetch game details from IGDB:', error);
    
    // Fallback to database
    const { data: game, error: dbError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (dbError) throw dbError;
    
    return {
      id: game.id,
      name: game.name,
      coverUrl: game.cover_url || DEFAULT_COVER,
      description: game.description,
      releaseDate: game.release_date,
      genres: game.genres
    };
  }
}

// Get game clips
export async function getGameClips(gameId: string) {
  const { data, error } = await supabase.rpc('get_game_clips', {
    game_name: gameId,
    limit_count: 20
  });

  if (error) throw error;
  return data;
}

// Get game stats
export async function getGameStats(gameId: string) {
  const { data, error } = await supabase.rpc('get_game_stats', {
    game_name: gameId
  });

  if (error) throw error;
  return data;
}