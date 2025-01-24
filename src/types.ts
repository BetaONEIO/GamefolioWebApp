export interface User {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  views: number;
  favoriteGames: string[];
}

export interface GameClip {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  game: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
}