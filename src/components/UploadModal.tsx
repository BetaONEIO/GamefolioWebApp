import React, { useState, useRef, useEffect } from 'react';
import { X, Upload as UploadIcon, Loader2, Globe, User, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GameSearch from './GameSearch';

interface UploadModalProps {
  onClose: () => void;
}

interface UploadDestinations {
  feed: boolean;
  gamefolio: boolean;
}

interface ThumbnailOption {
  url: string;
  blob: Blob;
  timestamp: number;
}

// Maximum file size in bytes (500MB)
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Supported video formats
const SUPPORTED_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/quicktime'
];

export default function UploadModal({ onClose }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [game, setGame] = useState('');
  const [destinations, setDestinations] = useState<UploadDestinations>({
    feed: true,
    gamefolio: false
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailOptions, setThumbnailOptions] = useState<ThumbnailOption[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<number>(0);
  const [customThumbnail, setCustomThumbnail] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return `Unsupported file format. Please upload MP4, WebM, or MOV files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 500MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`;
    }
    return null;
  };

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
    setError(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      generateThumbnails(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      generateThumbnails(file);
    }
  };

  const generateThumbnails = async (videoFile: File) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) return;

    video.src = URL.createObjectURL(videoFile);
    await video.load();

    // Wait for metadata to load
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Generate 3 thumbnails at 10%, 50%, and 90% of the duration
    const timestamps = [
      video.duration * 0.1,  // 10%
      video.duration * 0.5,  // 50%
      video.duration * 0.9   // 90%
    ];

    const thumbnails: ThumbnailOption[] = [];

    for (const timestamp of timestamps) {
      video.currentTime = timestamp;
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
      });

      thumbnails.push({
        url: URL.createObjectURL(blob),
        blob,
        timestamp
      });
    }

    setThumbnailOptions(thumbnails);
    URL.revokeObjectURL(video.src);
  };

  const handleCustomThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCustomThumbnail(file);
      setSelectedThumbnail(-1); // -1 indicates custom thumbnail
    }
  };

  const toggleDestination = (dest: keyof UploadDestinations) => {
    setDestinations(prev => {
      const newDestinations = { ...prev, [dest]: !prev[dest] };
      if (!newDestinations.feed && !newDestinations.gamefolio) {
        return prev;
      }
      return newDestinations;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title || !game) return;

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user has a username set
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile.username) {
        throw new Error('Please set your username before uploading clips');
      }

      // Upload video with progress tracking
      const videoFileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('clips')
        .upload(videoFileName, selectedFile, {
          contentType: selectedFile.type,
          cacheControl: '3600',
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            setUploadProgress(percentage);
          }
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('clips')
        .getPublicUrl(videoFileName);

      // Upload selected thumbnail
      let thumbnailUrl = null;
      if (selectedThumbnail === -1 && customThumbnail) {
        // Upload custom thumbnail
        const thumbnailFileName = `${user.id}/${Date.now()}-thumbnail.jpg`;
        const { error: thumbnailError } = await supabase.storage
          .from('clips')
          .upload(thumbnailFileName, customThumbnail, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });

        if (thumbnailError) throw thumbnailError;

        const { data: { publicUrl } } = supabase.storage
          .from('clips')
          .getPublicUrl(thumbnailFileName);

        thumbnailUrl = publicUrl;
      } else if (selectedThumbnail >= 0 && thumbnailOptions[selectedThumbnail]) {
        // Upload generated thumbnail
        const thumbnailFileName = `${user.id}/${Date.now()}-thumbnail.jpg`;
        const { error: thumbnailError } = await supabase.storage
          .from('clips')
          .upload(thumbnailFileName, thumbnailOptions[selectedThumbnail].blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });

        if (thumbnailError) throw thumbnailError;

        const { data: { publicUrl } } = supabase.storage
          .from('clips')
          .getPublicUrl(thumbnailFileName);

        thumbnailUrl = publicUrl;
      }

      // Create clip record in database
      const { error: dbError } = await supabase
        .from('clips')
        .insert({
          user_id: user.id,
          title,
          game,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          visibility: destinations.feed ? 'public' : 'private'
        })
        .single();

      if (dbError) throw dbError;

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload clip');
    } finally {
      setUploading(false);
    }
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      thumbnailOptions.forEach(option => URL.revokeObjectURL(option.url));
    };
  }, [thumbnailOptions]);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 overflow-hidden">
      <div className="relative w-full max-w-2xl h-[90vh] m-4 flex flex-col bg-gray-900 rounded-lg">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-800">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-white">Upload Clip</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-amber-400/10 rounded-lg">
            <h3 className="font-medium text-amber-400 mb-2">Supported Formats:</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• MP4 (H.264 codec)</li>
              <li>• WebM (VP8/VP9)</li>
              <li>• MOV (QuickTime)</li>
              <li>• Maximum file size: 500MB</li>
              <li>• Recommended resolution: 1080p (1920x1080)</li>
              <li>• Aspect ratio: 16:9 preferred</li>
            </ul>
          </div>

          <form className="space-y-6">
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
                <div className="space-y-4">
                  <div className="aspect-video relative">
                    <video
                      ref={videoRef}
                      src={URL.createObjectURL(selectedFile)}
                      className="w-full h-full object-contain rounded"
                      controls
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <p className="text-white">{selectedFile.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setThumbnailOptions([]);
                      if (videoRef.current) {
                        URL.revokeObjectURL(videoRef.current.src);
                      }
                    }}
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

            {thumbnailOptions.length > 0 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-white">
                  Choose Thumbnail
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {thumbnailOptions.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedThumbnail(index)}
                      className={`aspect-video relative rounded-lg overflow-hidden ${
                        selectedThumbnail === index ? 'ring-2 ring-[#9FE64F]' : ''
                      }`}
                    >
                      <img
                        src={option.url}
                        alt={`Thumbnail option ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                        {Math.round(option.timestamp)}s
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                      selectedThumbnail === -1
                        ? 'bg-[#9FE64F] text-black'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Custom Thumbnail</span>
                  </button>
                  {customThumbnail && (
                    <span className="text-sm text-gray-400">
                      {customThumbnail.name}
                    </span>
                  )}
                </div>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCustomThumbnail}
                  className="hidden"
                />
              </div>
            )}

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
                <GameSearch onSelect={setGame} selectedGame={game} />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Share to
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => toggleDestination('feed')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      destinations.feed
                        ? 'border-[#9FE64F] bg-[#9FE64F]/10'
                        : 'border-gray-700 hover:border-[#9FE64F]'
                    }`}
                  >
                    <Globe className="w-6 h-6 mx-auto mb-2 text-[#9FE64F]" />
                    <div className="text-white font-medium">Clips Feed</div>
                    <p className="text-sm text-gray-400 mt-1">Share with everyone</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDestination('gamefolio')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      destinations.gamefolio
                        ? 'border-[#9FE64F] bg-[#9FE64F]/10'
                        : 'border-gray-700 hover:border-[#9FE64F]'
                    }`}
                  >
                    <User className="w-6 h-6 mx-auto mb-2 text-[#9FE64F]" />
                    <div className="text-white font-medium">My Gamefolio</div>
                    <p className="text-sm text-gray-400 mt-1">Add to your profile</p>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-800">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-white hover:bg-gray-800"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || !title || !game || uploading || (!destinations.feed && !destinations.gamefolio)}
              className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-3 bg-black/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-black transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
              ) : (
                <span>Upload</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}