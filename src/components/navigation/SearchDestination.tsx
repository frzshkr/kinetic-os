import React, { useState } from 'react';
import { SearchLocation } from '../../types';
import { routingService } from '../../services/routingService';
import { sound } from '../../utils/audio';
import { Search, MapPin, Navigation, Trees, Coffee, X } from 'lucide-react';

interface SearchDestinationProps {
  onSelectDestination: (dest: SearchLocation) => void;
  isNavigating: boolean;
  destinationName?: string;
  onCancelNav: () => void;
}

export const SearchDestination: React.FC<SearchDestinationProps> = ({
  onSelectDestination,
  isNavigating,
  destinationName,
  onCancelNav,
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchLocation[]>([]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      const places = await routingService.searchPlace(val);
      setResults(places);
    } catch {
      setResults([]);
    }
  };

  const handleSelect = (dest: SearchLocation) => {
    sound.playClick();
    onSelectDestination(dest);
    setQuery('');
    setResults([]);
  };

  const QUICK_PLACES: { label: string; icon: React.FC<{ className?: string }>; query: string }[] = [
    { label: 'Lake Gardens', icon: Trees, query: 'Perdana Botanical Gardens' },
    { label: 'Desa ParkCity', icon: Trees, query: 'Desa ParkCity' },
    { label: 'KLCC Park', icon: Navigation, query: 'KLCC Park' },
    { label: 'Waterfront Walk', icon: Trees, query: 'Putrajaya Waterfront' },
    { label: 'Coffee Spot', icon: Coffee, query: 'Cafe' },
  ];

  if (isNavigating) {
    return (
      <div className="w-full bg-white/90 backdrop-blur-xl rounded-[28px] p-4 border border-black/[0.08] flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-black text-[#E8F84A] flex items-center justify-center shrink-0 shadow-xs">
            <Navigation className="w-5 h-5 fill-current" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-600 font-black block">
              ACTIVE NAVIGATION ROUTE
            </span>
            <p className="text-xs sm:text-sm font-black text-slate-950 truncate font-['Outfit']">
              {destinationName || 'Destination Set'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onCancelNav();
          }}
          className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black shrink-0 transition-all shadow-xs font-mono"
        >
          END ROUTE
        </button>
      </div>
    );
  }

  return (
    <div className="w-full relative z-30">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search place, park, or destination..."
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/90 border border-black/[0.08] focus:border-black focus:ring-4 focus:ring-black/[0.05] text-slate-900 placeholder-slate-400 text-xs sm:text-sm outline-none shadow-sm transition-all font-medium"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Results Dropdown */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-[28px] shadow-2xl overflow-hidden max-h-64 overflow-y-auto z-40">
          {results.map((res) => (
            <button
              key={res.place_id}
              onClick={() => handleSelect(res)}
              className="w-full p-3.5 text-left border-b border-black/[0.03] last:border-b-0 hover:bg-[#F9F7F2] flex items-start gap-3 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-black text-[#E8F84A] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs sm:text-sm font-black text-slate-950 truncate font-['Outfit']">
                  {res.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate font-medium">
                  {res.display_name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
        {QUICK_PLACES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.label}
              onClick={() => handleSearch(cat.query)}
              className="px-3.5 py-2 rounded-2xl bg-white/80 hover:bg-white border border-black/[0.06] text-slate-800 text-xs whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 shadow-2xs font-bold"
            >
              <Icon className="w-3.5 h-3.5 text-slate-500" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
