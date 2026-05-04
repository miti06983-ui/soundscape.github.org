/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  Home, 
  Disc, 
  Library, 
  PlusSquare, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Play,
  FolderOpen,
  Search,
  ListMusic,
  Trash2,
  Music,
  Cpu,
  Zap,
  Activity,
  Layers,
  Settings,
  Sun,
  Moon,
  PlayCircle,
  Volume2,
  Bell,
  Repeat,
  Wand2,
  Sliders,
  Merge,
  Languages
} from 'lucide-react';
import { Equalizer } from './components/Equalizer';
import { Crossfade } from './components/Crossfade';
import { StemPlayer } from './components/StemPlayer';
import { get, set } from 'idb-keyval';
import { 
  db, 
  storage
} from './lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  addDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SidebarItem, SidebarSection } from './components/SidebarItems';
import { Player } from './components/Player';
import { TrackList } from './components/TrackList';
import { LyricsView } from './components/LyricsView';


import { CoverImage } from './components/CoverImage';
import { PlaylistModal } from './components/PlaylistModal';
import { DesktopLyrics, DesktopLyricsRef } from './components/DesktopLyrics';
import { getAverageColor, cn, darkenColor } from './lib/utils';
import { processFiles } from './utils/audioScanner';
import { Track } from './types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { t } from './i18n';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  const jsonError = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonError);
  throw new Error(jsonError);
}

