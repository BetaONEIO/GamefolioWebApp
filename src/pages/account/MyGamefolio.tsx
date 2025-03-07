import React, { useState, useEffect } from 'react';
import Profile from '../../components/Profile';
import ClipGrid from '../../components/ClipGrid';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatar } from '../../lib/avatar';
import { supabase } from '../../lib/supabase';
import { GameClip } from '../../types';
import { Link } from 'react-router-dom';

type Tab = 'gamefolio' | 'clips' | 'liked';

export default function MyGamefolio() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('gamefolio');
  const [clips, setClips] = useState<GameClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock user data with session info
  const mockUser = {
    id: session?.user.id || '123',
    username: session?.user.email?.split('@')[0] || 'DemoPlayer',
    avatar: getUserAvatar({ username: session?.user.email || 'DemoPlayer', avatar_url: null }),
    bio: 'Professional gamer and content creator. Sharing my best gaming moments!',
    followers: 1250,
    following: 450,
    views: 25000,
    favoriteGames: ['Valorant', 'Counter-Strike 2', 'Apex Legends', 'Overwatch 2', 'Call of Duty: Warzone'],
    socialLinks: {
      twitch: 'demoplayer',
      youtube: 'DemoPlayer',
      twitter: 'demoplayer',
      steam: 'demoplayer'
    }
  };

  useEffect(() => {
    loadClips();
  }, [activeTab]);

  async function loadClips() {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('clips')
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
          created_at,
          user_profiles (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'clips') {
        query = query.eq('user_id', session.user.id);
      } else if (activeTab === 'liked') {
        query = query
          .eq('likes.user_id', session.user.id)
          .innerJoin('likes', { 'clips.id': 'likes.clip_id' });
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedClips: GameClip[] = (data || []).map(clip => ({
        id: clip.id,
        userId: clip.user_id,
        username: clip.user_profiles.username,
        userAvatar: clip.user_profiles.avatar_url,
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

  return (
    <div>
      <Profile user={mockUser} isOwnProfile={true} />
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
            <div className="animate-spin w-8 h-8 border-2 border-[#9FE64F] border-t-transparent rounded-full mx-auto"></div>
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