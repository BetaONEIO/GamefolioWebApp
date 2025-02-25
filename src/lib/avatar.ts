import { User } from '../types';

// Define avatar variations with different style parameters
const AVATAR_VARIATIONS = [
  { colors: ['9FE64F'], sides: 1, texture: 0 },  // Classic
  { colors: ['9FE64F'], sides: 2, texture: 1 },  // Dual-sided
  { colors: ['9FE64F'], sides: 3, texture: 2 },  // Triple-sided
  { colors: ['9FE64F'], sides: 1, texture: 3 },  // Textured
  { colors: ['9FE64F'], sides: 2, texture: 4 },  // Complex
  { colors: ['9FE64F'], sides: 3, texture: 5 },  // Detailed
  { colors: ['9FE64F'], sides: 1, texture: 6 },  // Minimal
  { colors: ['9FE64F'], sides: 2, texture: 7 },  // Geometric
  { colors: ['9FE64F'], sides: 3, texture: 8 },  // Abstract
  { colors: ['9FE64F'], sides: 1, texture: 9 },  // Futuristic
  { colors: ['9FE64F'], sides: 2, texture: 10 }, // Retro
  { colors: ['9FE64F'], sides: 3, texture: 11 }  // Modern
];

// Helper function to get a deterministic variation based on username
function getVariation(username: string): typeof AVATAR_VARIATIONS[0] {
  // Use the username to generate a consistent index
  const charSum = username.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const index = charSum % AVATAR_VARIATIONS.length;
  return AVATAR_VARIATIONS[index];
}

// Helper function to generate consistent robot avatar URLs
export function getAvatarUrl(username: string) {
  const variation = getVariation(username);
  const params = new URLSearchParams({
    seed: username,
    backgroundColor: variation.colors[0],
    primaryColor: '000000',
    sides: variation.sides.toString(),
    texture: variation.texture.toString()
  });

  return `https://api.dicebear.com/7.x/bottts/svg?${params.toString()}`;
}

// Helper function to get user's avatar with fallback
export function getUserAvatar(user: { username: string; avatar_url?: string | null }) {
  return user.avatar_url || getAvatarUrl(user.username);
}