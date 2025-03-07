import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Profile from '../components/Profile';
import ClipGrid from '../components/ClipGrid';
import { supabase } from '../lib/supabase';
import { User, GameClip } from '../types';
import { Loader2 } from 'lucide-react';

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [clips, setClips] = useState<GameClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      if (!username) return;

      try {
        // Get user profile from users_with_roles view
        const { data: userData, error: userError } = await supabase
          .from('users_with_roles')
          .select(`
            id,
            username,
            avatar_url,
            bio,
            favorite_games,
            followers,
            following,
            views,
            social_links,
            onboarding_completed,
            banned
          `)
          .eq('username', username)
          .single();

        if (userError) throw userError;

        if (!userData) {
          throw new Error('User not found');
        }

        // Transform the data to match our User type
        setUser({
          id: userData.id,
          username: userData.username,
          avatar: userData.avatar_url || null,
          bio: userData.bio || 'No bio yet',
          followers: userData.followers || 0,
          following: userData.following || 0,
          views: userData.views || 0,
          favoriteGames: userData.favorite_games || [],
          socialLinks: userData.social_links || {}
        });

        // Load user's clips
        const { data: clipsData, error: clipsError } = await supabase
          .from('clips_with_profiles')
          .select(`
            id,
            user_id,
            title,
            game,
            video_url,
            thumbnail_url,
            likes,
            comments,
            shares,
            visibility,
            created_at,
            username,
            avatar_url
          `)
          .eq('user_id', userData.id)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false });

        if (clipsError) throw clipsError;

        const formattedClips: GameClip[] = (clipsData || []).map(clip => ({
          id: clip.id,
          userId: clip.user_id,
          username: clip.username,
          userAvatar: clip.avatar_url,
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
        document.title = `${userData.username} - Gamefolio`;
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError('User not found');
        navigate('/404');
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [username, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#9FE64F]" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-black pt-20 text-center">
        <p className="text-red-500">{error || 'User not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Profile user={user} />
      <div className="max-w-7xl mx-auto px-4">
        <div className="mt-8">
          <div className="border-b border-gray-800 mb-8">
            <nav className="flex space-x-8">
              <button className="text-white border-b-2 border-[#9FE64F] pb-4">
                Clips
              </button>
              <button className="text-gray-400 hover:text-white pb-4">
                Gaming Stats
              </button>
              <button className="text-gray-400 hover:text-white pb-4">
                About
              </button>
            </nav>
          </div>
          <ClipGrid clips={clips} />
        </div>
      </div>
    </div>
  );
}