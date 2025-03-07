import React, { useState, useEffect } from 'react';
import Profile from '../../components/Profile';
import ClipGrid from '../../components/ClipGrid';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatar } from '../../lib/avatar';
import { supabase } from '../../lib/supabase';
import { GameClip } from '../../types';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

type Tab = 'gamefolio' | 'clips' | 'liked';

export default function MyGamefolio() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('gamefolio');
  const [clips, setClips] = useState<GameClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      loadUserProfile();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      loadClips();
    }
  }, [activeTab, session]);

  async function loadUserProfile() {
    try {
      const { data, error } = await supabase
        .from('users_with_roles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async function loadClips() {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
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
        `);

      if (activeTab === 'clips') {
        query = query
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
      } else if (activeTab === 'liked') {
        // Get clips that the user has liked
        const { data: likedClips, error: likesError } = await supabase
          .from('likes')
          .select('clip_id')
          .eq('user_id', session.user.id);

        if (likesError) throw likesError;

        const clipIds = likedClips.map(like => like.clip_id);
        
        if (clipIds.length === 0) {
          setClips([]);
          return;
        }

        query = query
          .in('id', clipIds)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedClips: GameClip[] = (data || []).map(clip => ({
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
    } catch (error) {
      console.error('Error loading clips:', error);
      setError('Failed to load clips');
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#9FE64F]" />
      </div>
    );
  }

  // Transform profile data to match User type
  const user = {
    id: profile.id,
    username: profile.username,
    avatar: profile.avatar_url,
    bio: profile.bio || 'No bio yet',
    followers: profile.followers || 0,
    following: profile.following || 0,
    views: profile.views || 0,
    favoriteGames: profile.favorite_games || [],
    socialLinks: profile.social_links || {}
  };

  return (
    <div>
      <Profile user={user} isOwnProfile={true} />
      <div className="mt-8">
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('gamefolio')}
              className={`pb-4 ${
                activeTab === 'gamefolio'
                  ? 'text-white border-b-2 border-[#9FE64F]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              My Gamefolio
            </button>
            <button
              onClick={() => setActiveTab('clips')}
              className={`pb-4 ${
                activeTab === 'clips'
                  ? 'text-white border-b-2 border-[#9FE64F]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              My Clips
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`pb-4 ${
                activeTab === 'liked'
                  ? 'text-white border-b-2 border-[#9FE64F]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Liked
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#9FE64F] mx-auto" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            {error}
            <button
              onClick={loadClips}
              className="block mx-auto mt-4 text-[#9FE64F] hover:text-[#8FD63F]"
            >
              Try Again
            </button>
          </div>
        ) : clips.length > 0 ? (
          <ClipGrid clips={clips} />
        ) : (
          <div className="text-center py-12 text-gray-400">
            {activeTab === 'clips' ? (
              <>
                <p>You haven't uploaded any clips yet.</p>
                <button className="mt-4 bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg">
                  Upload Your First Clip
                </button>
              </>
            ) : activeTab === 'liked' ? (
              <>
                <p>You haven't liked any clips yet.</p>
                <Link
                  to="/account/explore"
                  className="mt-4 inline-block bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg"
                >
                  Explore Clips
                </Link>
              </>
            ) : (
              <>
                <p>Your Gamefolio is empty.</p>
                <button className="mt-4 bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg">
                  Start Building Your Gamefolio
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}