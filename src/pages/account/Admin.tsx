import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { checkAdminStatus } from '../../lib/admin';
import { Loader2, Shield, UserX, Eye, Ban, CheckCircle, RefreshCw, Mail, Trash2, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  username?: string;
  avatar_url?: string;
  banned?: boolean;
  onboarding_completed?: boolean;
  role?: string;
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
  const [emailSending, setEmailSending] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ [key: string]: boolean }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
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

  async function checkAdminAccess() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      const isUserAdmin = await checkAdminStatus(user.id);
      
      if (!isUserAdmin) {
        console.log('User is not an admin, redirecting');
        navigate('/account');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/account');
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('users_with_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    }
  }

  async function loadClips() {
    try {
      setError(null);
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
      setError('Failed to load clips');
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      setDeleting(prev => ({ ...prev, [userId]: true }));
      setError(null);

      // Check if this is the last admin
      const adminUsers = users.filter(u => u.role === 'admin');
      const isLastAdmin = adminUsers.length === 1 && adminUsers[0].id === userId;
      
      if (isLastAdmin) {
        throw new Error('Cannot delete the last admin user');
      }

      // Delete user's profile first (this will cascade to related data)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Delete from auth.users
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) throw authError;

      // Remove user from local state
      setUsers(users.filter(user => user.id !== userId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setDeleting(prev => ({ ...prev, [userId]: false }));
    }
  }

  async function handleToggleAdmin(userId: string, currentRole?: string) {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      // First check if we're not removing the last admin
      if (newRole === 'user') {
        const adminCount = users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
          setError('Cannot remove the last admin user');
          return;
        }
      }

      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole });

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Failed to update user role');
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
      setError('Failed to update user ban status');
    }
  }

  async function handleResetOnboarding(userId: string) {
    if (!confirm('Are you sure you want to reset this user\'s onboarding status?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: false,
          favorite_games: []
        })
        .eq('user_id', userId);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      setError('Failed to reset onboarding status');
    }
  }

  async function handleSendPasswordReset(userId: string, email: string) {
    try {
      setEmailSending(prev => ({ ...prev, [userId]: true }));
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      alert('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset:', error);
      setError('Failed to send password reset email');
    } finally {
      setEmailSending(prev => ({ ...prev, [userId]: false }));
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
      setError('Failed to delete clip');
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-4">You don't have permission to access the admin panel.</p>
        <button 
          onClick={() => navigate('/account')}
          className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg"
        >
          Back to Account
        </button>
      </div>
    );
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

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
          {error}
          <button
            onClick={() => {
              setError(null);
              activeTab === 'users' ? loadUsers() : loadClips();
            }}
            className="ml-2 text-white hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm User Deletion</h3>
            <div className="text-gray-400 mb-6">
              <p>Are you sure you want to delete this user? This action cannot be undone and will remove:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>User account and authentication data</li>
                <li>Profile information</li>
                <li>All uploaded clips and content</li>
                <li>Comments and interactions</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

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
                            src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || user.email}`}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.username || 'No username'}
                          </div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-[#9FE64F]/20 text-[#9FE64F]'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.banned
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-green-500/20 text-green-500'
                      }`}>
                        {user.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.role)}
                        className="text-[#9FE64F] hover:text-[#8FD63F]"
                        title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      >
                        <Shield className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleBan(user.id, !!user.banned)}
                        className={user.banned ? 'text-green-500 hover:text-green-400' : 'text-red-500 hover:text-red-400'}
                        title={user.banned ? 'Unban user' : 'Ban user'}
                      >
                        {user.banned ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Ban className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSendPasswordReset(user.id, user.email)}
                        disabled={emailSending[user.id]}
                        className="text-gray-400 hover:text-white disabled:opacity-50"
                        title="Send password reset email"
                      >
                        {emailSending[user.id] ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Mail className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleResetOnboarding(user.id)}
                        className="text-gray-400 hover:text-white"
                        title="Reset onboarding"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        disabled={deleting[user.id] || user.role === 'admin'}
                        className="text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={user.role === 'admin' ? 'Cannot delete admin users' : 'Delete user'}
                      >
                        {deleting[user.id] ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
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