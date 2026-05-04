import React, { useState } from 'react';
import { Track } from '../types';
import { Play, Clock, MoreHorizontal, ListMusic, Heart, Plus, Cloud, CloudUpload, Trash2, Wand2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { CoverImage } from './CoverImage';
import { motion, AnimatePresence } from 'motion/react';

interface TrackListProps {
  tracks: Track[];
  currentTrackId: string | null;
  onTrackSelect: (track: Track) => void;
  likedSongIds?: string[];
  onToggleLike?: (trackTitle: string) => void;
  playlists?: any[];
  onAddToPlaylist?: (playlistId: string, trackTitle: string) => void;
  onDeleteTrack?: (track: Track) => void;
  onRepairTrack?: (track: Track) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  darkMode: boolean;
}

export const TrackList = React.memo(({ 
  tracks, 
  currentTrackId, 
  onTrackSelect, 
  likedSongIds = [], 
  onToggleLike,
  playlists = [],
  onAddToPlaylist,
  onDeleteTrack,
  onRepairTrack,
  emptyMessage = "Empty Library",
  emptyIcon,
  darkMode
}: TrackListProps) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col w-full px-2 md:px-8 mt-4 md:mt-6 pb-20">
      <div className={`grid grid-cols-[16px_1fr_40px] md:grid-cols-[16px_4fr_3fr_1fr] gap-4 px-4 py-2 border-b mb-3 text-xs font-bold uppercase tracking-widest items-center transition-colors ${
        darkMode 
          ? 'border-white/10 text-stone-400' 
          : 'border-gray-200 text-gray-500'
      }`}>
        <span>#</span>
        <span>Title</span>
        <span className="hidden md:block">Album</span>
        <div className="flex justify-end">
          <Clock size={16} />
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 transition-colors ${
          darkMode ? 'text-stone-500' : 'text-gray-500'
        }`}>
          {emptyIcon || <ListMusic size={64} className="mb-4 opacity-20" />}
          <p className="text-lg font-semibold">{emptyMessage}</p>
          {emptyMessage === "Empty Library" && <p className="text-sm">Click "Scan Local Music" to add your songs</p>}
        </div>
      ) : (
        tracks.map((track, index) => {
          const isLiked = likedSongIds.includes(track.title);
          return (
            <div
              key={track.id}
              onClick={() => onTrackSelect(track)}
              className={cn(
                "grid grid-cols-[16px_1fr_40px] md:grid-cols-[16px_4fr_3fr_1fr] gap-4 px-2 md:px-4 py-2 rounded-lg group cursor-default transition-colors items-center",
                currentTrackId === track.id 
                  ? (darkMode ? "bg-teal-300/10 ring-1 ring-teal-300/15" : "bg-teal-100 ring-1 ring-teal-200")
                  : (darkMode ? "hover:bg-white/[0.07]" : "hover:bg-gray-100")
              )}
            >
              <div className={`flex items-center text-sm transition-colors ${
                darkMode 
                  ? 'text-stone-400 group-hover:text-white' 
                  : 'text-gray-600 group-hover:text-gray-900'
              }`}>
                {currentTrackId === track.id ? (
                  <div className="h-3 w-3 bg-teal-300 rounded-full animate-pulse" />
                ) : (
                  <span className="group-hover:hidden">{index + 1}</span>
                )}
                <Play 
                  size={14} 
                  className={cn(
                    "hidden group-hover:block ml-[-2px]", 
                    currentTrackId === track.id && "block",
                    darkMode ? "text-white" : "text-gray-900"
                  )} 
                  fill="currentColor" 
                />
              </div>
              
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`h-10 w-10 min-w-[40px] rounded-lg overflow-hidden flex items-center justify-center ring-1 transition-colors ${
                  darkMode ? 'ring-white/10' : 'ring-gray-200'
                }`}>
                  <CoverImage blob={track.coverBlob} className="h-full w-full" iconSize={16} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className={cn(
                    "text-sm font-medium truncate flex items-center gap-1",
                    currentTrackId === track.id 
                      ? "text-teal-200" 
                      : (darkMode ? "text-white" : "text-gray-900")
                  )}>
                    {track.title}
                  </span>
                  <span className={`text-xs truncate transition-colors ${
                    darkMode 
                      ? 'text-stone-400 group-hover:text-white' 
                      : 'text-gray-500 group-hover:text-gray-900'
                  }`}>
                    {track.artist}
                  </span>
                </div>
              </div>

              <div className={`hidden md:flex items-center text-sm truncate transition-colors ${
                darkMode 
                  ? 'text-stone-400 group-hover:text-white' 
                  : 'text-gray-600 group-hover:text-gray-900'
              }`}>
                {track.album}
              </div>

              <div className={`flex items-center justify-end gap-4 text-sm transition-colors ${
                darkMode ? 'text-stone-400' : 'text-gray-600'
              }`}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike?.(track.title);
                  }}
                  className={cn(
                    "transition-opacity hover:scale-110 active:scale-95",
                    isLiked ? "opacity-100 text-rose-300" : `opacity-0 group-hover:opacity-100 ${
                      darkMode ? "hover:text-white" : "hover:text-gray-900"
                    }`
                  )}
                >
                  <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === track.id ? null : track.id);
                    }}
                    className={cn(
                      "transition-opacity",
                      openMenuId === track.id 
                        ? (darkMode ? "opacity-100 text-white" : "opacity-100 text-gray-900") 
                        : `opacity-0 group-hover:opacity-100 ${
                            darkMode ? "hover:text-white" : "hover:text-gray-900"
                          }`
                    )}
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  <AnimatePresence>
                    {openMenuId === track.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className={`absolute right-0 top-full mt-2 w-48 border rounded-lg shadow-xl z-50 py-1 overflow-hidden transition-colors ${
                            darkMode 
                              ? 'bg-[#0d1211] border-white/10' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={`px-3 py-2 text-[10px] uppercase font-bold tracking-wider transition-colors ${
                            darkMode ? 'text-stone-500' : 'text-gray-500'
                          }`}>Add to Playlist</div>
                          {playlists.length === 0 ? (
                            <div className={`px-4 py-2 text-xs italic transition-colors ${
                              darkMode ? 'text-stone-500' : 'text-gray-500'
                            }`}>No playlists found</div>
                          ) : (
                            playlists.map(playlist => (
                              <button
                                key={playlist.id}
                                onClick={() => {
                                  onAddToPlaylist?.(playlist.id, track.title);
                                  setOpenMenuId(null);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                  darkMode 
                                    ? 'text-stone-300 hover:text-white hover:bg-white/[0.07]' 
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                              >
                                <Plus size={14} />
                                <span className="truncate">{playlist.name}</span>
                              </button>
                            ))
                          )}
                          <div className={`h-[1px] my-1 transition-colors ${
                            darkMode ? 'bg-white/10' : 'bg-gray-200'
                          }`} />
                          {onRepairTrack && track.isBackend && (
                            <button
                              onClick={() => {
                                onRepairTrack(track);
                                setOpenMenuId(null);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-sky-300 hover:bg-white/[0.07] transition-colors ${
                                darkMode ? 'hover:bg-white/[0.07]' : 'hover:bg-gray-100'
                              }`}
                            >
                              <Wand2 size={14} />
                              <span className="truncate">Auto Repair Tags</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onDeleteTrack?.(track);
                              setOpenMenuId(null);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-400 transition-colors ${
                              darkMode ? 'hover:bg-white/[0.07]' : 'hover:bg-gray-100'
                            }`}
                          >
                            <Trash2 size={14} />
                            <span className="truncate">Remove from Library</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <span className="w-10 text-right">{formatDuration(track.duration)}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
});
