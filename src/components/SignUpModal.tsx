import React from 'react';
import { X } from 'lucide-react';

interface SignUpModalProps {
  onClose: () => void;
}

export default function SignUpModal({ onClose }: SignUpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <img 
            src="https://i.imgur.com/YourLogoURL.png" 
            alt="Gamefolio" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-white mb-2">Join Gamefolio</h2>
          <p className="text-gray-400">
            Want to build your own gaming portfolio? Sign up and start uploading your clips!
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#9FE64F] hover:bg-[#8FD63F] text-black font-medium py-3 rounded-lg transition-colors"
          >
            Sign Up
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          Already have an account?{' '}
          <button className="text-[#9FE64F] hover:text-[#8FD63F] font-medium">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}