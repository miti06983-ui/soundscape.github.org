import { useState, useRef, useMemo, useEffect } from 'react';
import { Track } from '../types';
import { X, Maximize2, Minimize2, ChevronDown, Shuffle, RotateCcw, SkipBack, Play, Pause, SkipForward, ListMusic, Monitor, MoreHorizontal, Volume2, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CoverImage } from './CoverImage';
import { cn } from '../lib/utils';

interface LyricsViewProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  progress: number;
  onSeek: (val: number) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  playbackMode: 'list' | 'random' | 'one' | 'album';
  onTogglePlaybackMode: () => void;
  bgColor?: string;
  secondaryColor?: string;
}

export function LyricsView({ 
  track, 
  isOpen, 
  onClose,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  progress,
  onSeek,
  volume,
  onVolumeChange,
  playbackMode,
  onTogglePlaybackMode,
  bgColor = 'rgb(103, 102, 19)',
  secondaryColor = 'rgb(38, 38, 38)'
}: LyricsViewProps) {

  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const formatTime = (percent: number) => {
    if (!track?.duration) return '0:00';
    const totalSeconds = (percent / 100) * track.duration;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = () => {
    if (!track?.duration) return '0:00';
    const mins = Math.floor(track.duration / 60);
    const secs = Math.floor(track.duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const lines = useMemo(() => {
    if (!track?.lyrics) return [];
    return track.lyrics.split('\n').filter(Boolean).map(line => {
      const timestampMatch = line.match(/\[(\d{2}):(\d{2})[.:](\d{1,3})?\]/);
      const cleanText = line.replace(/\[.*?\]/g, '').trim();
      
      let timeInSeconds = -1;
      if (timestampMatch) {
        const mins = parseInt(timestampMatch[1]);
        const secs = parseInt(timestampMatch[2]);
        const ms = timestampMatch[3] ? parseInt(timestampMatch[3].padEnd(3, '0')) / 1000 : 0;
        timeInSeconds = mins * 60 + secs + ms;
      }
      
      return { text: cleanText, time: timeInSeconds };
    }).filter(l => l.text !== '');
  }, [track?.lyrics]);

  const currentSeconds = track?.duration ? (progress / 100) * track.duration : 0;

  const activeIndex = useMemo(() => {
    if (lines.some(l => l.time !== -1)) {
      for (let j = lines.length - 1; j >= 0; j--) {
        if (lines[j].time !== -1 && lines[j].time <= currentSeconds) {
          return j;
        }
      }
      return -1;
    }
    return Math.floor((progress / 100) * lines.length);
  }, [lines, currentSeconds, progress]);

  // Auto-scroll effect
  useEffect(() => {
    if (activeIndex === -1) return;

    // Use a small delay to ensure the DOM has updated
    const timer = setTimeout(() => {
      const container = lyricsContainerRef.current;
      if (!container) return;
      
      const lyricsWrapper = container.firstElementChild as HTMLElement;
      if (!lyricsWrapper) return;
      
      const activeLine = lyricsWrapper.children[activeIndex] as HTMLElement;
      
      if (activeLine) {
        const containerHeight = container.clientHeight;
        const lineOffset = activeLine.offsetTop;
        const lineHeight = activeLine.clientHeight;
        
        const targetScrollTop = lineOffset - (containerHeight / 2) + (lineHeight / 2);
        
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [activeIndex, track?.id, isOpen]); // Also scroll when opening or track changes

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex flex-col text-white overflow-hidden pointer-events-auto"
        >
          {/* Background Layer (Mesh Gradient) */}
          <div 
            className="absolute inset-0 z-0 overflow-hidden"
            style={{ backgroundColor: bgColor }}
          >
            {/* Primary Blob */}
            <div 
              className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full opacity-40 blur-[120px] transition-all duration-1000"
              style={{ backgroundColor: bgColor }}
            />
            {/* Secondary Blob */}
            <div 
              className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-30 blur-[100px] transition-all duration-1000"
              style={{ backgroundColor: secondaryColor }}
            />
            {/* Ambient Darkening Overlay */}
            <div className="absolute inset-0 bg-black/60" />
          </div>

          {/* Header Controls (Top Right) */}
          <div className="absolute top-4 right-4 md:top-8 md:right-12 flex items-center gap-4 md:gap-8 z-50 pointer-events-auto">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="hidden md:block opacity-40 hover:opacity-100 transition-all cursor-pointer">
              <Maximize2 size={20} />
            </motion.div>
            <div className="hidden md:block w-4 h-[1px] bg-white opacity-20" />
            <motion.div 
              whileHover={{ scale: 1.2, rotate: 90 }} 
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1 md:p-2 bg-white/0 hover:bg-white/10 rounded-full transition-all cursor-pointer"
            >
              <X size={28} />
            </motion.div>
          </div>

          {/* Song Info (Top Left) */}
          <div className="absolute top-4 left-10 md:top-6 md:left-16 z-10 max-w-[70%] overflow-hidden pointer-events-none select-none">
            <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-4 overflow-hidden">
              <h1 className="text-sm md:text-xl font-bold tracking-tight truncate text-shadow-sm">{track?.title}</h1>
              <div className="flex items-center gap-1.5 opacity-50 text-[8px] md:text-[10px] font-semibold uppercase tracking-[0.15em] shrink min-w-0">
                <span className="truncate">{track?.artist}</span>
                <span className="shrink-0 opacity-30">—</span>
                <span className="truncate opacity-30">{track?.album}</span>
              </div>
            </div>
          </div>

          {/* Main Layout: Album Art & Lyrics */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-24 gap-4 md:gap-20 overflow-hidden pt-16 md:pt-10 z-10">
            {/* Album Art */}
            <div className="flex-shrink-0 md:flex-1 flex justify-center md:justify-end w-full max-w-[210px] md:max-w-[380px] max-h-[28vh] md:max-h-none md:translate-x-8">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full aspect-square rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.5)] md:shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden relative"
              >
                <CoverImage blob={track?.coverBlob} className="w-full h-full object-cover" iconSize={64} />
              </motion.div>
            </div>

            {/* Lyrics Area */}
            <div className="flex-1 h-full md:h-[65vh] flex flex-col py-2 md:py-6 relative w-full overflow-hidden z-10">
              <div 
                ref={lyricsContainerRef}
                className="overflow-y-auto pr-2 md:pr-12 custom-scrollbar flex-1 mask-linear-fade pointer-events-auto"
              >
                {lines.length > 0 ? (
                  <div className="flex flex-col gap-3 md:gap-6 py-40 md:py-64 text-center md:text-left relative md:pl-32">
                    {lines.map((item, i) => {
                      const isActiveGroup = activeIndex !== -1 && lines[i].time !== -1 && lines[i].time === lines[activeIndex].time;
                      const isActive = isActiveGroup || i === activeIndex;
                      const isPast = i < activeIndex && !isActive;
                      const isSecondary = i > 0 && lines[i].time !== -1 && lines[i].time === lines[i-1].time;
                      
                      const handleClick = () => {
                        if (item.time !== -1 && track?.duration) {
                          onSeek((item.time / track.duration) * 100);
                        } else if (track?.duration) {
                          onSeek((i / lines.length) * 100);
                        }
                      };

                      return (
                        <motion.p 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ 
                            opacity: isActive ? 1 : isPast ? 0.4 : 0.2,
                            x: 0,
                            scale: (isActive && !isSecondary) ? 1.02 : 1
                          }}
                          onClick={handleClick}
                          className={cn(
                            "font-bold transition-all duration-700 cursor-pointer leading-tight origin-left hover:scale-105 hover:opacity-100 break-words",
                            isSecondary 
                              ? "text-lg md:text-2xl mt-[-4px] md:mt-[-8px] opacity-80" 
                              : "text-2xl md:text-4xl mt-1 md:mt-2",
                            isActive 
                              ? "text-white opacity-100" 
                              : "text-white/40 hover:text-white/70"
                          )}
                        >
                          {item.text}
                        </motion.p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col h-full items-center md:items-start justify-center gap-4 md:gap-6 text-white/30 italic text-center md:text-left md:pl-24 pointer-events-none select-none">
                    <p className="text-2xl md:text-4xl font-black tracking-tight opacity-40 uppercase">Lyrics unavailable</p>
                    <p className="text-xs md:text-sm max-w-xs opacity-60">We couldn't find lyrics for this song.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar: Progress & Controls */}
          <div className="h-28 md:h-36 px-6 md:px-12 flex flex-col justify-end pb-4 md:pb-8 gap-2 md:gap-4 bg-gradient-to-t from-black/50 via-black/10 to-transparent relative z-30 pointer-events-auto">
            {/* Progress Area */}
            <div className="flex flex-col gap-1.5 md:gap-2">
              <div className="relative h-1.5 md:h-2 w-full bg-white/10 rounded-full overflow-hidden group">
                <div 
                  className="absolute h-full bg-white/40 transition-all group-hover:bg-green-400"
                  style={{ width: `${progress}%` }}
                />
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={isNaN(progress) ? 0 : progress}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
              </div>
              <div className="flex justify-between text-[9px] md:text-[10px] font-bold opacity-60 tracking-wider">
                <span>{formatTime(progress)}</span>
                <span>{totalTime()}</span>
              </div>
            </div>

            {/* Navigation & Secondary Controls */}
            <div className="flex items-center justify-between">
              {/* Left Group */}
              <div className="hidden md:flex items-center gap-5">
                 <motion.button 
                   onClick={onTogglePlaybackMode}
                   whileHover={{ scale: 1.15 }}
                   whileTap={{ scale: 0.9 }}
                   className={cn("transition-colors", playbackMode !== 'list' ? "text-green-400" : "text-white/70 hover:text-white")}
                   title={`Mode: ${playbackMode}`}
                 >
                   {playbackMode === 'random' && <Shuffle size={18} />}
                   {playbackMode === 'one' && <RotateCcw size={18} />}
                   {playbackMode === 'album' && <Disc size={18} />}
                   {playbackMode === 'list' && <RotateCcw size={18} className="opacity-50" />}
                 </motion.button>
                 <div className="flex items-center gap-3 group/vol">
                   <Volume2 size={18} className="text-white/70 group-hover/vol:text-white transition-colors" />
                   <div className="w-20 md:w-24 h-1 bg-white/10 rounded-full relative overflow-hidden">
                     <div 
                       className="absolute h-full bg-white/60 group-hover/vol:bg-green-400 transition-colors"
                       style={{ width: `${volume * 100}%` }}
                     />
                     <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                     />
                   </div>
                 </div>
              </div>

              {/* Mobile Interaction Area */}
              <div className="flex md:hidden items-center gap-4 opacity-70">
                <motion.button 
                   onClick={onTogglePlaybackMode}
                   whileTap={{ scale: 0.9 }}
                   className={cn("transition-colors", playbackMode !== 'list' ? "text-green-400" : "hover:text-white")}
                >
                  {playbackMode === 'random' && <Shuffle size={16} />}
                  {playbackMode === 'one' && <RotateCcw size={16} />}
                  {playbackMode === 'album' && <Disc size={16} />}
                  {playbackMode === 'list' && <RotateCcw size={16} className="opacity-50" />}
                </motion.button>
              </div>

              {/* Center Playback */}
              <div className="flex items-center gap-4 md:gap-7 md:translate-x-4">
                <motion.button 
                  onClick={onPrevious}
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 md:w-12 md:h-12 bg-white/10 flex items-center justify-center rounded-full transition-all"
                >
                  <SkipBack size={20} fill="currentColor" />
                </motion.button>
                <motion.button 
                  onClick={onTogglePlay}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 md:w-16 md:h-16 bg-white text-black flex items-center justify-center rounded-full transition-all shadow-lg active:scale-95"
                >
                  {isPlaying ? (
                    <Pause size={28} fill="currentColor" />
                  ) : (
                    <Play size={28} fill="currentColor" className="ml-1" />
                  )}
                </motion.button>
                <motion.button 
                  onClick={onNext}
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 md:w-12 md:h-12 bg-white/10 flex items-center justify-center rounded-full transition-all"
                >
                  <SkipForward size={20} fill="currentColor" />
                </motion.button>
              </div>

              {/* Right Group */}
              <div className="flex items-center gap-4 md:gap-6">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-white/60 hover:text-white transition-colors">
                  <ListMusic size={20} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-white/60 hover:text-white transition-colors">
                  <MoreHorizontal size={20} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
