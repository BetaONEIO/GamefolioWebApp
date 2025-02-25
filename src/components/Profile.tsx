import React, { useState } from 'react';
import { User } from '../types';
import { Users, Activity, Eye, MessageCircle, Edit2, Camera, Twitch, Youtube, Twitter, Stamp as Steam, TowerControl as GameController, Link as LinkIcon } from 'lucide-react';
import SignUpModal from './SignUpModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getUserAvatar } from '../lib/avatar';

interface ProfileProps {
  user: User;
  isOwnProfile?: boolean;
}

interface SocialLinks {
  kick?: string;
  twitch?: string;
  twitter?: string;
  youtube?: string;
  reddit?: string;
  steam?: string;
  playstation?: string;
  xbox?: string;
  nintendo?: string;
}

// Social media platform configurations
const SOCIAL_PLATFORMS = {
  kick: {
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.442 14.252l-3.37-3.37-2.137 2.138 3.369 3.369a1 1 0 01-1.414 1.414l-3.37-3.369-2.138 2.137a1 1 0 01-1.414-1.414l2.138-2.137-3.37-3.37a1 1 0 011.414-1.414l3.37 3.37 2.137-2.138-3.369-3.369a1 1 0 011.414-1.414l3.37 3.369 2.138-2.137a1 1 0 011.414 1.414l-2.138 2.137 3.37 3.37a1 1 0 01-1.414 1.414z"/>
      </svg>
    ),
    baseUrl: 'https://kick.com/',
    label: 'Kick'
  },
  twitch: {
    icon: Twitch,
    baseUrl: 'https://twitch.tv/',
    label: 'Twitch'
  },
  youtube: {
    icon: Youtube,
    baseUrl: 'https://youtube.com/',
    label: 'YouTube'
  },
  twitter: {
    icon: Twitter,
    baseUrl: 'https://twitter.com/',
    label: 'Twitter'
  },
  steam: {
    icon: Steam,
    baseUrl: 'https://steamcommunity.com/id/',
    label: 'Steam'
  },
  playstation: {
    icon: GameController,
    baseUrl: 'https://psnprofiles.com/',
    label: 'PlayStation'
  },
  xbox: {
    icon: GameController,
    baseUrl: 'https://account.xbox.com/profile?gamertag=',
    label: 'Xbox'
  },
  nintendo: {
    icon: GameController,
    baseUrl: '#',
    label: 'Nintendo'
  }
};

export default function Profile({ user, isOwnProfile = false }: ProfileProps) {
  const { session } = useAuth();
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user.bio);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(user.socialLinks || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = () => {
    setShowSignUpModal(true);
  };

  const handleSave = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          bio,
          social_links: socialLinks
        })
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    setLoading(true);
    setError(null);

    try {
      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-8 text-white">
      <div className="px-4">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#9FE64F]">
              <img 
                src={user.avatar || getUserAvatar({ username: user.username, avatar_url: null })} 
                alt={user.username} 
                className="w-full h-full object-cover"
              />
            </div>
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 bg-[#9FE64F] p-2 rounded-full cursor-pointer hover:bg-[#8FD63F] transition-colors">
                <Camera className="w-5 h-5 text-black" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </label>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <div className="flex items-center space-x-3">
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-full font-medium flex items-center space-x-2"
                    disabled={loading}
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleAction}
                      className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-full font-medium"
                    >
                      Follow
                    </button>
                    <button
                      onClick={handleAction}
                      className="border border-gray-600 hover:border-[#9FE64F] text-white px-6 py-2 rounded-full font-medium flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write something about yourself..."
                  className="w-full bg-gray-800 text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F] resize-none"
                  rows={3}
                />
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg font-medium"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <p className="text-gray-400 mb-4">{bio}</p>
            )}
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>{user.followers.toLocaleString()} followers</span>
              </div>
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                <span>{user.following.toLocaleString()} following</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                <span>{user.views.toLocaleString()} views</span>
              </div>
            </div>

            {/* Social Links */}
            {!isEditing && Object.entries(socialLinks).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {Object.entries(socialLinks).map(([platform, username]) => {
                  if (!username || !SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS]) return null;
                  
                  const { icon: Icon, baseUrl, label } = SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];
                  return (
                    <a
                      key={platform}
                      href={`${baseUrl}${username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded-full text-sm hover:bg-[#9FE64F] hover:text-black transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Favorite Games</h2>
            <div className="flex flex-wrap gap-2">
              {user.favoriteGames.map((game) => (
                <span
                  key={game}
                  className="px-3 py-1 bg-gray-800 rounded-full text-sm hover:bg-[#9FE64F] hover:text-black transition-colors"
                >
                  {game}
                </span>
              ))}
            </div>
          </div>

          {isEditing && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Gaming Profiles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(SOCIAL_PLATFORMS).map(([platform, { icon: Icon, label }]) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </label>
                    <input
                      type="text"
                      value={socialLinks[platform as keyof SocialLinks] || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                      placeholder={`Your ${label} username`}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSignUpModal && (
        <SignUpModal onClose={() => setShowSignUpModal(false)} />
      )}
    </div>
  );
}