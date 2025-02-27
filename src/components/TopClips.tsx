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
      
      // Get clips with user profiles using the view
      const { data: clipsData, error: clipsError } = await supabase
        .from('clips_with_profiles')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(12);

      if (clipsError) {
        if (clipsError.code === '429') {
          throw new Error('Too many requests. Please try again in a few minutes.');
        }
        throw clipsError;
      }

      if (!clipsData || clipsData.length === 0) {
        setClips([]);
        return;
      }

      const formattedClips: GameClip[] = clipsData.map(clip => ({
        id: clip.id,
        userId: clip.user_id,
        username: clip.username || 'Unknown User',
        userAvatar: clip.avatar_url || getUserAvatar(clip.username || 'unknown'),
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
      setError(error instanceof Error ? error.message : 'Failed to load clips. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleRetry = () => {
    setRetryCount(count => count + 1);
  };

  // Helper function to get avatar URL
  const getUserAvatar = (username: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=9FE64F&textColor=000000`;
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