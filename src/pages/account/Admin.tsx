import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Shield, UserX, Eye, Ban, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  user_roles?: {
    role: string;
  };
  user_profiles?: {
    username: string;
    banned: boolean;
  };
}

interface Clip {
  id: string;
  title: string;
  game: string;
  created_at: string;
  user_profiles: {
    username: string;
  };
  thumbnail_url: string;
  video_url: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'clips'>('users');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'users') {
        loadUsers();
      } else {
        loadClips();
      }
    }
  }, [isAdmin, activeTab]);

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'admin') {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  }

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_roles (role),
          user_profiles (username, banned)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function loadClips() {
    try {
      const { data, error } = await supabase
        .from('clips')
        .select(`
          id,
          title,
          game,
          created_at,
          thumbnail_url,
          video_url,
          user_profiles (username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClips(data || []);
    } catch (error) {
      console.error('Error loading clips:', error);
    }
  }

  async function handleToggleAdmin(userId: string, currentRole?: string) {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole });

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  }

  async function handleToggleBan(userId: string, currentlyBanned: boolean) {
    if (!confirm(currentlyBanned 
      ? 'Are you sure you want to unban this user?' 
      : 'Are you sure you want to ban this user?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ banned: !currentlyBanned })
        .eq('user_id', userId);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Error toggling user ban:', error);
      alert('Failed to update user ban status');
    }
  }

  async function handleDeleteClip(clipId: string) {
    if (!confirm('Are you sure you want to delete this clip?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clips')
        .delete()
        .eq('id', clipId);

      if (error) throw error;
      loadClips();
    } catch (error) {
      console.error('Error deleting clip:', error);
      alert('Failed to delete clip');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#9FE64F]" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'users'
                ? 'bg-[#9FE64F] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('clips')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'clips'
                ? 'bg-[#9FE64F] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Clips
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={`https://ui-avatars.com/api/?name=${user.user_profiles?.username || user.email}`}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.user_profiles?.username || 'No username'}
                          </div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.user_roles?.role === 'admin'
                          ? 'bg-[#9FE64F]/20 text-[#9FE64F]'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {user.user_roles?.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.user_profiles?.banned
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-green-500/20 text-green-500'
                      }`}>
                        {user.user_profiles?.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.user_roles?.role)}
                        className="text-[#9FE64F] hover:text-[#8FD63F]"
                        title={user.user_roles?.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      >
                        <Shield className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleBan(user.id, !!user.user_profiles?.banned)}
                        className={user.user_profiles?.banned ? 'text-green-500 hover:text-green-400' : 'text-red-500 hover:text-red-400'}
                        title={user.user_profiles?.banned ? 'Unban user' : 'Ban user'}
                      >
                        {user.user_profiles?.banned ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Ban className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip) => (
            <div key={clip.id} className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="aspect-video relative group">
                <img
                  src={clip.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'}
                  alt={clip.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                  <a
                    href={clip.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#9FE64F] text-black rounded-full hover:bg-[#8FD63F]"
                  >
                    <Eye className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => handleDeleteClip(clip.id)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-white mb-1">{clip.title}</h3>
                <p className="text-sm text-gray-400">
                  by {clip.user_profiles.username} • {clip.game}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(clip.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}