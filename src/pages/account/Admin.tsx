import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ActivityLog, UserRole } from '../../types';
import { Loader2, Shield, UserX, Key, AlertTriangle } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');

  useEffect(() => {
    checkAdminStatus();
    if (isAdmin) {
      loadUsers();
      loadActivities();
    }
  }, [isAdmin]);

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
      const { data: users, error } = await supabase
        .from('auth.users')
        .select(`
          *,
          user_roles (role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function loadActivities() {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_user', { user_id: userId });
      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  }

  async function handleToggleAdmin(userId: string, currentRole: string) {
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

  async function handleResetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      alert('Password reset email sent');
    } catch (error) {
      console.error('Error sending reset password:', error);
      alert('Failed to send password reset email');
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
        <h1 className="text-2xl font-bold">Admin Panel</h1>
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
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'activity'
                ? 'bg-[#9FE64F] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Activity
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
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.email}
                          </div>
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
                        onClick={() => handleResetPassword(user.email)}
                        className="text-yellow-500 hover:text-yellow-400"
                        title="Reset password"
                      >
                        <Key className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-400"
                        title="Delete user"
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-gray-900 rounded-lg p-4 flex items-start space-x-4"
            >
              <div className="bg-gray-800 rounded-full p-2">
                {activity.actionType === 'upload' ? (
                  <Upload className="w-5 h-5 text-[#9FE64F]" />
                ) : activity.actionType === 'delete' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <Activity className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white">
                  <span className="font-medium">{activity.userId}</span>
                  {' '}performed a{' '}
                  <span className="text-[#9FE64F]">{activity.actionType}</span>
                  {' '}action on{' '}
                  <span className="text-[#9FE64F]">{activity.resourceType}</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
                {Object.keys(activity.details).length > 0 && (
                  <pre className="mt-2 p-2 bg-gray-800 rounded text-sm text-gray-300 overflow-x-auto">
                    {JSON.stringify(activity.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}