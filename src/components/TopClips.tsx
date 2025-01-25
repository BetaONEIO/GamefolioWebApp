import React, { useState } from 'react';
import ClipGrid from './ClipGrid';
import { GameClip } from '../types';

// Mock data - replace with real data from Supabase
const mockClips: GameClip[] = [
  {
    id: '1',
    userId: '1',
    username: 'ProGamer123',
    userAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
    title: 'Insane 1v5 Clutch!',
    videoUrl: '#',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    game: 'Valorant',
    likes: 12000,
    comments: 890,
    shares: 450,
    createdAt: '2024-02-20T12:00:00Z'
  },
  {
    id: '2',
    userId: '2',
    username: 'GamingQueen',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    title: 'Epic Pentakill',
    videoUrl: '#',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
    game: 'League of Legends',
    likes: 8500,
    comments: 456,
    shares: 289,
    createdAt: '2024-02-19T15:30:00Z'
  },
  {
    id: '3',
    userId: '3',
    username: 'SpeedRunner',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    title: 'New World Record!',
    videoUrl: '#',
    thumbnail: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800',
    game: 'Elden Ring',
    likes: 15890,
    comments: 967,
    shares: 723,
    createdAt: '2024-02-18T22:15:00Z'
  }
];

type TimeRange = 'day' | 'week' | 'month';

export default function TopClips() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');

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
      <ClipGrid clips={mockClips} />
    </div>
  );
}