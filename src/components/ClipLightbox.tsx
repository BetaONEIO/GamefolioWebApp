import React, { useState, useEffect } from 'react';
import { GameClip } from '../types';
import { X, Heart, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import ShareButton from './ShareButton';

interface ClipLightboxProps {
  clip: GameClip;
  onClose: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  users_with_roles: {
    username: string;
    avatar_url: string;
  };
}

export default function ClipLightbox({ clip, onClose }: ClipLightboxProps) {
  const { session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(clip.likes);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAvatarUrl = (username: string) => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=9FE64F&textColor=000000`;
  };

  useEffect(() => {
    loadComments();
    if (session) {
      checkIfLiked();
    }
  }, [clip.id, session]);

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          users_with_roles!user_id (
            username,
            avatar_url
          )
        `)
        .eq('clip_id', clip.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  async function checkIfLiked() {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('clip_id', clip.id)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  }

  async function handleLike() {
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('clip_id', clip.id)
          .eq('user_id', session.user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ clip_id: clip.id, user_id: session.user.id });

        if (error) {
          if (error.message.includes('confirmed')) {
            throw new Error('Please verify your email before liking clips');
          }
          throw error;
        }
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setError(error instanceof Error ? error.message : 'Failed to like clip');
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          clip_id: clip.id,
          user_id: session.user.id,
          content: newComment.trim()
        });

      if (error) {
        if (error.message.includes('confirmed')) {
          throw new Error('Please verify your email before commenting');
        }
        throw error;
      }

      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      setError(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex flex-col lg:flex-row w-full max-w-7xl h-[80vh]">
        {/* Video Section */}
        <div className="flex-1 bg-black">
          <div className="relative h-full">
            <video
              src={clip.videoUrl}
              poster={clip.thumbnail}
              controls
              autoPlay
              playsInline
              preload="auto"
              className="w-full h-full object-contain"
            >
              <source src={clip.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Comments Section */}
        <div className="w-full lg:w-[400px] bg-gray-900 flex flex-col h-full">
          {/* Clip Info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center space-x-3 mb-3">
              <Link to={`/@${clip.username}`}>
                <img
                  src={clip.userAvatar || getAvatarUrl(clip.username)}
                  alt={clip.username}
                  className="w-10 h-10 rounded-full hover:ring-2 hover:ring-[#9FE64F] transition-all"
                />
              </Link>
              <div>
                <h3 className="font-medium text-white">{clip.title}</h3>
                <Link 
                  to={`/@${clip.username}`}
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
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}
            
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Link to={`/@${comment.users_with_roles.username}`}>
                  <img
                    src={comment.users_with_roles.avatar_url || getAvatarUrl(comment.users_with_roles.username)}
                    alt={comment.users_with_roles.username}
                    className="w-8 h-8 rounded-full hover:ring-2 hover:ring-[#9FE64F] transition-all"
                  />
                </Link>
                <div>
                  <p className="text-sm">
                    <Link 
                      to={`/@${comment.users_with_roles.username}`}
                      className="font-medium text-white hover:text-[#9FE64F] transition-colors"
                    >
                      {comment.users_with_roles.username}
                    </Link>
                    <span className="text-gray-400 ml-2">{comment.content}</span>
                  </p>
                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Engagement Actions */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleLike}
                  className={`flex items-center space-x-1 ${
                    isLiked ? 'text-[#9FE64F]' : 'text-white hover:text-gray-300'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likesCount}</span>
                </button>
                <button className="text-white hover:text-gray-300">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <ShareButton
                  clipId={clip.id}
                  username={clip.username}
                  title={clip.title}
                  currentShares={clip.shares}
                  size="md"
                  showCount={false}
                />
              </div>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleComment} className="flex items-center space-x-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#9FE64F]"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="text-[#9FE64F] hover:text-[#8FD63F] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}