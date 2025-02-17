import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UsernameSetupModalProps {
  onComplete: () => void;
}

export default function UsernameSetupModal({ onComplete }: UsernameSetupModalProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(false);
        return;
      }

      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('username', username)
          .single();

        setUsernameAvailable(!data && !error);
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    if (!usernameAvailable) {
      setError('Username is not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_profiles')
        .update({ username })
        .eq('user_id', user.id);

      if (error) throw error;

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set username');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Choose Your Username
          </h2>
          <p className="text-gray-400">
            This will be your unique identifier in the community
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Enter username"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
              disabled={loading}
              required
            />
            {username.length >= 3 && (
              <div className="absolute right-3 top-3">
                {checkingUsername ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : usernameAvailable ? (
                  <span className="text-green-500">✓</span>
                ) : (
                  <X className="w-6 h-6 text-red-500" />
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Username must be at least 3 characters long and can only contain letters, numbers, and underscores.
          </p>

          <button
            type="submit"
            disabled={loading || !username || !usernameAvailable}
            className="w-full bg-[#9FE64F] hover:bg-[#8FD63F] text-black font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Setting username...</span>
              </>
            ) : (
              <span>Set Username</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}