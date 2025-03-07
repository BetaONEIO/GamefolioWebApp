import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, AtSign, Bell, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import { getUserAvatar } from '../lib/avatar';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actors:user_profiles!actor_id(username, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);

      // Mark notifications as read
      if (data && data.length > 0) {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .in('id', data.map(n => n.id));

        if (updateError) console.error('Error marking notifications as read:', updateError);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-[#9FE64F]" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-[#9FE64F]" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-[#9FE64F]" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-[#9FE64F]" />;
      default:
        return <Bell className="w-4 h-4 text-[#9FE64F]" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-[400px] bg-gray-900 rounded-lg shadow-lg border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#9FE64F]" />
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">
          {error}
          <button
            onClick={loadNotifications}
            className="text-[#9FE64F] hover:text-[#8FD63F] block mx-auto mt-2"
          >
            Try Again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          No notifications yet
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-800 transition-colors flex items-start space-x-3 ${
                !notification.read ? 'bg-[#9FE64F]/5' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {notification.data?.actorId ? (
                  <Link to={`/@${notification.data.actorUsername}`}>
                    <img
                      src={getUserAvatar({ 
                        username: notification.data.actorUsername || '', 
                        avatar_url: null 
                      })}
                      alt={notification.data.actorUsername}
                      className="w-10 h-10 rounded-full"
                    />
                  </Link>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#9FE64F]/20 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-white">
                    <span className="font-medium">
                      {notification.data?.actorUsername && (
                        <Link 
                          to={`/@${notification.data.actorUsername}`}
                          className="hover:text-[#9FE64F]"
                        >
                          {notification.data.actorUsername}
                        </Link>
                      )}
                    </span>{' '}
                    {notification.message}
                  </p>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {notification.data?.clipId && (
                  <Link
                    to={`/clip/${notification.data.clipId}`}
                    className="mt-2 text-sm text-gray-400 hover:text-[#9FE64F] block truncate"
                  >
                    {notification.title}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}