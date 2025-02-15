import React, { useState, useEffect } from 'react';
import ClipGrid from './ClipGrid';
import { GameClip } from '../types';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

type TimeRange = 'day' | 'week' | 'month';

export default function TopClips() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [clips, setClips] = useState<GameClip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClips();
  }, [timeRange]);

  async function loadClips() {
    try {
      setLoading(true);
      
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
        .order('created_at', { ascending: false })
        .limit(12);

      if (clipsError) throw clipsError;

      // Then get the user profiles for these clips
      const userIds = [...new Set(clipsData.map(clip => clip.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to username
      const userMap = new Map(profilesData.map(profile => [profile.user_id, profile.username]));

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
      setClips([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }

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