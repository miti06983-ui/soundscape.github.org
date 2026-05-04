import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Mic2, 
  Drum, 
  Guitar, 
  Piano,
  Volume2,
  VolumeX,
  Loader2,
  RefreshCw,
  Wand2,
  Headphones,
  Play,
  X,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface StemTrack {
  id: string;
  name: string;
  icon: React.ReactNode;
  volume: number;
  muted: boolean;
  url?: string;
}

interface StemPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: any;
  isPlaying: boolean;
  onPlayPause: () => void;
  darkMode: boolean;
}

const STEM_TYPES = [
  { id: 'vocals', name: '人声', icon: <Mic2 size={18} />, color: 'from-pink-500 to-rose-500' },
  { id: 'drums', name: '鼓组', icon: <Drum size={18} />, color: 'from-orange-500 to-amber-500' },
  { id: 'bass', name: '贝斯', icon: <Guitar size={18} />, color: 'from-cyan-500 to-blue-500' },
  { id: 'other', name: '其他', icon: <Piano size={18} />, color: 'from-purple-500 to-indigo-500' },
];

export function StemPlayer({ 
  isOpen, 
  onClose, 
  currentTrack, 
  isPlaying,
  onPlayPause,
  darkMode 
}: StemPlayerProps) {
  const [isSeparating, setIsSeparating] = useState(false);
  const [isSeparated, setIsSeparated] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stems, setStems] = useState<StemTrack[]>([
    { id: 'vocals', name: '人声', icon: <Mic2 size={18} />, volume: 100, muted: false },
    { id: 'drums', name: '鼓组', icon: <Drum size={18} />, volume: 100, muted: false },
    { id: 'bass', name: '贝斯', icon: <Guitar size={18} />, volume: 100, muted: false },
    { id: 'other', name: '其他', icon: <Piano size={18} />, volume: 100, muted: false },
  ]);
  const [stemPlaying, setStemPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(100);
  
  const stemAudiosRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const stemPollingRef = useRef<NodeJS.Timeout | null>(null);

  const clearStemPoll = useCallback(() => {
    if (stemPollingRef.current) {
      clearInterval(stemPollingRef.current);
      stemPollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearStemPoll();
      Object.values(stemAudiosRef.current).forEach((audio: HTMLAudioElement) => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [clearStemPoll]);

  const startSeparation = async () => {
    if (!currentTrack?.id) return;
    
    setIsSeparating(true);
    setProgress(0);
    setError(null);
    setIsSeparated(false);

    try {
      const response = await fetch('/api/stem-separate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: currentTrack.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to start separation');
      }

      const data = await response.json();
      setJobId(data.jobId);

      stemPollingRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/stem-status/${data.jobId}`);
          const status = await statusResponse.json();

          if (status.status === 'completed') {
            clearStemPoll();
            setProgress(100);
            setIsSeparating(false);
            setIsSeparated(true);
            
            const newStems = stems.map(s => ({
              ...s,
              url: status.stems?.[s.id] ? `/api/stem-stream/${data.jobId}/${s.id}` : undefined
            }));
            setStems(newStems);
            
            initStemAudios(newStems);
          } else if (status.status === 'failed') {
            clearStemPoll();
            setIsSeparating(false);
            setError(status.error || 'Separation failed');
          } else {
            setProgress(status.progress || 0);
          }
        } catch (e) {
          console.error('Error polling stem status:', e);
        }
      }, 2000);

    } catch (e) {
      setIsSeparating(false);
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const initStemAudios = (stemList: StemTrack[]) => {
    stemList.forEach(stem => {
      if (stem.url && !stemAudiosRef.current[stem.id]) {
        const audio = new Audio(stem.url);
        audio.crossOrigin = 'anonymous';
        stemAudiosRef.current[stem.id] = audio;
      }
    });
  };

  const handleVolumeChange = (stemId: string, value: number) => {
    setStems(stems.map(s => 
      s.id === stemId ? { ...s, volume: value } : s
    ));
    
    if (stemAudiosRef.current[stemId]) {
      stemAudiosRef.current[stemId].volume = (value / 100) * (masterVolume / 100);
    }
  };

  const handleMuteToggle = (stemId: string) => {
    setStems(stems.map(s => 
      s.id === stemId ? { ...s, muted: !s.muted } : s
    ));
  };

  const handleReset = () => {
    setStems(stems.map(s => ({ ...s, volume: 100, muted: false })));
    setMasterVolume(100);
    
    Object.values(stemAudiosRef.current).forEach((audio: HTMLAudioElement) => {
      audio.volume = 1;
    });
  };

  const playAllStems = () => {
    const activeStems = stems.filter(s => !s.muted && s.url);
    if (activeStems.length === 0) return;

    activeStems.forEach(stem => {
      const audio = stemAudiosRef.current[stem.id];
      if (audio) {
        audio.volume = (stem.volume / 100) * (masterVolume / 100);
        audio.play().catch(console.error);
      }
    });
    setStemPlaying(true);
  };

  const pauseAllStems = () => {
    Object.values(stemAudiosRef.current).forEach((audio: HTMLAudioElement) => {
      audio.pause();
    });
    setStemPlaying(false);
  };

  const handlePlayPause = () => {
    if (stemPlaying) {
      pauseAllStems();
    } else {
      playAllStems();
    }
  };

  const activeStemsCount = stems.filter(s => !s.muted && s.url).length;
  const hasValidStems = stems.some(s => s.url);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      <div className="p-4">
        {!currentTrack ? (
          <div className="text-center py-8">
            <p className={cn("text-xs", darkMode ? "text-stone-400" : "text-gray-500")}>
              播放音乐后可以进行分轨
            </p>
          </div>
        ) : !isSeparated ? (
          <div className="text-center py-4">
            <p className={cn("text-xs font-medium mb-2 truncate", darkMode ? "text-white" : "text-gray-900")}>
              {currentTrack.title}
            </p>
            <p className={cn("text-xs mb-3 truncate", darkMode ? "text-stone-400" : "text-gray-500")}>
              {currentTrack.artist}
            </p>
            
            {error && (
              <div className={cn(
                "flex items-center justify-center gap-1 p-2 rounded-lg mb-3 text-xs",
                darkMode ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"
              )}>
                <AlertCircle size={12} />
                <span>{error}</span>
              </div>
            )}
            
            {isSeparating ? (
              <div className="space-y-2">
                <p className={cn("text-xs", darkMode ? "text-stone-400" : "text-gray-500")}>
                  AI 处理中...
                </p>
                <div className={cn(
                  "h-1.5 rounded-full overflow-hidden",
                  darkMode ? "bg-white/10" : "bg-gray-200"
                )}>
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={startSeparation}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold text-white transition-all w-full",
                  "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
                )}
              >
                开始分轨
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={cn(
              "p-3 rounded-xl mb-3",
              darkMode ? "bg-white/5" : "bg-gray-100"
            )}>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={handlePlayPause}
                  disabled={!hasValidStems}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    stemPlaying 
                      ? "bg-emerald-500 text-white" 
                      : "bg-emerald-500 text-white",
                    !hasValidStems && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {stemPlaying ? <VolumeX size={14} /> : <Play size={14} />}
                </button>
                <div className="flex-1 mx-2">
                  <p className={cn("text-xs font-medium truncate", darkMode ? "text-white" : "text-gray-900")}>
                    {currentTrack.title}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    darkMode 
                      ? "hover:bg-white/10 text-stone-400" 
                      : "hover:bg-gray-200 text-gray-500"
                  )}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              
              <div className="flex items-center gap-1">
                <Headphones size={12} className={darkMode ? "text-stone-500" : "text-gray-400"} />
                <span className={cn("text-xs", darkMode ? "text-stone-400" : "text-gray-500")}>
                  {activeStemsCount} 轨道
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {STEM_TYPES.map((stemType) => {
                const stem = stems.find(s => s.id === stemType.id);
                if (!stem) return null;
                
                const hasUrl = !!stem.url;
                
                return (
                  <div
                    key={stem.id}
                    className={cn(
                      "p-2 rounded-xl",
                      !hasUrl 
                        ? (darkMode ? "bg-white/5 opacity-40" : "bg-gray-100 opacity-50")
                        : stem.muted 
                          ? (darkMode ? "bg-white/5 opacity-60" : "bg-gray-100 opacity-60")
                          : `bg-gradient-to-r ${stemType.color} bg-opacity-10`
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => hasUrl && handleMuteToggle(stem.id)}
                        disabled={!hasUrl}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                          !hasUrl 
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : stem.muted 
                              ? (darkMode ? "bg-white/10 text-stone-500" : "bg-gray-200 text-gray-400")
                              : `bg-gradient-to-br ${stemType.color} text-white`
                        )}
                      >
                        {hasUrl ? (stem.muted ? <VolumeX size={14} /> : stemType.icon) : <VolumeX size={14} />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-xs font-medium",
                            darkMode ? "text-white" : "text-gray-900"
                          )}>
                            {stemType.name}
                          </span>
                          <span className={cn(
                            "text-xs",
                            darkMode ? "text-stone-400" : "text-gray-500"
                          )}>
                            {!hasUrl ? '-' : stem.muted ? '静音' : `${stem.volume}%`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={stem.volume}
                          onChange={(e) => handleVolumeChange(stem.id, parseInt(e.target.value))}
                          disabled={!hasUrl || stem.muted}
                          className={cn(
                            "w-full h-1 rounded-full appearance-none cursor-pointer disabled:opacity-30",
                            darkMode ? "bg-white/20" : "bg-gray-200"
                          )}
                          style={{
                            background: !hasUrl || stem.muted 
                              ? undefined 
                              : `linear-gradient(to right, ${stemType.color.includes('pink') ? '#ec4899' : stemType.color.includes('orange') ? '#f97316' : stemType.color.includes('cyan') ? '#06b6d4' : '#8b5cf6'} ${stem.volume}%, ${darkMode ? 'rgba(255,255,255,0.2)' : '#e5e7eb'} ${stem.volume}%)`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={cn(
              "mt-4 pt-3 border-t text-center",
              darkMode ? "border-white/10" : "border-gray-200"
            )}>
              <p className={cn(
                "text-xs",
                darkMode ? "text-stone-500" : "text-gray-400"
              )}>
                AI 分轨由 Lalal.ai 支持
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
