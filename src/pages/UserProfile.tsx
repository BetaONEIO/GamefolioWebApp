import React from 'react';
import { useParams } from 'react-router-dom';
import Profile from '../components/Profile';
import ClipGrid from '../components/ClipGrid';

// Mock data - replace with Supabase data fetching
const getMockUserData = (userId: string) => ({
  id: userId,
  username: 'ProGamer123',
  avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
  bio: 'Professional esports player specializing in FPS games. 3x Tournament Champion. Content Creator.',
  followers: 15600,
  following: 342,
  views: 1200000,
  favoriteGames: ['Valorant', 'CS:GO', 'Apex Legends', 'Overwatch 2', 'Call of Duty']
});

const getMockUserClips = (userId: string) => [
  {
    id: '1',
    userId,
    username: 'ProGamer123',
    userAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
    title: 'Insane 1v5 Clutch!',
    videoUrl: '#',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    game: 'Valorant',
    likes: 1200,
    comments: 89,
    shares: 45,
    createdAt: '2024-02-20T12:00:00Z'
  },
  {
    id: '2',
    userId,
    username: 'ProGamer123',
    userAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
    title: 'New Gaming Setup Tour',
    videoUrl: '#',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
    game: 'Setup Tour',
    likes: 2400,
    comments: 156,
    shares: 89,
    createdAt: '2024-02-19T15:30:00Z'
  }
];

export default function UserProfile() {
  const { userId } = useParams();
  const user = getMockUserData(userId!);
  const clips = getMockUserClips(userId!);

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