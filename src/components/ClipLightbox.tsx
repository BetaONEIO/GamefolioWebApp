import React from 'react';
import { GameClip } from '../types';
import { X, Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ClipLightboxProps {
  clip: GameClip;
  onClose: () => void;
}

export default function ClipLightbox({ clip, onClose }: ClipLightboxProps) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex w-full max-w-7xl h-[80vh] mx-4">
        {/* Video/Image Section */}
        <div className="flex-1 bg-black">
          <div className="relative h-full">
            <img
              src={clip.thumbnail}
              alt={clip.title}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Comments Section */}
        <div className="w-[400px] bg-gray-900 flex flex-col">
          {/* Clip Info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center space-x-3 mb-3">
              <Link to={`/user/${clip.userId}`}>
                <img
                  src={clip.userAvatar}
                  alt={clip.username}
                  className="w-10 h-10 rounded-full hover:ring-2 hover:ring-[#9FE64F] transition-all"
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
            <p className="text-sm text-gray-300 mt-2">
              Playing {clip.game} • {new Date(clip.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Sample Comments */}
            <div className="flex space-x-3">
              <Link to="/user/commenter1">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                  alt="Commenter"
                  className="w-8 h-8 rounded-full hover:ring-2 hover:ring-[#9FE64F] transition-all"
                />
              </Link>
              <div>
                <p className="text-sm">
                  <Link 
                    to="/user/commenter1"
                    className="font-medium text-white hover:text-[#9FE64F] transition-colors"
                  >
                    GameMaster
                  </Link>
                  <span className="text-gray-400 ml-2">Insane play! 🔥</span>
                </p>
                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                  <span>2h ago</span>
                  <button>Like</button>
                  <button>Reply</button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Link to="/user/commenter2">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
                  alt="Commenter"
                  className="w-8 h-8 rounded-full hover:ring-2 hover:ring-[#9FE64F] transition-all"
                />
              </Link>
              <div>
                <p className="text-sm">
                  <Link 
                    to="/user/commenter2"
                    className="font-medium text-white hover:text-[#9FE64F] transition-colors"
                  >
                    ProPlayer
                  </Link>
                  <span className="text-gray-400 ml-2">What settings are you using?</span>
                </p>
                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                  <span>5h ago</span>
                  <button>Like</button>
                  <button>Reply</button>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Actions */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button className="text-white hover:text-gray-300">
                  <Heart className="w-6 h-6" />
                </button>
                <button className="text-white hover:text-gray-300">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="text-white hover:text-gray-300">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
              <div className="text-sm text-white">
                {clip.likes.toLocaleString()} likes
              </div>
            </div>

            {/* Comment Input */}
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#9FE64F]"
              />
              <button className="text-[#9FE64F] hover:text-[#8FD63F]">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}