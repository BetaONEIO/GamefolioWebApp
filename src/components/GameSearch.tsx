import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { searchGames } from '../lib/games';

interface GameSearchProps {
  onSelect: (game: string) => void;
  selectedGame?: string;
}

export default function GameSearch({ onSelect, selectedGame }: GameSearchProps) {
  const [query, setQuery] = useState(selectedGame || '');
  const [results, setResults] = useState<{ id: string; name: string; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchGamesDebounced = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const games = await searchGames(query);
        setResults(games);
      } catch (error) {
        console.error('Error searching games:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchGamesDebounced, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (game: { id: string; name: string }) => {
    setQuery(game.name);
    onSelect(game.name);
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery('');
    onSelect('');
    setResults([]);
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search for a game..."
          className="w-full bg-gray-800 text-white pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9FE64F]"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {showResults && (query || loading) && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 rounded-lg shadow-lg border border-gray-800 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#9FE64F] mx-auto" />
            </div>
          ) : results.length > 0 ? (
            <ul className="py-2">
              {results.map((game) => (
                <li key={game.id}>
                  <button
                    onClick={() => handleSelect(game)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-800 text-white"
                  >
                    {game.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : query ? (
            <div className="p-4 text-center text-gray-400">
              No games found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}