const MainHeader = React.memo(({ 
  activeView, 
  searchQuery, 
  setSearchQuery, 
  darkMode
}: {
  activeView: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  darkMode: boolean;
}) => {
  // 登录功能已移除

  return (
  <header className={`h-16 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0 backdrop-blur-xl border-b transition-colors ${
    darkMode 
      ? 'bg-[#080b0a]/70 border-white/10' 
      : 'bg-white/70 border-gray-200'
  }`}>
    <div className="flex gap-2 md:gap-4 items-center flex-1">
      <div className="hidden md:flex gap-2">
        <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          darkMode 
            ? 'bg-white/[0.06] hover:bg-white/10 text-stone-400 hover:text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
        }`}>
          <ChevronLeft size={18} />
        </button>
        <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          darkMode 
            ? 'bg-white/[0.06] hover:bg-white/10 text-stone-400 hover:text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
        }`}>
          <ChevronRight size={18} />
        </button>
      </div>

      {activeView === 'search' && (
        <div className="relative w-full max-md">
          <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
            darkMode ? 'text-stone-400' : 'text-gray-500'
          }`} />
          <input 
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs, albums..."
            className={`w-full border outline-none rounded-lg py-2 pl-10 pr-4 text-sm font-medium placeholder:text-gray-500 transition-all ${
              darkMode 
                ? 'bg-white/[0.07] hover:bg-white/10 border-white/10 focus:border-teal-300/50 placeholder:text-stone-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 border-gray-300 focus:border-teal-400 placeholder:text-gray-500 text-gray-900'
            }`}
          />
        </div>
      )}
      {activeView !== 'search' && (
        <div className="flex lg:hidden items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br from-teal-300 via-emerald-400 to-amber-300 flex items-center justify-center ${
            darkMode ? 'shadow-lg shadow-teal-500/20' : 'shadow-md shadow-teal-300/50'
          }`}>
            <Play size={13} fill="white" className="ml-0.5" />
          </div>
          <span className={`font-bold text-lg tracking-tight ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>Soundscape</span>
        </div>
      )}
    </div>
    
    <div className="flex gap-3 items-center relative">
      {/* 登录功能已移除 */}
      <div className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-gray-500">
        <span>无需登录</span>
      </div>
    </div>
  </header>
  );
});

const HeroSection = React.memo(({ 
  activeView, 
  selectedAlbum, 
  selectedPlaylistId, 
  currentTrack, 
  tracks, 
  playlists, 
  likedSongIds,
  darkMode
}: {
  activeView: string;
  selectedAlbum: string | null;
  selectedPlaylistId: string | null;
  currentTrack: Track | null;
  tracks: Track[];
  playlists: any[];
  likedSongIds: string[];
  darkMode: boolean;
}) => (
  <div className="px-4 md:px-10 mt-4 md:mt-8">
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`flex flex-col md:flex-row items-center md:items-end gap-8 mb-8 p-5 md:p-8 rounded-lg text-center md:text-left overflow-hidden relative transition-colors ${
        darkMode 
          ? 'bg-[#0a0e0d]/80 border border-white/10' 
          : 'bg-white/80 border border-gray-200'
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/60 to-transparent" />
      <div className={`h-52 w-52 md:h-64 lg:h-72 lg:w-72 md:w-64 flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0 group relative ring-1 transition-colors ${
        darkMode 
          ? 'shadow-[0_32px_64px_rgba(0,0,0,0.45)] ring-white/10' 
          : 'shadow-lg shadow-gray-300/50 ring-gray-200'
      }`} id="hero-cover-container">
        <AnimatePresence mode="wait">
           <motion.div
             key={activeView === 'songs' ? (selectedAlbum || selectedPlaylistId || currentTrack?.id || 'empty') : (selectedAlbum || selectedPlaylistId || 'view-icon')}
             initial={{ opacity: 0, scale: 1.05 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             transition={{ duration: 0.4 }}
             className="h-full w-full"
           >
             <CoverImage 
               blob={
                 selectedAlbum ? tracks.find(t => t.album === selectedAlbum)?.coverBlob : 
                 (selectedPlaylistId ? tracks.find(t => playlists.find(p => p.id === selectedPlaylistId)?.tracks.includes(t.title))?.coverBlob : 
                 (activeView === 'songs' ? currentTrack?.coverBlob : tracks[0]?.coverBlob))
               } 
               className="h-full w-full" 
               iconSize={80}
               darkMode={darkMode}
             />
           </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-2 md:gap-3 min-w-0 w-full overflow-hidden">
        <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] ${
          darkMode ? 'text-amber-200' : 'text-amber-700'
        }`}>{selectedAlbum ? 'Album' : (selectedPlaylistId ? 'Playlist' : (activeView === 'songs' ? 'Collection' : (activeView === 'liked' ? 'Playlist' : (activeView === 'tools' ? 'Tools' : 'Library'))))}</span>
        <div className="flex flex-col items-center md:items-baseline gap-2 md:gap-5">
          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black truncate w-full leading-none ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`} id="hero-title">
            {selectedAlbum || (selectedPlaylistId ? playlists.find(p => p.id === selectedPlaylistId)?.name : (activeView === 'songs' ? 'My Library' : (activeView === 'liked' ? 'Liked Songs' : (activeView === 'tools' ? '工具' : 'All Albums'))))}
          </h1>
          <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
            <span className={`${darkMode ? 'text-stone-300' : 'text-gray-700'}`}>
              {selectedAlbum ? tracks.find(t => t.album === selectedAlbum)?.artist : 
               (selectedPlaylistId ? 'You' : 
               (activeView === 'liked' ? 'You' : (activeView === 'tools' ? 'Audio Tools' : 'Your Music')))}
            </span>
            <span className={`w-1 h-1 rounded-full ${darkMode ? 'bg-stone-600' : 'bg-gray-400'}`} />
            <span className={`${darkMode ? 'text-stone-500' : 'text-gray-600'}`}>
              {selectedAlbum ? tracks.filter(t => t.album === selectedAlbum).length : 
               (selectedPlaylistId ? playlists.find(p => p.id === selectedPlaylistId)?.tracks.length : 
               (activeView === 'liked' ? tracks.filter(t => likedSongIds.includes(t.title)).length : (activeView === 'tools' ? 3 : tracks.length)))} tracks
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
));

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'songs' | 'albums' | 'liked' | 'search' | 'playlist' | 'settings' | 'tools' | 'equalizer' | 'crossfade'>('songs');
  const [darkMode, setDarkMode] = useState(true);
  const [showDesktopLyrics, setShowDesktopLyrics] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isCrossfadeOpen, setIsCrossfadeOpen] = useState(false);
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSourceNode, setAudioSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  const desktopLyricsRef = useRef<DesktopLyricsRef>(null);
  const [playbackMode, setPlaybackMode] = useState<'list' | 'random' | 'one' | 'album'>('album');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  // 登录功能已移除，用户状态已删除
  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);
  const [trackColor, setTrackColor] = useState('rgb(103, 102, 19)');
  const [secondaryColor, setSecondaryColor] = useState('rgb(38, 38, 38)');
  const [isCurrentTrackLogged, setIsCurrentTrackLogged] = useState(false);
  const [lastLoggedTrackId, setLastLoggedTrackId] = useState<string | null>(null);
  
  const [volume, setVolume] = useState(0.5);
  const fadeTargetVolume = useRef(volume);
  const fadeInterval = useRef<any>(null);

  const fadeAudio = (target: number, duration: number = 300) => {
    if (!audioRef.current) return;
    clearInterval(fadeInterval.current);
    
    // Apply normalization if active (Removed as requested)
    const finalTarget = target;
    
    const startVol = audioRef.current.volume;
    const steps = 20;
    const stepTime = duration / steps;
    const volStep = (target - startVol) / steps;
    
    let currentStep = 0;
    fadeInterval.current = setInterval(() => {
      if (!audioRef.current) {
        clearInterval(fadeInterval.current);
        return;
      }
      currentStep++;
      const nextVol = Math.max(0, Math.min(1, startVol + volStep * currentStep));
      audioRef.current.volume = nextVol;
      
      if (currentStep >= steps) {
        audioRef.current.volume = target;
        clearInterval(fadeInterval.current);
      }
    }, stepTime);
  };

  // Sync volume state to ref
  useEffect(() => {
    fadeTargetVolume.current = volume;
    if (audioRef.current && !fadeInterval.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Just check, we'll ask on first human interaction or specific button
    }
  }, []);

  const showTrackNotification = (track: any) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    
    try {
      let options: NotificationOptions = {
        body: `${track.artist}`,
        silent: true,
        tag: 'music-player-track',
        badge: '/favicon.ico'
      };

      if (track.coverBlob) {
        const coverUrl = URL.createObjectURL(track.coverBlob);
        options.icon = coverUrl;
        // Clean up URL after notification might have loaded it
        // Note: browser might need time to fetch it, 5s is safe
        setTimeout(() => URL.revokeObjectURL(coverUrl), 5000);
      } else {
        options.icon = '/favicon.ico';
      }

      const notification = new Notification(track.title, options);
      setTimeout(() => notification.close(), 5000);
    } catch (err) {
      console.error("Notification error:", err);
    }
  };
  
  // Picture-in-Picture State function
  const [isPiPActive, setIsPiPActive] = useState(false);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Shared Player State
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const [nextTrack, setNextTrack] = useState<Track | null>(null);
  const crossfadeInProgress = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTogglePlay = useCallback(() => {
    // Request notification permission on first play if needed
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current && audioRef.current.src) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error("Toggle play failed:", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Color Extraction Effect
  useEffect(() => {
    if (currentTrack?.coverBlob && currentTrack.coverBlob instanceof Blob) {
      getAverageColor(currentTrack.coverBlob).then(colors => {
        setTrackColor(colors.primary);
        setSecondaryColor(colors.secondary);
      });
    } else {
      setTrackColor('rgb(103, 102, 19)');
      setSecondaryColor('rgb(38, 38, 38)');
    }
    
    // Show notification when track changes
    if (currentTrack) {
      showTrackNotification(currentTrack);
      // Also fade in the new track
      fadeAudio(fadeTargetVolume.current, 500);
    }
    
    // Reset logging state for new track
    setIsCurrentTrackLogged(false);

    // Fetch lyrics from backend if missing
    if (currentTrack && !currentTrack.lyrics) {
      const getLyrics = async () => {
        try {
          const response = await fetch(`/api/lyrics?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`);
          if (response.ok) {
            const data = await response.json();
            setCurrentTrack(prev => prev && prev.id === currentTrack.id ? { ...prev, lyrics: data.lyrics } : prev);
          }
        } catch (err) {
          console.error("Failed to fetch lyrics:", err);
        }
      };
      getLyrics();
    }
  }, [currentTrack?.id]);

  // 登录功能已移除，播放跟踪功能已禁用

  const handleSeek = useCallback((val: number) => {
    const duration = audioRef.current?.duration;
    if (duration && !isNaN(duration)) {
      const time = (val / 100) * duration;
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
      setProgress(val);
    }
  }, []);

  const handleVolumeChange = useCallback((val: number) => {
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  }, []);

  const updatePiPCanvas = useCallback(async () => {
    if (!pipCanvasRef.current || !currentTrack) return;
    const canvas = pipCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 512;
    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = darkenColor(trackColor, 0.3);
    ctx.fillRect(0, 0, size, size);

    // Gradient overlay
    const gradient = ctx.createLinearGradient(0, size * 0.5, 0, size);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Draw Cover
    if (currentTrack.coverBlob) {
      try {
        let img: HTMLImageElement | null = null;
        if (typeof currentTrack.coverBlob === 'string') {
          img = await new Promise((resolve) => {
            const i = new Image();
            i.crossOrigin = "anonymous";
            i.src = currentTrack.coverBlob as string;
            i.onload = () => resolve(i);
            i.onerror = () => resolve(null);
          });
        } else if (currentTrack.coverBlob instanceof Blob) {
          const url = URL.createObjectURL(currentTrack.coverBlob);
          img = await new Promise((resolve) => {
            const i = new Image();
            i.src = url;
            i.onload = () => {
              URL.revokeObjectURL(url);
              resolve(i);
            };
            i.onerror = () => resolve(null);
          });
        }

        if (img) {
          const padding = 60;
          const imgSize = size - padding * 2 - 80;
          const x = (size - imgSize) / 2;
          const y = padding;
          
          // Draw shadow
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 20;
          
          ctx.drawImage(img, x, y, imgSize, imgSize);
          
          // Reset shadow
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
        }
      } catch (e) {
        console.warn("Could not draw cover to PiP canvas", e);
      }
    }

    // Text info
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    
    // Title
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(currentTrack.title, size / 2, size - 100);
    
    // Artist
    ctx.font = '24px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(currentTrack.artist, size / 2, size - 60);

    // Progress Bar
    const barWidth = size * 0.7;
    const barHeight = 6;
    const barX = (size - barWidth) / 2;
    const barY = size - 30;
    
    // Track
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    if (ctx.roundRect) {
      ctx.roundRect(barX, barY, barWidth, barHeight, 3);
    } else {
      ctx.rect(barX, barY, barWidth, barHeight);
    }
    ctx.fill();
    
    // Progress
    ctx.beginPath();
    ctx.fillStyle = '#2dd4bf';
    const progressWidth = barWidth * (progress / 100);
    if (progressWidth > 0) {
      if (ctx.roundRect) {
        ctx.roundRect(barX, barY, progressWidth, barHeight, 3);
      } else {
        ctx.rect(barX, barY, progressWidth, barHeight);
      }
      ctx.fill();
    }
  }, [currentTrack, trackColor, progress]);

  const togglePictureInPicture = async () => {
    if (isPiPActive) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
      return;
    }

    if (!document.pictureInPictureEnabled) {
      alert("Picture-in-Picture is not supported in your browser.");
      return;
    }

    try {
      if (!pipVideoRef.current) {
        pipVideoRef.current = document.createElement('video');
        pipVideoRef.current.muted = true;
        pipVideoRef.current.playsInline = true;
        
        pipVideoRef.current.addEventListener('enterpictureinpicture', () => setIsPiPActive(true));
        pipVideoRef.current.addEventListener('leavepictureinpicture', () => setIsPiPActive(false));
      }

      if (!pipCanvasRef.current) {
        pipCanvasRef.current = document.createElement('canvas');
      }

      await updatePiPCanvas();

      if (!pipVideoRef.current.srcObject) {
         const stream = (pipCanvasRef.current as any).captureStream(10);
         pipVideoRef.current.srcObject = stream;
      }
      
      // Ensure video is playing
      try {
        await pipVideoRef.current.play();
      } catch (e) {
        console.warn("Autoplay failed or was already playing", e);
      }

      await pipVideoRef.current.requestPictureInPicture();
    } catch (error) {
      console.error("Failed to enter Picture-in-Picture:", error);
      alert("Failed to start Picture-in-Picture.");
    }
  };

  // Sync PiP canvas when track or progress changes
  useEffect(() => {
    if (isPiPActive) {
      updatePiPCanvas();
    }
  }, [isPiPActive, currentTrack, progress, updatePiPCanvas]);


  // Load library from persistence
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        console.log("Initial library load start...");
        // Try to load the full library (including Blobs)
        const savedTracks = await get<Track[]>('music-library-full');
        
        if (savedTracks && savedTracks.length > 0) {
          console.log(`Loaded ${savedTracks.length} tracks from full persistence`);
          prevTracksLength.current = savedTracks.length;
          setTracks(savedTracks);
        } else {
          // Fallback to metadata-only if full is missing
          const savedMetadata = await get<any[]>('music-library-metadata');
          if (savedMetadata) {
            console.log(`Fallback: Loaded ${savedMetadata.length} tracks from metadata-only (no audio data)`);
            setTracks(savedMetadata as Track[]);
          } else {
            console.log("No library found in storage.");
          }
        }
      } catch (err) {
        console.error("Failed to load library from persistence:", err);
      }
    };
    loadLibrary();
  }, []);

  // 登录功能已移除，用户状态管理已删除

  // Track the previous length to avoid redundant saves
  const prevTracksLength = useRef(0);

  // Save library when it changes
  useEffect(() => {
    // Only save if the length changed (new songs added)
    if (tracks.length === prevTracksLength.current) return;
    
    const saveLibrary = async () => {
      if (tracks.length > 0) {
        try {
          console.log(`Saving library with ${tracks.length} tracks...`);
          // Save the full track array (Blobs/Files are supported in IndexedDB)
          // For cloud tracks, we don't have Blobs usually, so we save what we have
          const serializableTracks = tracks.map(t => {
            if (t.isCloud) {
              return { ...t, file: undefined }; // Don't try to save undefined file in IDB if it causes issues, but IDB handles it
            }
            return t;
          });
          await set('music-library-full', serializableTracks);
          
          // Also save metadata as a lightweight backup/registry
          const metadataOnly = tracks.map(({ file, coverBlob, ...rest }) => ({
            ...rest,
            coverBlob: typeof coverBlob === 'string' ? coverBlob : undefined
          }));
          await set('music-library-metadata', metadataOnly);
          
          console.log("Library successfully saved to IndexedDB");
          prevTracksLength.current = tracks.length;
        } catch (err) {
          console.error("Failed to save library to IndexedDB:", err);
          if (err instanceof Error && err.name === 'QuotaExceededError') {
            console.error("Storage quota exceeded! Cannot save more tracks.");
          }
        }
      } else if (prevTracksLength.current > 0) {
        // Library cleared
        await set('music-library-full', []);
        await set('music-library-metadata', []);
        prevTracksLength.current = 0;
      }
    };

    const timeout = setTimeout(saveLibrary, 2000);
    return () => clearTimeout(timeout);
  }, [tracks]);

  // 登录功能已移除，云同步功能禁用

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Save current playback state before updating tracks
    const wasPlaying = isPlaying;
    const currentTime = audioRef.current?.currentTime || 0;
    const currentTrackPath = currentTrack?.path || null;
    const currentTrackId = currentTrack?.id || null;
    
    setIsScanning(true);
    const newTracks = await processFiles(e.target.files);
    
    // Create the updated tracks array first
    const updatedTracks = [...tracks, ...newTracks];
    // Basic deduplication by path
    const uniqueTracks = Array.from(new Map(updatedTracks.map(t => [t.path, t])).values());
    // Sort: Album -> Disk -> TrackNo
    const sortedTracks = uniqueTracks.sort((a, b) => {
      if (a.album !== b.album) return a.album.localeCompare(b.album);
      if (a.diskNo !== b.diskNo) return (a.diskNo || 0) - (b.diskNo || 0);
      return (a.trackNo || 0) - (b.trackNo || 0);
    });
    
    // Find the updated track if currently playing
    let updatedCurrentTrack = null;
    if (currentTrackPath) {
      updatedCurrentTrack = sortedTracks.find(t => t.path === currentTrackPath) || 
                           sortedTracks.find(t => t.id === currentTrackId);
    }
    
    setTracks(sortedTracks);
    
    // Update currentTrack if found
    if (updatedCurrentTrack) {
      setCurrentTrack(updatedCurrentTrack);
    }
    
    setIsScanning(false);
    
    // Restore playback state if a track was playing
    if (wasPlaying && currentTrackPath && audioRef.current && updatedCurrentTrack) {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play().catch(err => console.error("Failed to resume playback:", err));
    }
    
    if (newTracks.length > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2dd4bf', '#f59e0b', '#fb7185']
      });
    }
  };

  const deleteTrack = async (track: Track) => {
    if (!confirm(`Are you sure you want to remove this song?`)) return;

    setTracks(prev => prev.filter(t => t.id !== track.id));
    
    if (currentTrack?.id === track.id) {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

  const handleScanTrigger = () => {
    fileInputRef.current?.click();
  };


  const toggleLike = async (trackTitle: string) => {
    const isLiked = likedSongIds.includes(trackTitle);
    const newLikedSongs = isLiked 
      ? likedSongIds.filter(id => id !== trackTitle)
      : [...likedSongIds, trackTitle];
    setLikedSongIds(newLikedSongs);
  };

  const createPlaylist = async (name: string) => {
    const newPlaylist = {
      id: Date.now().toString(),
      name,
      tracks: [],
      createdAt: new Date().toISOString()
    };
    setPlaylists([...playlists, newPlaylist]);
  };

  const addToPlaylist = async (playlistId: string, trackTitle: string) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: [...(p.tracks || []), trackTitle] };
      }
      return p;
    }));
  };

  const deletePlaylist = async (playlistId: string) => {
    setPlaylists(playlists.filter(p => p.id !== playlistId));
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null);
      setActiveView('songs');
    }
  };

  const handleTrackSelect = (track: Track) => {
    // Request notification permission on first interaction if needed
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    // If selecting from a list, update the queue if needed or just play
  };

  const filteredTracks = tracks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const playNext = useCallback((isAuto = false) => {
    if (!currentTrack || tracks.length === 0) return;
    
    const startNext = () => {
      // Mode: Single Loop
      if (playbackMode === 'one') {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(console.error);
          if (!isAuto) fadeAudio(fadeTargetVolume.current, 300);
        }
        return;
      }

      // Get current relevant list (Context)
      let contextTracks = tracks;
      if (playbackMode === 'album') {
        contextTracks = tracks.filter(t => t.album === currentTrack.album);
      }

      // Calculate next index
      let nextIndex: number;
      const currentIndex = contextTracks.findIndex(t => t.id === currentTrack.id);

      if (playbackMode === 'random') {
        nextIndex = Math.floor(Math.random() * contextTracks.length);
        if (nextIndex === currentIndex && contextTracks.length > 1) {
          nextIndex = (nextIndex + 1) % contextTracks.length;
        }
      } else {
        nextIndex = (currentIndex + 1) % contextTracks.length;
      }
      
      const next = contextTracks[nextIndex];
      if (next) {
        setCurrentTrack(next);
        setIsPlaying(true);
      }
    };

    if (isAuto) {
      startNext();
    } else {
      fadeAudio(0, 300);
      setTimeout(startNext, 300);
    }
  }, [currentTrack, tracks, playbackMode]);

  const handleRepairTrack = async (track: Track) => {
    try {
      console.log("Repairing track:", track.title);
      const response = await fetch(`/api/repair/${track.id}`, { method: 'POST' });
      if (!response.ok) throw new Error('Repair failed');
      
      const data = await response.json();
      if (data.success && data.track) {
        const repairedTrack = {
          ...data.track,
          coverBlob: data.track.externalCoverUrl || data.track.coverBlob
        };
        // Update local tracks state
        setTracks(prev => prev.map(t => t.id === track.id ? { ...t, ...repairedTrack } : t));
        
        // If current track is the one being repaired, update it too
        if (currentTrack?.id === track.id) {
          setCurrentTrack(prev => prev ? { ...prev, ...repairedTrack } : prev);
        }
        console.log("Repair success:", data.track.title);
      }
    } catch (err) {
      console.error("Failed to repair track:", err);
      alert("无法自动修复标签，请手动检查。");
    }
  };

  const handleTogglePiP = useCallback(() => {
    if (desktopLyricsRef.current) {
      desktopLyricsRef.current.requestPiP();
    }
  }, []);

  const togglePlaybackMode = useCallback(() => {
    setPlaybackMode(prev => {
      if (prev === 'list') return 'random';
      if (prev === 'random') return 'one';
      if (prev === 'one') return 'album';
      return 'list';
    });
  }, []);

  const toggleLyrics = useCallback(() => {
    setIsLyricsOpen(prev => !prev);
  }, []);

  const toggleQueue = useCallback(() => {
    setIsQueueOpen(prev => !prev);
  }, []);

  const currentTrackIsLiked = useMemo(() => {
    return currentTrack ? likedSongIds.includes(currentTrack.title) : false;
  }, [currentTrack?.title, likedSongIds]);

  const handleToggleLike = useCallback(() => {
    if (currentTrack) toggleLike(currentTrack.title);
  }, [currentTrack?.title, toggleLike]);



  const playPrevious = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    
    // Get current relevant list (Context)
    let contextTracks = tracks;
    if (playbackMode === 'album') {
      contextTracks = tracks.filter(t => t.album === currentTrack.album);
    }

    const currentIndex = contextTracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex <= 0 ? contextTracks.length - 1 : currentIndex - 1;
    fadeAudio(0, 300);
    setTimeout(() => {
      setCurrentTrack(contextTracks[prevIndex]);
    }, 300);
  }, [currentTrack, tracks, playbackMode]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        
        try {
          const source = ctx.createMediaElementSource(audioRef.current);
          setAudioSourceNode(source);
        } catch (e) {
          console.warn("Failed to create audio source node:", e);
        }
      }
    }
    const audio = audioRef.current;
    
    if (!currentTrack) {
      if (audio.src) {
        audio.pause();
        audio.src = "";
        setIsPlaying(false);
      }
      return;
    }
    
    // Cloud track or local Blob/File
    let url: string = "";
    let isObjectURL = false;

    if (currentTrack.isCloud && currentTrack.downloadUrl) {
      url = currentTrack.downloadUrl;
    } else if ((currentTrack as any).isBackend) {
      url = `/api/stream/${currentTrack.id}`;
    } else if (currentTrack.file instanceof Blob) {
      url = URL.createObjectURL(currentTrack.file);
      isObjectURL = true;
    } else {
      console.error("Track has no playable source:", currentTrack);
      return;
    }

    audio.src = url;
    audio.load();
    audio.volume = volume;

    const updateProgress = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        const currentProgress = (audio.currentTime / audio.duration) * 100;
        setProgress(currentProgress);

        // Preload logic for gapless (15s before end)
        if (audio.duration - audio.currentTime < 15 && tracks.length > 0) {
           let contextTracks = tracks;
           if (playbackMode === 'album' && currentTrack) {
             contextTracks = tracks.filter(t => t.album === currentTrack.album);
           }
           const currentIndex = contextTracks.findIndex(t => t.id === currentTrack?.id);
           const nextIndex = (currentIndex + 1) % contextTracks.length;
           const candidate = contextTracks[nextIndex];

           if (candidate && (!nextTrack || nextTrack.id !== candidate.id)) {
              setNextTrack(candidate);
              if (!nextAudioRef.current) nextAudioRef.current = new Audio();
              const preloadUrl = candidate.isBackend ? `/api/stream/${candidate.id}` : 
                          (candidate.isCloud ? candidate.downloadUrl : (candidate.file instanceof Blob ? URL.createObjectURL(candidate.file) : ""));
              if (preloadUrl) {
                nextAudioRef.current.src = preloadUrl;
                nextAudioRef.current.preload = "auto";
                console.log("Gapless: Preloading", candidate.title);
              }
           }
        }

        // Sync media session position
        if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
          try {
            navigator.mediaSession.setPositionState({
              duration: audio.duration,
              playbackRate: audio.playbackRate,
              position: audio.currentTime
            });
          } catch (e) {
            console.warn("Failed to set Media Session position state", e);
          }
        }
      }
    };

    const handleEnded = () => {
        // Only handle ended if we're actually at the end (within 1 second of duration)
        // This prevents premature triggering due to buffering or seek issues
        if (audio.duration && audio.currentTime >= audio.duration - 1) {
          playNext(true); // isAuto = true for gapless
        }
    };

    const handleError = (e: any) => {
      console.error("Audio element error:", audio.error);
    };

    const handleCanPlay = () => {
      // Don't auto-play if we're near the end of the current track
      // This prevents restart issues when switching tracks
      if (isPlaying && audio.duration && audio.currentTime < audio.duration - 2) {
        audio.play().catch(err => {
          if (err.name !== 'AbortError') {
            console.error("Playback failed in canplay:", err);
          }
        });
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Initial play if already isPlaying
    if (isPlaying) {
      audio.play().catch(err => {
          if (err.name !== 'AbortError') console.error("Initial play failed", err);
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      if (isObjectURL) URL.revokeObjectURL(url);
    };
  }, [currentTrack, tracks, playbackMode, playNext, nextTrack]);

  // Handle play/pause toggles without reloading the track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(err => {
        if (err.name !== 'AbortError') console.error("Toggle play failed", err);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Media Session API integration
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    let artworkUrl = '';

    if (currentTrack) {
      if (typeof currentTrack.coverBlob === 'string') {
        artworkUrl = currentTrack.coverBlob;
      } else if (currentTrack.coverBlob instanceof Blob) {
        artworkUrl = URL.createObjectURL(currentTrack.coverBlob);
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Local Library',
        artwork: artworkUrl ? [
          { src: artworkUrl, sizes: '96x96', type: 'image/png' },
          { src: artworkUrl, sizes: '128x128', type: 'image/png' },
          { src: artworkUrl, sizes: '192x192', type: 'image/png' },
          { src: artworkUrl, sizes: '256x256', type: 'image/png' },
          { src: artworkUrl, sizes: '384x384', type: 'image/png' },
          { src: artworkUrl, sizes: '512x512', type: 'image/png' },
        ] : []
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } else {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    }

    const playHandler = () => setIsPlaying(true);
    const pauseHandler = () => setIsPlaying(false);
    const prevHandler = () => playPrevious();
    const nextHandler = () => playNext();

    navigator.mediaSession.setActionHandler('play', playHandler);
    navigator.mediaSession.setActionHandler('pause', pauseHandler);
    navigator.mediaSession.setActionHandler('previoustrack', prevHandler);
    navigator.mediaSession.setActionHandler('nexttrack', nextHandler);

    // Optional: Seeking from notification
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && details.seekTime !== null) {
        handleSeek((details.seekTime / (audioRef.current?.duration || 1)) * 100);
      }
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      if (artworkUrl && artworkUrl.startsWith('blob:')) {
        URL.revokeObjectURL(artworkUrl);
      }
    };
  }, [currentTrack, isPlaying, playNext, playPrevious]);

  return (
    <div 
      className="app-shell flex flex-col h-screen w-full text-white font-sans overflow-hidden select-none"
      style={{ 
        backgroundImage: `radial-gradient(ellipse at 60% 0%, ${trackColor}16 0%, transparent 58%), radial-gradient(ellipse at 0% 100%, rgba(245,158,11,0.09) 0%, transparent 52%)`,
        backgroundColor: darkMode ? '#030504' : '#f8faf9',
        color: darkMode ? 'white' : '#1f2937',
        // @ts-ignore
        '--theme-color': trackColor,
        '--accent-color': '#2dd4bf'
      } as any}
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`hidden lg:flex w-64 flex-col pt-5 backdrop-blur-xl border-r transition-colors ${
          darkMode 
            ? 'bg-[#070908]/85 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <div className="px-5 mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br from-teal-300 via-emerald-400 to-amber-300 flex items-center justify-center flex-shrink-0 text-black ${
                darkMode ? 'shadow-lg shadow-teal-500/20' : 'shadow-md shadow-teal-300/50'
              }`}>
                <Play size={16} fill="white" className="ml-0.5" />
              </div>
              <div className="flex flex-col">
                <span className={`font-bold text-lg leading-none tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Soundscape</span>
                <span className={`text-[10px] font-semibold tracking-widest uppercase ${darkMode ? 'text-amber-200' : 'text-amber-600'}`}>Studio</span>
              </div>
            </div>
          </div>

            <div className="flex flex-col px-2">
              <SidebarItem icon={Home} label={t(language).home} active={activeView === 'songs' && !selectedAlbum && !selectedPlaylistId} onClick={() => { setActiveView('songs'); setSelectedAlbum(null); setSelectedPlaylistId(null); }} darkMode={darkMode} />
              <SidebarItem icon={Search} label={t(language).search} active={activeView === 'search'} onClick={() => { setActiveView('search'); setSelectedPlaylistId(null); }} darkMode={darkMode} />
              <SidebarItem icon={Disc} label={t(language).albums} active={activeView === 'albums'} onClick={() => { setActiveView('albums'); setSelectedAlbum(null); setSelectedPlaylistId(null); }} darkMode={darkMode} />
              <SidebarItem icon={Wand2} label="工具" active={activeView === 'tools'} onClick={() => { setActiveView('tools'); setSelectedAlbum(null); setSelectedPlaylistId(null); setSelectedTool(null); }} darkMode={darkMode} />
              <SidebarItem icon={Settings} label={t(language).settings} active={activeView === 'settings'} onClick={() => { setActiveView('settings'); setSelectedAlbum(null); setSelectedPlaylistId(null); }} darkMode={darkMode} />
            </div>

          <SidebarSection title={t(language).playlist} darkMode={darkMode}>
            <SidebarItem icon={PlusSquare} label={t(language).createPlaylist || 'Create Playlist'} onClick={() => setIsPlaylistModalOpen(true)} darkMode={darkMode} />
            <SidebarItem icon={Heart} label={t(language).likedSongs || 'Liked Songs'} active={activeView === 'liked'} onClick={() => { setActiveView('liked'); setSelectedAlbum(null); setSelectedPlaylistId(null); }} darkMode={darkMode} />
            
            {playlists.map(playlist => (
              <SidebarItem 
                key={playlist.id} 
                icon={ListMusic} 
                label={playlist.name} 
                active={activeView === 'playlist' && selectedPlaylistId === playlist.id}
                onClick={() => {
                  setSelectedPlaylistId(playlist.id);
                  setActiveView('playlist');
                  setSelectedAlbum(null);
                }}
                darkMode={darkMode}
              />
            ))}
          </SidebarSection>
          
          <div className="mt-auto px-3 pb-5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              // @ts-ignore
              webkitdirectory=""
              directory=""
              className="hidden"
            />
            <button
              onClick={handleScanTrigger}
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-2 bg-teal-300/10 hover:bg-teal-300/15 border border-teal-300/20 hover:border-teal-300/35 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 text-teal-100 hover:text-white"
            >
              <FolderOpen size={16} />
              {isScanning ? "Scanning..." : "Scan Local Music"}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-hidden w-full bg-transparent">
          <MainHeader 
            activeView={activeView}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            darkMode={darkMode}
          />

          {/* List Area */}
          <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
               <>
                 {activeView !== 'settings' && activeView !== 'tools' && (
                   <HeroSection 
                     activeView={activeView}
                     selectedAlbum={selectedAlbum}
                     selectedPlaylistId={selectedPlaylistId}
                     currentTrack={currentTrack}
                     tracks={tracks}
                     playlists={playlists}
                     likedSongIds={likedSongIds}
                     darkMode={darkMode}
                   />
                 )}

                 {activeView !== 'settings' && activeView !== 'tools' && (
                   <div className="px-4 md:px-8 mt-2 md:mt-4">
      
                     <div className="flex items-center gap-4 md:gap-8 mb-4 sticky top-16 bg-transparent py-2">
                       <button 
                         onClick={() => {
                           let list: Track[] = tracks;
                           if (selectedAlbum) list = tracks.filter(t => t.album === selectedAlbum);
                           else if (selectedPlaylistId) {
                              const trackTitles = playlists.find(p => p.id === selectedPlaylistId)?.tracks || [];
                              list = tracks.filter(t => trackTitles.includes(t.title));
                           }
                           else if (activeView === 'liked') list = tracks.filter(t => likedSongIds.includes(t.title));
                           
                           if (list.length > 0) handleTrackSelect(list[0]);
                         }}
                         className={`w-12 h-12 md:w-14 md:h-14 bg-teal-300 rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform active:scale-95 ${
                           darkMode ? 'shadow-lg shadow-teal-500/20' : 'shadow-md shadow-teal-300/50'
                         }`}
                       >
                         <Play size={24} className="md:w-7 md:h-7 ml-1" fill="currentColor" />
                       </button>
                       {(selectedAlbum || selectedPlaylistId) && (
                         <div className="flex gap-4">
                           <button 
                             onClick={() => { setSelectedAlbum(null); setSelectedPlaylistId(null); }}
                             className={`font-bold text-sm uppercase tracking-widest border px-4 py-2 rounded-lg transition-colors ${
                               darkMode 
                                 ? 'text-stone-400 hover:text-white border-white/10' 
                                 : 'text-gray-700 hover:text-gray-900 border-gray-300'
                             }`}
                           >
                             Back
                           </button>
                           {selectedPlaylistId && (
                             <button 
                               onClick={() => {
                                 if (confirm('Are you sure you want to delete this playlist?')) {
                                   deletePlaylist(selectedPlaylistId);
                                 }
                               }}
                               className="text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-sm uppercase tracking-widest border border-rose-500/30 px-4 py-2 rounded-lg transition-all"
                             >
                               <div className="flex items-center gap-2">
                                 <Trash2 size={16} />
                                 Delete
                               </div>
                             </button>
                           )}
                         </div>
                       )}
                       <Heart size={32} className="text-rose-300" fill="currentColor" />
                       <FolderOpen 
                         size={30} 
                         className={`cursor-pointer transition-colors ${
                           darkMode ? 'text-stone-400 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                         }`} 
                         onClick={handleScanTrigger} 
                         title="Scan Local Files" 
                       />
                     </div>
                   </div>
                 )}
    
                 {activeView === 'settings' ? (
                   <section className="px-4 md:px-8 mt-4 md:mt-6 pb-20">
                     <div className="mb-8">
                       <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-amber-200' : 'text-amber-600'}`}>{t(language).preferences}</p>
                       <h2 className={`text-2xl md:text-3xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(language).settings}</h2>
                     </div>

                     <div className="flex flex-col gap-6">
                       <div className={`border rounded-xl p-5 transition-colors ${
                         darkMode
                           ? 'bg-white/5 border-white/10'
                           : 'bg-gray-50 border-gray-200'
                       }`}>
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                             {darkMode ? <Moon size={20} className="text-indigo-300" /> : <Sun size={20} className="text-amber-500" />}
                             <div>
                               <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(language).theme}</h3>
                               <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-gray-600'}`}>{darkMode ? t(language).darkMode : t(language).lightMode}</p>
                             </div>
                           </div>
                           <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${
                              darkMode ? 'bg-teal-300/20' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-all ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                         </div>
                       </div>

                       <div className={`border rounded-xl p-5 transition-colors ${
                         darkMode
                           ? 'bg-white/5 border-white/10'
                           : 'bg-gray-50 border-gray-200'
                       }`}>
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <Layers size={20} className={darkMode ? 'text-teal-300' : 'text-teal-500'} />
                             <div>
                               <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(language).desktopLyrics}</h3>
                               <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-gray-600'}`}>{t(language).desktopLyricsDesc}</p>
                             </div>
                           </div>
                           <button
                            onClick={() => setShowDesktopLyrics(!showDesktopLyrics)}
                            className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${
                              darkMode ? 'bg-teal-300/20' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-all ${showDesktopLyrics ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                         </div>
                       </div>

                       <div className={`border rounded-xl p-5 transition-colors ${
                         darkMode
                           ? 'bg-white/5 border-white/10'
                           : 'bg-gray-50 border-gray-200'
                       }`}>
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                             <PlayCircle size={20} className={darkMode ? 'text-emerald-300' : 'text-emerald-500'} />
                             <div>
                               <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(language).autoPlay}</h3>
                               <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-gray-600'}`}>{t(language).autoPlayDesc}</p>
                             </div>
                           </div>
                           <button
                             onClick={() => {}}
                             className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${darkMode ? 'bg-teal-300/20' : 'bg-gray-300'}`}
                           >
                             <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-all translate-x-0`} />
                           </button>
                         </div>
                       </div>

                       <div className={`border rounded-xl p-5 transition-colors ${
                         darkMode
                           ? 'bg-white/5 border-white/10'
                           : 'bg-gray-50 border-gray-200'
                       }`}>
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                             <Volume2 size={20} className={darkMode ? 'text-cyan-300' : 'text-cyan-500'} />
                             <div>
                               <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(language).volumeBoost}</h3>
                               <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-gray-600'}`}>{t(language).volumeBoostDesc}</p>
                             </div>
                           </div>
                           <button
                             onClick={() => {}}
                             className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${darkMode ? 'bg-teal-300/20' : 'bg-gray-300'}`}
                           >
                             <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-all translate-x-0`} />
                           </button>
                         </div>
                       </div>

                       <div className={`border rounded-xl p-5 transition-colors ${
                         darkMode
                           ? 'bg-white/5 border-white/10'
                           : 'bg-gray-50 border-gray-200'
                       }`}>
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                             <Bell size={20} className={darkMode ? 'text-amber-300' : 'text-amber-500'} />
                             <div>
                               <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(language).notifications}</h3>
                               <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-gray-600'}`}>{t(language).notificationsDesc}</p>
                             </div>
                           </div>
                           <button
                             onClick={() => {}}
                             className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${darkMode ? 'bg-teal-300/20' : 'bg-gray-300'}`}
                           >
                             <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-all ${true ? 'translate-x-6' : 'translate-x-0'}`} />
                           </button>
                         </div>
                       </div>

                       <div className={`border rounded-xl p-5 transition-colors ${
                         darkMode
                           ? 'bg-white/5 border-white/10'
                           : 'bg-gray-50 border-gray-200'
                       }`}>
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                             <FolderOpen size={20} className={darkMode ? 'text-stone-300' : 'text-gray-600'} />
                             <div>
                               <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(language).musicLibrary}</h3>
                               <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-gray-600'}`}>{t(language).musicLibraryDesc}</p>
                             </div>
                           </div>
                           <span className={`text-xs font-mono px-2 py-1 rounded ${darkMode ? 'bg-white/10 text-stone-400' : 'bg-gray-200 text-gray-600'}`}>
                             {tracks.length} {t(language).tracks}
                           </span>
                         </div>
                       </div>

                       <div className={`border rounded-xl p-5 transition-colors ${
                         darkMode
                           ? 'bg-white/5 border-white/10'
                           : 'bg-gray-50 border-gray-200'
                       }`}>
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                             <Repeat size={20} className={darkMode ? 'text-teal-300' : 'text-teal-500'} />
                             <div>
                               <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(language).playbackMode}</h3>
                               <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-gray-600'}`}>Current: {playbackMode.charAt(0).toUpperCase() + playbackMode.slice(1)}</p>
                             </div>
                           </div>
                           <button
                             onClick={togglePlaybackMode}
                             className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                               darkMode
                                 ? 'bg-teal-300/20 text-teal-300 hover:bg-teal-300/30'
                                 : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                             }`}
                           >
                             {t(language).change}
                           </button>
                         </div>
                       </div>

                       <div className={`border rounded-xl p-5 transition-colors ${
                         darkMode
                           ? 'bg-white/5 border-white/10'
                           : 'bg-gray-50 border-gray-200'
                       }`}>
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                             <Languages size={20} className={darkMode ? 'text-blue-300' : 'text-blue-500'} />
                             <div>
                               <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(language).language}</h3>
                               <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-gray-600'}`}>
                                 {language === 'zh' ? t(language).chinese : t(language).english}
                               </p>
                             </div>
                           </div>
                           <button
                             onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                             className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                               darkMode
                                 ? 'bg-teal-300/20 text-teal-300 hover:bg-teal-300/30'
                                 : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                             }`}
                           >
                             {language === 'zh' ? t(language).english : t(language).chinese}
                           </button>
                         </div>
                       </div>

                       <div className={`border rounded-xl p-5 transition-colors ${
                         darkMode
                           ? 'bg-white/5 border-white/10'
                           : 'bg-gray-50 border-gray-200'
                       }`}>
                         <div className="flex items-center gap-3 mb-4">
                           <Activity size={20} className={darkMode ? 'text-purple-300' : 'text-purple-500'} />
                           <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(language).about}</h3>
                         </div>
                         <p className={`text-sm mb-2 ${darkMode ? 'text-stone-400' : 'text-gray-600'}`}>Soundscape Studio v1.0.0</p>
                         <p className={`text-xs ${darkMode ? 'text-stone-500' : 'text-gray-500'}`}>Built with React, Firebase & Vite</p>
                       </div>
                     </div>
                   </section>
                 ) : activeView === 'tools' ? (
                   selectedTool ? (
                     <section className="px-4 md:px-8 mt-4 md:mt-6 pb-20">
                       <div className="flex items-center gap-4 mb-6">
                         <button 
                           onClick={() => setSelectedTool(null)}
                           className={`p-2 rounded-full hover:bg-white/10 transition-colors ${darkMode ? 'text-stone-400' : 'text-gray-500'}`}
                         >
                           <ChevronLeft size={24} />
                         </button>
                         <div>
                           <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-amber-200' : 'text-amber-600'}`}>工具</p>
                           <h2 className={`text-2xl md:text-3xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                             {selectedTool === 'stem' ? 'AI 分轨' : selectedTool === 'equalizer' ? '均衡器' : '交叉淡入淡出'}
                           </h2>
                         </div>
                       </div>
                       <div className={darkMode ? "bg-white/5 rounded-2xl p-6" : "bg-gray-100 rounded-2xl p-6"}>
                         {selectedTool === 'stem' && (
                           <StemPlayer
                             isOpen={true}
                             onClose={() => { setSelectedTool(null); }}
                             currentTrack={currentTrack}
                             isPlaying={isPlaying}
                             onPlayPause={handleTogglePlay}
                             darkMode={darkMode}
                           />
                         )}
                         {selectedTool === 'equalizer' && (
                           <Equalizer
                             isOpen={true}
                             onClose={() => { setIsEqualizerOpen(false); setSelectedTool(null); }}
                             audioContext={audioContext}
                             sourceNode={audioSourceNode}
                             darkMode={darkMode}
                           />
                         )}
                         {selectedTool === 'crossfade' && (
                           <Crossfade
                             isOpen={true}
                             onClose={() => { setIsCrossfadeOpen(false); setSelectedTool(null); }}
                             enabled={crossfadeEnabled}
                             onToggleEnabled={() => setCrossfadeEnabled(!crossfadeEnabled)}
                             duration={crossfadeDuration}
                             onDurationChange={setCrossfadeDuration}
                             darkMode={darkMode}
                           />
                         )}
                       </div>
                     </section>
                   ) : (
                     <section className="px-4 md:px-8 mt-4 md:mt-6 pb-20">
                       <div className="mb-6">
                         <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-amber-200' : 'text-amber-600'}`}>Tools</p>
                         <h2 className={`text-2xl md:text-3xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>工具</h2>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                         <div 
                           onClick={() => setSelectedTool('stem')}
                           className={`group cursor-pointer rounded-xl p-4 transition-all hover:scale-105 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                         >
                           <div className={`w-full aspect-square rounded-lg mb-3 flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-purple-400 to-pink-400'}`}>
                             <Wand2 size={48} className="text-white" />
                           </div>
                           <h3 className={`font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI 分轨</h3>
                           <p className={`text-sm truncate ${darkMode ? 'text-stone-400' : 'text-gray-500'}`}>分离音频轨道</p>
                         </div>
                         <div 
                           onClick={() => setSelectedTool('equalizer')}
                           className={`group cursor-pointer rounded-xl p-4 transition-all hover:scale-105 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                         >
                           <div className={`w-full aspect-square rounded-lg mb-3 flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-teal-500 to-emerald-500' : 'bg-gradient-to-br from-teal-400 to-emerald-400'}`}>
                             <Sliders size={48} className="text-white" />
                           </div>
                           <h3 className={`font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>均衡器</h3>
                           <p className={`text-sm truncate ${darkMode ? 'text-stone-400' : 'text-gray-500'}`}>调节音频频率</p>
                         </div>
                         <div 
                           onClick={() => setSelectedTool('crossfade')}
                           className={`group cursor-pointer rounded-xl p-4 transition-all hover:scale-105 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                         >
                           <div className={`w-full aspect-square rounded-lg mb-3 flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-amber-400 to-orange-400'}`}>
                             <Merge size={48} className="text-white" />
                           </div>
                           <h3 className={`font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>交叉淡入淡出</h3>
                           <p className={`text-sm truncate ${darkMode ? 'text-stone-400' : 'text-gray-500'}`}>平滑过渡歌曲</p>
                         </div>
                       </div>
                     </section>
                   )
                 ) : (activeView === 'songs' || activeView === 'liked' || activeView === 'search' || activeView === 'playlist' || selectedAlbum) ? (
                   <TrackList 
                     tracks={
                      selectedAlbum 
                        ? tracks.filter(t => t.album === selectedAlbum) 
                        : (selectedPlaylistId 
                            ? tracks.filter(t => playlists.find(p => p.id === selectedPlaylistId)?.tracks.includes(t.title))
                            : (activeView === 'liked' 
                                ? tracks.filter(t => likedSongIds.includes(t.title)) 
                                : (activeView === 'search' ? filteredTracks : tracks)))
                     } 
                     currentTrackId={currentTrack?.id || null} 
                     onTrackSelect={handleTrackSelect} 
                     likedSongIds={likedSongIds}
                     onToggleLike={toggleLike}
                     playlists={playlists}
                     onAddToPlaylist={addToPlaylist}
                     onDeleteTrack={deleteTrack}
                     onRepairTrack={handleRepairTrack}
                     emptyMessage={
                       activeView === 'search' ? (searchQuery ? "No results found" : "Start searching...") :
                       activeView === 'liked' ? "No liked songs yet" :
                       selectedPlaylistId ? "This playlist is empty" :
                       "Empty Library"
                     }
                     emptyIcon={
                       activeView === 'search' ? <Search size={64} className="mb-4 opacity-20" /> : undefined
                     }
                     darkMode={darkMode}
                   />
                 ) : (
                   <section className="px-4 md:px-8 mt-4 md:mt-6 pb-20">
                     <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
                       <div>
                         <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                           darkMode ? 'text-amber-200' : 'text-amber-600'
                         }`}>Record shelf</p>
                         <h2 className={`text-2xl md:text-3xl font-black mt-1 ${
                           darkMode ? 'text-white' : 'text-gray-900'
                         }`}>Albums</h2>
                       </div>
                       <div className={`flex items-center gap-3 text-xs font-semibold ${
                         darkMode ? 'text-stone-400' : 'text-gray-600'
                       }`}>
                         <span className={`rounded-lg border px-3 py-2 transition-colors ${
                           darkMode 
                             ? 'border-white/10 bg-white/[0.04]' 
                             : 'border-gray-200 bg-gray-100'
                         }`}>
                           {Array.from(new Set(tracks.map(t => t.album))).length} albums
                         </span>
                         <span className={`rounded-lg border px-3 py-2 transition-colors ${
                           darkMode 
                             ? 'border-white/10 bg-white/[0.04]' 
                             : 'border-gray-200 bg-gray-100'
                         }`}>
                           {tracks.length} tracks
                         </span>
                       </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5">
                       {Array.from(new Set(tracks.map(t => t.album))).map(albumName => {
                         const albumTracks = tracks.filter(t => t.album === albumName);
                         const firstTrack = albumTracks[0];
                         const durationSeconds = albumTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
                         const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
                         const artistNames = Array.from(new Set(albumTracks.map(t => t.artist))).slice(0, 2).join(', ');
                         return (
                           <button
                             key={albumName}
                             onClick={() => {
                               setSelectedAlbum(albumName);
                             }}
                             className={`group grid grid-cols-[92px_1fr] md:grid-cols-[118px_1fr] gap-4 rounded-lg p-3 text-left transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-300/50 ${
                               darkMode 
                                 ? 'bg-[#0a0e0d]/80 border border-white/10 hover:bg-white/[0.07]' 
                                 : 'bg-white/80 border border-gray-200 hover:bg-gray-100'
                             }`}
                           >
                              <div className={`relative aspect-square overflow-hidden rounded-lg ring-1 transition-colors ${
                                darkMode 
                                  ? 'shadow-2xl ring-white/10' 
                                  : 'shadow-lg shadow-gray-300/50 ring-gray-200'
                              }`}>
                                <CoverImage blob={firstTrack.coverBlob} className="w-full h-full transition-transform duration-500 group-hover:scale-105" iconSize={56} darkMode={darkMode} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent opacity-80" />
                                <span className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-teal-100 backdrop-blur">
                                  LP
                                </span>
                                <span className={`absolute bottom-2 right-2 hidden h-9 w-9 items-center justify-center rounded-full bg-teal-300 text-black transition-all group-hover:flex ${
                                  darkMode ? 'shadow-xl shadow-teal-500/20' : 'shadow-lg'
                                }`}>
                                  <Play size={18} fill="currentColor" className="ml-0.5" />
                                </span>
                              </div>

                              <div className="flex min-w-0 flex-col justify-between py-1">
                                <div className="min-w-0">
                                  <h3 className={`truncate text-base md:text-lg font-black ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                  }`}>{albumName}</h3>
                                  <p className={`mt-1 truncate text-sm font-semibold ${
                                    darkMode ? 'text-stone-300' : 'text-gray-600'
                                  }`}>{artistNames || firstTrack.artist}</p>
                                </div>
                                <div className={`mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold ${
                                  darkMode ? 'text-stone-400' : 'text-gray-600'
                                }`}>
                                  <span className={`rounded-md px-2 py-1 transition-colors ${
                                    darkMode ? 'bg-white/[0.06]' : 'bg-gray-100'
                                  }`}>{albumTracks.length} tracks</span>
                                  <span className={`rounded-md px-2 py-1 transition-colors ${
                                    darkMode ? 'bg-white/[0.06]' : 'bg-gray-100'
                                  }`}>{durationMinutes} min</span>
                                  <span className={`rounded-md px-2 py-1 ${
                                    darkMode ? 'bg-amber-300/10 text-amber-100' : 'bg-amber-100 text-amber-700'
                                  }`}>Open</span>
                                </div>
                              </div>
                           </button>
                         );
                       })}
                     </div>
                   </section>
                 )}
               </>
             </div>
        </main>
      </div>

      {/* Player Bar */}
      <Player 
        currentTrack={currentTrack} 
        isPlaying={isPlaying} 
        onTogglePlay={handleTogglePlay}
        onNext={playNext}
        onPrevious={playPrevious}
        onToggleLyrics={toggleLyrics}
        isLiked={currentTrackIsLiked}
        onToggleLike={handleToggleLike}
        playbackMode={playbackMode}
        onTogglePlaybackMode={togglePlaybackMode}
        onToggleQueue={toggleQueue}
        progress={progress}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onTogglePiP={handleTogglePiP}
        darkMode={darkMode}
      />

      <Equalizer
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        audioContext={audioContext}
        sourceNode={audioSourceNode}
        darkMode={darkMode}
      />

      <Crossfade
        isOpen={isCrossfadeOpen}
        onClose={() => setIsCrossfadeOpen(false)}
        enabled={crossfadeEnabled}
        onToggleEnabled={() => setCrossfadeEnabled(!crossfadeEnabled)}
        duration={crossfadeDuration}
        onDurationChange={setCrossfadeDuration}
        darkMode={darkMode}
      />

      {/* Mobile Bottom Navigation */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 h-16 backdrop-blur-lg border-t flex items-center justify-around z-50 px-2 pb-safe transition-colors ${
        darkMode 
          ? 'bg-[#090d0c]/95 border-white/10' 
          : 'bg-white/95 border-gray-200'
      }`}>
        <button 
          onClick={() => { setActiveView('songs'); setSelectedAlbum(null); setSelectedPlaylistId(null); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", 
            activeView === 'songs' && !selectedAlbum && !selectedPlaylistId 
              ? "text-teal-200" 
              : (darkMode ? "text-stone-500" : "text-gray-500")
          )}
        >
          <Home size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={() => { setActiveView('search'); setSelectedPlaylistId(null); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", 
            activeView === 'search' 
              ? "text-teal-200" 
              : (darkMode ? "text-stone-500" : "text-gray-500")
          )}
        >
          <Search size={20} />
          <span className="text-[10px] font-medium">Search</span>
        </button>
        <button 
          onClick={() => setIsLyricsOpen(true)}
          className={cn("flex flex-col items-center gap-1 transition-colors", 
            isLyricsOpen 
              ? "text-amber-200" 
              : (darkMode ? "text-stone-500" : "text-gray-500")
          )}
          disabled={!currentTrack}
        >
          <Music size={20} className={currentTrack && isPlaying ? "animate-pulse" : ""} />
          <span className="text-[10px] font-medium">Playing</span>
        </button>
        <button 
          onClick={() => { setActiveView('settings'); setSelectedAlbum(null); setSelectedPlaylistId(null); }}
          className={cn("flex flex-col items-center gap-1 transition-colors", 
            activeView === 'settings' 
              ? "text-teal-200" 
              : (darkMode ? "text-stone-500" : "text-gray-500")
          )}
        >
          <Settings size={20} />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>

      {/* Queue Sidebar Overlay */}
      <AnimatePresence>
        {isQueueOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 bottom-24 w-80 backdrop-blur-xl z-40 flex flex-col p-6 border-l transition-colors ${
              darkMode 
                ? 'bg-[#0b100f]/95 shadow-2xl border-white/10' 
                : 'bg-white/95 shadow-xl shadow-gray-200/80 border-gray-200'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Queue</h2>
              <button 
                onClick={() => setIsQueueOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
               <div className="mb-4">
                  <span className="text-sm font-bold text-stone-400">Now playing</span>
                  {currentTrack && (
                    <div className="flex items-center gap-3 mt-2 p-2 rounded-lg bg-white/[0.06]">
                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                        <CoverImage blob={currentTrack.coverBlob} className="w-full h-full" iconSize={20} darkMode={darkMode} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate text-teal-200">{currentTrack.title}</span>
                        <span className="text-xs text-stone-400 truncate">{currentTrack.artist}</span>
                      </div>
                    </div>
                  )}
               </div>

               <div>
                 <span className="text-sm font-bold text-stone-400">Next in queue</span>
                 <div className="mt-2 flex flex-col gap-1">
                   {tracks.slice(tracks.findIndex(t => t.id === currentTrack?.id) + 1).slice(0, 20).map(track => (
                     <div 
                       key={track.id}
                       onClick={() => handleTrackSelect(track)}
                       className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.07] transition-colors group cursor-pointer"
                     >
                        <div className="w-10 h-10 rounded-lg overflow-hidden">
                          <CoverImage blob={track.coverBlob} className="w-full h-full" iconSize={16} darkMode={darkMode} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate group-hover:text-white">{track.title}</span>
                          <span className="text-[10px] text-stone-400 truncate">{track.artist}</span>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Creation Modal */}
      <PlaylistModal 
        isOpen={isPlaylistModalOpen} 
        onClose={() => setIsPlaylistModalOpen(false)} 
        onCreate={createPlaylist} 
      />

      {/* Lyrics View Overlay */}
      <LyricsView 
        track={currentTrack} 
        isOpen={isLyricsOpen} 
        onClose={() => setIsLyricsOpen(false)} 
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={playNext}
        onPrevious={playPrevious}
        progress={progress}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        playbackMode={playbackMode}
        onTogglePlaybackMode={togglePlaybackMode}
        bgColor={trackColor}
        secondaryColor={secondaryColor}
      />

      <DesktopLyrics 
        ref={desktopLyricsRef}
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={playNext}
        onPrevious={playPrevious}
      />
    </div>
  );
}
