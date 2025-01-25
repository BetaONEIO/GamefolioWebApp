import React, { useState, useRef } from 'react';
import { X, Upload as UploadIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UploadModalProps {
  onClose: () => void;
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [game, setGame] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title || !game) return;

    try {
      setUploading(true);
      setError(null);

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload video to storage
      const videoFileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError, data: videoData } = await supabase.storage
        .from('clips')
        .upload(videoFileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get video URL
      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('clips')
        .getPublicUrl(videoFileName);

      // Create clip record in database
      const { error: dbError } = await supabase
        .from('clips')
        .insert({
          user_id: user.id,
          title,
          game,
          video_url: videoUrl,
        });

      if (dbError) throw dbError;

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload clip');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          disabled={uploading}
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Upload Clip</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? 'border-[#9FE64F] bg-[#9FE64F]/10' : 'border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-white">{selectedFile.name}</p>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-sm text-red-400 hover:text-red-300"
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-white mb-2">Drag and drop your clip here, or</p>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-[#9FE64F] hover:text-[#8FD63F]"
                    disabled={uploading}
                  >
                    browse files
                  </button>
                </div>
                <p className="text-sm text-gray-400">Maximum file size: 500MB</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              onChange={handleChange}
              className="hidden"
              disabled={uploading}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
                placeholder="Enter a title for your clip"
                disabled={uploading}
              />
            </div>

            <div>
              <label htmlFor="game" className="block text-sm font-medium text-white mb-2">
                Game
              </label>
              <input
                id="game"
                type="text"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
                placeholder="What game is this clip from?"
                disabled={uploading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-white hover:bg-gray-800"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || !title || !game || uploading}
              className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Upload</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}