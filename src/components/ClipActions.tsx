import React, { useState } from 'react';
import { MoreVertical, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClipActionsProps {
  clipId: string;
  userId: string;
  currentTitle: string;
  onUpdate: () => void;
}

export default function ClipActions({ clipId, userId, currentTitle, onUpdate }: ClipActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('clips')
        .update({ title: title.trim() })
        .eq('id', clipId)
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate();
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating clip:', err);
      setError(err instanceof Error ? err.message : 'Failed to update clip');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('clips')
        .delete()
        .eq('id', clipId)
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate();
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting clip:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete clip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg py-1 border border-gray-800">
            <button
              onClick={() => {
                setShowMenu(false);
                setShowEditModal(true);
              }}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Title</span>
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setShowDeleteConfirm(true);
              }}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Clip</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold text-white mb-4">Edit Clip Title</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
                placeholder="Enter a new title"
              />

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-white hover:bg-gray-800 rounded-lg"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={loading || !title.trim()}
                  className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold text-white mb-4">Delete Clip</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}

            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this clip? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-white hover:bg-gray-800 rounded-lg"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Clip</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}