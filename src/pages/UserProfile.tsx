import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Profile from '../components/Profile';
import ClipGrid from '../components/ClipGrid';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export default function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select(`
            user_id,
            username,
            avatar_url,
            bio,
            favorite_games,
            followers,
            following,
            views
          `)
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        if (data) {
          setUser({
            id: data.user_id,
            username: data.username,
            avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${data.username}`,
            bio: data.bio || 'No bio yet',
            followers: data.followers || 0,
            following: data.following || 0,
            views: data.views || 0,
            favoriteGames: data.favorite_games || []
          });

          document.title = `${data.username} - Gamefolio`;
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [userId]);

  if (loading) {
    return <div className="min-h-screen bg-black pt-20">Loading...</div>;
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
          <ClipGrid clips={[]} />
        </div>
      </div>
    </div>
  );
}