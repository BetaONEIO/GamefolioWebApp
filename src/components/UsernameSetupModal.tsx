import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UsernameSetupModalProps {
  onComplete: () => void;
}

export default function UsernameSetupModal({ onComplete }: UsernameSetupModalProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Function to validate username format
  const validateUsername = (value: string) => {
    // Must start with a letter and only contain letters, numbers, and underscores
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/;
    return usernameRegex.test(value);
  };

  useEffect(() => {
    const checkUsername = async () => {
      const trimmedUsername = username.trim();
      
      // Clear states when empty
      if (!trimmedUsername) {
        setUsernameAvailable(false);
        setError(null);
        return;
      }

      // Validate format first
      if (!validateUsername(trimmedUsername)) {
        setUsernameAvailable(false);
        setError('Username must start with a letter and can only contain letters, numbers, and underscores');
        return;
      }

      setCheckingUsername(true);
      setError(null);

      try {
        // Check if username exists using count instead of single
        const { count, error } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .ilike('username', trimmedUsername);

        if (error) throw error;
        
        // If count is 0, username is available
        setUsernameAvailable(count === 0);
        if (count > 0) {
          setError('Username is already taken');
        } else {
          setError(null);
        }
      } catch (error) {
        console.error('Error checking username:', error);
        setError('Error checking username availability');
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Username is required');
      return;
    }

    if (!validateUsername(trimmedUsername)) {
      setError('Username must start with a letter and can only contain letters, numbers, and underscores');
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

      // First get the current profile to check if it's a temporary username
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Failed to fetch current profile');
      }

      // Update the username
      const { error } = await supabase
        .from('user_profiles')
        .update({ username: trimmedUsername })
        .eq('user_id', user.id);

      if (error) {
        console.error('Update error:', error);
        throw new Error(error.message || 'Failed to set username');
      }

      onComplete();
    } catch (err) {
      console.error('Error setting username:', err);
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
              onChange={(e) => setUsername(e.target.value)}
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
          <div className="text-sm text-gray-400 space-y-2">
            <p>Username requirements:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Must be between 3 and 30 characters</li>
              <li>Must start with a letter</li>
              <li>Can only contain letters, numbers, and underscores</li>
              <li>Cannot contain spaces or special characters</li>
            </ul>
          </div>

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