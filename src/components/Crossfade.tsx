import React from 'react';
import { motion } from 'motion/react';
import { 
  Merge, 
  X, 
  Minus, 
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CrossfadeProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  onToggleEnabled: () => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  darkMode: boolean;
}

export function Crossfade({ 
  isOpen, 
  onClose, 
  enabled,
  onToggleEnabled,
  duration,
  onDurationChange,
  darkMode 
}: CrossfadeProps) {
  const durations = [0, 1, 2, 3, 4, 5, 6, 8, 10];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
          <div className="flex items-center justify-between mb-6">
            <span className={cn(
              "text-sm",
              darkMode ? "text-stone-300" : "text-gray-700"
            )}>
              启用
            </span>
            <button
              onClick={onToggleEnabled}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                enabled ? "bg-emerald-500" : darkMode ? "bg-white/20" : "bg-gray-300"
              )}
            >
              <motion.div
                animate={{ x: enabled ? 24 : 2 }}
                className={cn(
                  "w-5 h-5 rounded-full shadow-md",
                  enabled ? "bg-white" : darkMode ? "bg-stone-400" : "bg-gray-500"
                )}
              />
            </button>
          </div>

          <div className={cn(
            "mb-4 p-3 rounded-xl",
            darkMode ? "bg-white/5" : "bg-gray-100"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                "text-sm",
                darkMode ? "text-stone-300" : "text-gray-700"
              )}>
                淡入淡出时长
              </span>
              <span className={cn(
                "text-sm font-bold",
                enabled ? "text-emerald-400" : "text-stone-500"
              )}>
                {duration === 0 ? "关闭" : `${duration}秒`}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDurationChange(Math.max(0, duration - 1))}
                disabled={!enabled || duration === 0}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  enabled 
                    ? darkMode 
                      ? "hover:bg-white/10 text-stone-300" 
                      : "hover:bg-gray-200 text-gray-700"
                    : "opacity-30 cursor-not-allowed"
                )}
              >
                <Minus size={16} />
              </button>
              
              <div className="flex-1 flex justify-between gap-1">
                {durations.map((d) => (
                  <button
                    key={d}
                    onClick={() => onDurationChange(d)}
                    disabled={!enabled}
                    className={cn(
                      "flex-1 py-1 text-xs rounded-lg transition-colors",
                      duration === d
                        ? "bg-emerald-500 text-white"
                        : enabled
                          ? darkMode 
                            ? "bg-white/10 text-stone-300 hover:bg-white/20" 
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "opacity-30 cursor-not-allowed"
                    )}
                  >
                    {d === 0 ? '关' : d}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => onDurationChange(Math.min(10, duration + 1))}
                disabled={!enabled || duration === 10}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  enabled 
                    ? darkMode 
                      ? "hover:bg-white/10 text-stone-300" 
                      : "hover:bg-gray-200 text-gray-700"
                    : "opacity-30 cursor-not-allowed"
                )}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className={cn(
            "text-center text-xs",
            darkMode ? "text-stone-500" : "text-gray-400"
          )}>
            歌曲切换时自动淡入淡出，让播放更流畅
          </div>
        </motion.div>
  );
}
