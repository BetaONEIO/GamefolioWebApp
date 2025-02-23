import React, { useState, useEffect } from 'react';
import ClipGrid from './ClipGrid';
import { GameClip } from '../types';
import { supabase } from '../lib/supabase';
import { Loader2, RefreshCcw } from 'lucide-react';

type TimeRange = 'day' | 'week' | 'month';

export default function TopClips() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [clips, setClips] = useState<GameClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadClips();
  }, [timeRange, retryCount]);

  async function loadClips() {
    try {
      setLoading(true);
      setError(null);
      
      // First get the clips
      const { data: clipsData, error: clipsError } = await supabase
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
          created_at
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(12);

      if (clipsError) throw clipsError;

      if (!clipsData || clipsData.length === 0) {
        setClips([]);
        return;
      }

      // Then get the user profiles for these clips
      const userIds = [...new Set(clipsData.map(clip => clip.user_id))];
      const profiles = await Promise.all(
        userIds.map(userId =>
          supabase
            .from('user_profiles')
            .select('user_id, username')
            .eq('user_id', userId)
            .single()
            .then(({ data, error }) => {
              if (error) throw error;
              return data;
            })
        )
      );

      // Create a map of user_id to username
      const userMap = new Map(profiles.map(profile => [profile.user_id, profile.username]));

      const formattedClips: GameClip[] = clipsData.map(clip => ({
        id: clip.id,
        userId: clip.user_id,
        username: userMap.get(clip.user_id) || 'Unknown User',
        userAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400', // Default avatar
        title: clip.title,
        videoUrl: clip.video_url,
        thumbnail: clip.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', // Default thumbnail
        game: clip.game,
        likes: clip.likes || 0,
        comments: clip.comments || 0,
        shares: clip.shares || 0,
        createdAt: clip.created_at
      }));

      setClips(formattedClips);
    } catch (error) {
      console.error('Error loading clips:', error);
      setError('Failed to load clips. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleRetry = () => {
    setRetryCount(count => count + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Top Clips</h2>
        <div className="flex space-x-2">
          {(['day', 'week', 'month'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-[#9FE64F] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#9FE64F]" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-[#9FE64F] text-black rounded-lg hover:bg-[#8FD63F] transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      ) : clips.length > 0 ? (
        <ClipGrid clips={clips} />
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p>No clips found. Be the first to upload!</p>
        </div>
      )}
    </div>
  );
}