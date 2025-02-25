import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="fixed top-16 left-0 right-0 h-12 bg-gray-900 border-b border-gray-800 z-40">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center space-x-6">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-[#9FE64F] text-black font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-[#9FE64F] text-black font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`
          }
        >
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </NavLink>
      </div>
    </div>
  );
}