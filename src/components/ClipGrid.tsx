import React, { useState } from 'react';
import { GameClip } from '../types';
import { Heart, MessageCircle, Play } from 'lucide-react';
import ClipLightbox from './ClipLightbox';
import ClipActions from './ClipActions';
import ShareButton from './ShareButton';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ClipGridProps {
  clips: GameClip[];
  onUpdate?: () => void;
}

export default function ClipGrid({ clips, onUpdate }: ClipGridProps) {
  const [selectedClip, setSelectedClip] = useState<GameClip | null>(null);
  const { session } = useAuth();

  const getAvatarUrl = (username: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=9FE64F&textColor=000000`;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map((clip) => (
          <div key={clip.id} className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="aspect-video relative group">
              {/* Video Thumbnail */}
              <div className="w-full h-full bg-gray-800">
                {clip.thumbnail ? (
                  <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchpriority="high"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Play className="w-12 h-12 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  className="bg-[#9FE64F] text-black px-6 py-3 rounded-full hover:bg-[#8FD63F] transition-colors flex items-center space-x-2"
                  onClick={() => setSelectedClip(clip)}
                >
                  <Play className="w-5 h-5" />
                  <span>Watch Clip</span>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <Link to={`/@${clip.username}`} className="flex-shrink-0">
                    <img
                      src={clip.userAvatar || getAvatarUrl(clip.username)}
                      alt={clip.username}
                      className="w-8 h-8 rounded-full hover:ring-2 hover:ring-[#9FE64F] transition-all"
                      loading="eager"
                      decoding="async"
                      width="32"
                      height="32"
                    />
                  </Link>
                  <div className="min-w-0">
                    <h3 className="font-medium text-white truncate">{clip.title}</h3>
                    <Link 
                      to={`/@${clip.username}`}
                      className="text-sm text-gray-400 hover:text-[#9FE64F] transition-colors"
                    >
                      {clip.username}
                    </Link>
                  </div>
                </div>

                {/* Show actions menu if user owns the clip */}
                {session?.user && session.user.id === clip.userId && onUpdate && (
                  <ClipActions
                    clipId={clip.id}
                    userId={clip.userId}
                    currentTitle={clip.title}
                    onUpdate={onUpdate}
                  />
                )}
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
                  <ShareButton
                    clipId={clip.id}
                    username={clip.username}
                    title={clip.title}
                    currentShares={clip.shares}
                  />
                </div>
                <span className="text-xs truncate ml-2">{clip.game}</span>
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