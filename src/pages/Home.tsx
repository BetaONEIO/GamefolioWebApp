import React from 'react';
import TopClips from '../components/TopClips';
import TrendingGames from '../components/TrendingGames';

export default function Home() {
  return (
    <div className="min-h-screen bg-black pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="space-y-12">
          <TopClips />
          <TrendingGames />
        </div>
      </div>
    </div>
  );
}