import axios from 'axios';

// Default game covers for fallback
export const DEFAULT_COVERS: Record<string, string> = {
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
export const DEFAULT_COVER = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800';

interface Game {
  id: string;
  name: string;
  coverUrl: string;
}

// Return a list of popular games with default covers
export function getPopularGames(): Game[] {
  return Object.entries(DEFAULT_COVERS).map(([name, coverUrl]) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name,
    coverUrl
  }));
}

// Search games using the default list
export function searchGames(query: string): Game[] {
  const normalizedQuery = query.toLowerCase();
  return Object.entries(DEFAULT_COVERS)
    .filter(([name]) => name.toLowerCase().includes(normalizedQuery))
    .map(([name, coverUrl]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      coverUrl
    }));
}