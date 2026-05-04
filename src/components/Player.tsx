import { Track } from '../types';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  RotateCcw, 
  Shuffle, 
  Heart, 
  Laptop2, 
  ListMusic, 
  Mic2, 
  Disc, 
  MonitorPlay,
  Sliders,
  Merge,
  Wand2
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { CoverImage } from './CoverImage';
import { motion } from 'motion/react';

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleLyrics?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onTogglePiP?: () => void;
  playbackMode: 'list' | 'random' | 'one' | 'album';
  onTogglePlaybackMode: () => void;
  onToggleQueue?: () => void;
  progress: number;
  onSeek: (val: number) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  darkMode: boolean;
}

const TrackInfo = React.memo(({ 
  currentTrack, 
  onToggleLyrics, 
  isLiked, 
  onToggleLike,
  darkMode
}: { 
  currentTrack: Track | null; 
  onToggleLyrics?: () => void; 
  isLiked?: boolean; 
  onToggleLike?: () => void;
  darkMode: boolean;
}) => {
  if (!currentTrack) return <div className={`flex items-center gap-3 md:gap-4 w-[60%] md:w-[30%] overflow-hidden italic text-sm ${
    darkMode ? 'text-stone-600' : 'text-gray-500'
  }`}>No track playing</div>;

  return (
    <div className="flex items-center gap-3 md:gap-4 w-[60%] md:w-[30%] overflow-hidden">
      <div 
        onClick={onToggleLyrics}
        className={`h-10 w-10 md:h-14 md:w-14 rounded-lg overflow-hidden shadow-lg flex-shrink-0 cursor-pointer hover:scale-105 transition-transform active:scale-95 group relative ring-1 ${
          darkMode ? 'ring-white/10' : 'ring-gray-200'
        }`}
      >
        <CoverImage blob={currentTrack.coverBlob} className="h-full w-full" iconSize={20} />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Mic2 size={14} className="text-white" />
        </div>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span 
          onClick={onToggleLyrics}
          className={`text-[13px] md:text-sm font-semibold truncate hover:underline cursor-pointer ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {currentTrack.title}
        </span>
        <span className={`text-[11px] md:text-xs truncate hover:underline cursor-pointer transition-colors ${
          darkMode 
            ? 'text-stone-400 hover:text-white' 
            : 'text-gray-600 hover:text-gray-900'
        }`}>
          {currentTrack.artist}
        </span>
      </div>
      <motion.button 
        onClick={onToggleLike}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        className={cn(
          "transition-colors ml-1 md:ml-2 flex-shrink-0",
          isLiked ? "text-[var(--accent-color,#2dd4bf)]" : `${
            darkMode ? "text-stone-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
          }`
        )}
      >
        <Heart size={16} fill={isLiked ? "var(--accent-color, #2dd4bf)" : "none"} />
      </motion.button>
    </div>
  );
});

const ControlButtons = React.memo(({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleLyrics,
  playbackMode,
  onTogglePlaybackMode,
  darkMode
}: {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleLyrics?: () => void;
  playbackMode: 'list' | 'random' | 'one' | 'album';
  onTogglePlaybackMode: () => void;
  darkMode: boolean;
}) => {
  return (
    <div className="flex items-center gap-4 md:gap-6">
      <motion.button 
        onClick={onTogglePlaybackMode}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "hidden sm:flex transition-all duration-300 relative p-1 rounded-full",
          playbackMode !== 'list' 
            ? "text-[var(--accent-color,#2dd4bf)] bg-teal-300/10" 
            : `${darkMode ? "text-stone-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`
        )}
        title={`Mode: ${playbackMode}`}
      >
        {playbackMode === 'random' && <Shuffle size={18} />}
        {playbackMode === 'one' && <RotateCcw size={18} />}
        {playbackMode === 'album' && <Disc size={18} />}
        {playbackMode === 'list' && <RotateCcw size={18} className="opacity-50" />}
        
        {playbackMode !== 'list' && (
          <motion.div 
            layoutId="playbackModeDot"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--accent-color,#2dd4bf)] rounded-full shadow-[0_0_5px_var(--accent-color,#2dd4bf)]" 
          />
        )}
        {playbackMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
        {playbackMode === 'album' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">A</span>}
      </motion.button>

      <motion.button 
        onClick={onPrevious} 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`hidden md:block transition-colors ${
          darkMode ? "text-stone-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <SkipBack size={20} fill="currentColor" />
      </motion.button>
      <motion.button 
        onClick={onTogglePlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="h-10 w-10 md:h-10 md:w-10 bg-teal-300 rounded-full flex items-center justify-center text-black shadow-lg shadow-teal-300/20 flex-shrink-0"
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
      </motion.button>
      <motion.button 
        onClick={onNext} 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`transition-colors ${
          darkMode ? "text-stone-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <SkipForward size={20} fill="currentColor" />
      </motion.button>
      
      <motion.button 
        onClick={onToggleLyrics}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`hidden md:block transition-colors ${
          darkMode ? "text-stone-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
        }`}
        title="Lyrics"
      >
        <Mic2 size={16} />
      </motion.button>
    </div>
  );
});

export const Player = React.memo(({ 
  currentTrack, 
  isPlaying, 
  onTogglePlay, 
  onNext, 
  onPrevious, 
  onToggleLyrics, 
  isLiked, 
  onToggleLike,
  onTogglePiP,
  playbackMode,
  onTogglePlaybackMode,
  onToggleQueue,
  progress,
  onSeek,
  volume,
  onVolumeChange,
  darkMode
}: PlayerProps) => {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = currentTrack?.duration ? (progress / 100) * currentTrack.duration : 0;
  const duration = currentTrack?.duration || 0;

  return (
    <div className={`h-20 md:h-24 backdrop-blur-xl border-t px-3 md:px-5 flex items-center justify-between mb-16 lg:mb-0 shadow-[0_-18px_60px_rgba(0,0,0,0.3)] transition-colors ${
      darkMode ? 'bg-[#090d0c]/95 border-white/10' : 'bg-white/95 border-gray-200'
    }`}>
      {/* Track Info - Memoized to prevent flickering on progress updates */}
      <TrackInfo 
        currentTrack={currentTrack}
        onToggleLyrics={onToggleLyrics}
        isLiked={isLiked}
        onToggleLike={onToggleLike}
        darkMode={darkMode}
      />

      {/* Controls */}
      <div className="flex flex-col items-center gap-1 md:gap-2 max-w-[40%] md:max-w-[40%] w-full flex-shrink-0">
        <ControlButtons 
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onNext={onNext}
          onPrevious={onPrevious}
          onToggleLyrics={onToggleLyrics}
          playbackMode={playbackMode}
          onTogglePlaybackMode={onTogglePlaybackMode}
          darkMode={darkMode}
        />
        
        <div className="hidden md:flex items-center gap-2 w-full max-w-md">
          <span className={`text-[10px] min-w-[32px] text-right ${
            darkMode ? 'text-stone-400' : 'text-gray-600'
          }`}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={isNaN(progress) ? 0 : progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full soundscape-slider"
          />
          <span className={`text-[10px] min-w-[32px] ${
            darkMode ? 'text-stone-400' : 'text-gray-600'
          }`}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className={`hidden md:flex items-center justify-end gap-3 w-[30%] ${
        darkMode ? 'text-stone-400' : 'text-gray-600'
      }`}>
        <motion.button 
          onClick={onToggleLyrics}
          whileHover={{ scale: 1.1, color: darkMode ? '#FFFFFF' : '#111827' }}
          whileTap={{ scale: 0.9 }}
          className="transition-colors"
          title="Lyrics"
        >
          <Mic2 size={16} />
        </motion.button>
        <motion.button 
          onClick={onTogglePiP}
          whileHover={{ scale: 1.1, color: darkMode ? '#FFFFFF' : '#111827' }}
          whileTap={{ scale: 0.9 }}
          className="transition-colors"
          title="Mini Player (Picture-in-Picture)"
        >
          <MonitorPlay size={16} />
        </motion.button>
        <motion.button 
          onClick={onToggleQueue}
          whileHover={{ scale: 1.1, color: darkMode ? '#FFFFFF' : '#111827' }}
          whileTap={{ scale: 0.9 }}
          className="transition-colors"
        >
          <ListMusic size={16} />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.1, color: darkMode ? '#FFFFFF' : '#111827' }}
          whileTap={{ scale: 0.9 }}
          className="transition-colors"
        >
          <Laptop2 size={16} />
        </motion.button>


        <div className="flex items-center gap-2 w-24">
          <Volume2 size={16} className={darkMode ? 'text-stone-400' : 'text-gray-600'} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isNaN(volume) ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full soundscape-slider"
          />
        </div>
      </div>
    </div>
  );
});
