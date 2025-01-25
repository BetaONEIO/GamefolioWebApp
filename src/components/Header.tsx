import React, { useState, useRef, useEffect } from 'react';
import { Search, BellDot, Upload, User, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/auth';
import UploadModal from './UploadModal';
import AuthModal from './AuthModal';

export default function Header() {
  const { session } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  const handleUploadClick = () => {
    if (!session) {
      setShowAuthModal(true);
    } else {
      setShowUploadModal(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-black/95 border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="bg-[#9FE64F] w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xl">G</span>
            </div>
            <span className="text-white font-bold text-xl">Gamefolio</span>
          </Link>

          <div className="flex-1 max-w-xs mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clips..."
                className="w-full bg-gray-900 text-white pl-10 pr-4 py-2 rounded-full border border-gray-700 focus:outline-none focus:border-[#9FE64F]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button 
              className="bg-[#9FE64F] hover:bg-[#8FD63F] text-black font-medium px-4 py-2 rounded-full flex items-center space-x-2"
              onClick={handleUploadClick}
            >
              <Upload className="w-5 h-5" />
              <span>Upload</span>
            </button>
            {session ? (
              <>
                <button className="text-gray-400 hover:text-white">
                  <BellDot className="w-6 h-6" />
                </button>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[#9FE64F] transition-all"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400"
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg py-1 border border-gray-800">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-sm font-medium text-white">{session.user.email}</p>
                      </div>
                      
                      <button 
                        onClick={() => handleNavigation('/account/profile')}
                        className="w-full px-4 py-2 text-sm text-white hover:bg-gray-800 flex items-center space-x-2"
                      >
                        <User className="w-4 h-4" />
                        <span>My Account</span>
                      </button>
                      
                      <button 
                        onClick={() => handleNavigation('/account/settings')}
                        className="w-full px-4 py-2 text-sm text-white hover:bg-gray-800 flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      
                      <div className="border-t border-gray-800 mt-1">
                        <button 
                          onClick={handleSignOut}
                          className="w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-white hover:text-[#9FE64F]"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}