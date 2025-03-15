import axios from 'axios';
import { DEFAULT_COVER } from './igdb';

const IGDB_CLIENT_ID = import.meta.env.VITE_IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = import.meta.env.VITE_IGDB_CLIENT_SECRET;

interface IGDBAuth {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    id: number;
    url: string;
  };
  genres?: Array<{
    id: number;
    name: string;
  }>;
  summary?: string;
  first_release_date?: number;
}

export interface Game {
  id: string;
  name: string;
  coverUrl: string;
  description?: string;
  releaseDate?: string;
  genres?: string[];
}

class IGDBClient {
  private static instance: IGDBClient;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private constructor() {}

  public static getInstance(): IGDBClient {
    if (!IGDBClient.instance) {
      IGDBClient.instance = new IGDBClient();
    }
    return IGDBClient.instance;
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post<IGDBAuth>(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: IGDB_CLIENT_ID,
            client_secret: IGDB_CLIENT_SECRET,
            grant_type: 'client_credentials'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    } catch (error) {
      console.error('IGDB Authentication failed:', error);
      throw new Error('Failed to authenticate with IGDB');
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  private async makeRequest<T>(endpoint: string, body: string): Promise<T> {
    await this.ensureAuthenticated();

    try {
      const response = await axios.post<T>(`/igdb${endpoint}`, body, {
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'text/plain'
        }
      });

      return response.data;
    } catch (error) {
      console.error('IGDB API request failed:', error);
      throw error;
    }
  }

  public async searchGames(query: string): Promise<Game[]> {
    const body = `
      search "${query}";
      fields name, cover.url, genres.name, summary, first_release_date;
      where category = 0 & version_parent = null;
      limit 20;
    `;

    try {
      const games = await this.makeRequest<IGDBGame[]>('/games', body);
      return games.map(game => this.transformGame(game));
    } catch (error) {
      console.error('Failed to search games:', error);
      return [];
    }
  }

  public async getPopularGames(): Promise<Game[]> {
    const body = `
      fields name, cover.url, genres.name, summary, first_release_date;
      where category = 0 & version_parent = null;
      sort popularity desc;
      limit 20;
    `;

    try {
      const games = await this.makeRequest<IGDBGame[]>('/games', body);
      return games.map(game => this.transformGame(game));
    } catch (error) {
      console.error('Failed to get popular games:', error);
      return [];
    }
  }

  public transformGame(game: IGDBGame): Game {
    return {
      id: game.id.toString(),
      name: game.name,
      coverUrl: game.cover ? 
        `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : 
        DEFAULT_COVER,
      description: game.summary,
      releaseDate: game.first_release_date ? 
        new Date(game.first_release_date * 1000).toISOString() : 
        undefined,
      genres: game.genres?.map(g => g.name)
    };
  }
}

// Export singleton instance
export const igdbClient = IGDBClient.getInstance();