import { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  views: number;
  favoriteGames: string[];
  socialLinks?: {
    kick?: string;
    twitch?: string;
    twitter?: string;
    youtube?: string;
    reddit?: string;
    steam?: string;
    playstation?: string;
    xbox?: string;
    nintendo?: string;
  };
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

export interface ActivityLog {
  id: string;
  userId: string;
  actionType: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface UserRole {
  userId: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  username: string | null;
  onboardingCompleted: boolean;
  favoriteGames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession extends Session {
  needsOnboarding?: boolean;
  needsUsername?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: {
    clipId?: string;
    commentId?: string;
    actorId?: string;
    actorUsername?: string;
  };
  createdAt: string;
}