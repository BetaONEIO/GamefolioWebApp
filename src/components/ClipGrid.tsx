import React, { useState } from 'react';
import { GameClip } from '../types';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import ClipLightbox from './ClipLightbox';
import { Link } from 'react-router-dom';

interface ClipGridProps {
  clips: GameClip[];
}

export default function ClipGrid({ clips }: ClipGridProps) {
  const [selectedClip, setSelectedClip] = useState<GameClip | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
        {clips.map((clip) => (
          <div key={clip.id} className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="aspect-video relative group">
              <img
                src={clip.thumbnail}
                alt={clip.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  className="bg-[#9FE64F] text-black px-4 py-2 rounded-full hover:bg-[#8FD63F] transition-colors"
                  onClick={() => setSelectedClip(clip)}
                >
                  Watch Clip
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Link to={`/user/${clip.userId}`}>
                  <img
                    src={clip.userAvatar}
                    alt={clip.username}
                    className="w-8 h-8 rounded-full hover:ring-2 hover:ring-[#9FE64F] transition-all"
                  />
                </Link>
                <div>
                  <h3 className="font-medium text-white">{clip.title}</h3>
                  <Link 
                    to={`/user/${clip.userId}`}
                    className="text-sm text-gray-400 hover:text-[#9FE64F] transition-colors"
                  >
                    {clip.username}
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-gray-400 text-sm">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 hover:text-white">
                    <Heart className="w-4 h-4" />
                    <span>{clip.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 hover:text-white">
                    <MessageCircle className="w-4 h-4" />
                    <span>{clip.comments}</span>
                  </button>
                  <button className="flex items-center space-x-1 hover:text-white">
                    <Share2 className="w-4 h-4" />
                    <span>{clip.shares}</span>
                  </button>
                </div>
                <span className="text-xs">{clip.game}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedClip && (
        <ClipLightbox
          clip={selectedClip}
          onClose={() => setSelectedClip(null)}
        />
      )}
    </>
  );
}