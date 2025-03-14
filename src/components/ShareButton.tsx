import React, { useState } from 'react';
import { Share2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShareButtonProps {
  clipId: string;
  username: string;
  title: string;
  currentShares: number;
  showCount?: boolean;
  size?: 'sm' | 'md';
}

export default function ShareButton({ 
  clipId, 
  username, 
  title, 
  currentShares,
  showCount = true,
  size = 'sm'
}: ShareButtonProps) {
  const [showCopied, setShowCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    try {
      setLoading(true);
      // Create share URL
      const shareUrl = `${window.location.origin}/@${username}/clips/${clipId}`;
      
      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Check out this clip by ${username}`,
          url: shareUrl
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }

      // Update share count
      const { error } = await supabase
        .from('clips')
        .update({ shares: currentShares + 1 })
        .eq('id', clipId);

      if (error) throw error;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing clip:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <button 
      onClick={handleShare}
      disabled={loading}
      className={`flex items-center space-x-1 text-gray-400 hover:text-white relative ${textSize}`}
    >
      {loading ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : (
        <Share2 className={iconSize} />
      )}
      {showCount && <span>{currentShares}</span>}
      
      {showCopied && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-[#9FE64F] text-black text-sm rounded-full whitespace-nowrap">
          <div className="flex items-center space-x-1">
            <LinkIcon className="w-3 h-3" />
            <span>Link copied!</span>
          </div>
        </div>
      )}
    </button>
  );
}