import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Sliders, 
  X, 
  Check, 
  RotateCcw,
  Volume2
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface EqualizerPreset {
  name: string;
  gains: number[];
}

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Pop', gains: [-1, 1, 3, 4, 3, 1, -1, -2, -2, -3] },
  { name: 'Rock', gains: [4, 3, 1, -1, -2, 0, 2, 3, 4, 4] },
  { name: 'Jazz', gains: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3] },
  { name: 'Classical', gains: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
  { name: 'Bass Boost', gains: [5, 4, 3, 1, 0, 0, 0, 0, 0, 0] },
  { name: 'Treble Boost', gains: [0, 0, 0, 0, 0, 1, 2, 3, 4, 5] },
  { name: 'Electronic', gains: [4, 3, 1, 0, -2, -1, 0, 2, 4, 5] },
  { name: 'Hip Hop', gains: [5, 4, 2, 0, -1, -1, 0, 1, 2, 3] },
  { name: 'Acoustic', gains: [3, 2, 1, 1, 2, 2, 3, 3, 2, 2] },
];

const FREQUENCIES = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];

interface EqualizerProps {
  isOpen: boolean;
  onClose: () => void;
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  darkMode: boolean;
}

export function Equalizer({ 
  isOpen, 
  onClose, 
  audioContext, 
  sourceNode,
  darkMode 
}: EqualizerProps) {
  const [enabled, setEnabled] = useState(false);
  const [gains, setGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [filters, setFilters] = useState<BiquadFilterNode[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('Flat');

  useEffect(() => {
    if (!audioContext || !sourceNode || filters.length > 0) return;

    const newFilters: BiquadFilterNode[] = [];
    const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    
    let lastNode: AudioNode = sourceNode;
    
    frequencies.forEach((freq, i) => {
      const filter = audioContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = gains[i];
      
      lastNode.connect(filter);
      lastNode = filter;
      newFilters.push(filter);
    });

    lastNode.connect(audioContext.destination);
    setFilters(newFilters);

    return () => {
      newFilters.forEach(filter => {
        filter.disconnect();
      });
    };
  }, [audioContext, sourceNode]);

  useEffect(() => {
    filters.forEach((filter, i) => {
      if (filter) {
        filter.gain.value = enabled ? gains[i] : 0;
      }
    });
  }, [enabled, gains, filters]);

  const handleGainChange = useCallback((index: number, value: number) => {
    setGains(prev => {
      const newGains = [...prev];
      newGains[index] = value;
      return newGains;
    });
    setSelectedPreset('Custom');
  }, []);

  const handlePresetSelect = useCallback((preset: EqualizerPreset) => {
    setGains(preset.gains);
    setSelectedPreset(preset.name);
  }, []);

  const handleReset = useCallback(() => {
    setGains([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setSelectedPreset('Flat');
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setEnabled(!enabled)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all",
                enabled
                  ? "bg-emerald-500 text-white"
                  : darkMode 
                    ? "bg-white/10 text-stone-400" 
                    : "bg-gray-200 text-gray-500"
              )}
            >
              <Volume2 size={16} />
              {enabled ? "开启" : "关闭"}
            </button>
            
            <button
              onClick={handleReset}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors",
                darkMode 
                  ? "hover:bg-white/10 text-stone-400 hover:text-white" 
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              )}
            >
              <RotateCcw size={14} />
              重置
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className={cn(
                "text-xs font-medium",
                darkMode ? "text-stone-400" : "text-gray-500"
              )}>
                预设: <span className="text-emerald-400">{selectedPreset}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {EQUALIZER_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-lg transition-colors",
                    selectedPreset === preset.name
                      ? "bg-emerald-500 text-white"
                      : darkMode 
                        ? "bg-white/10 text-stone-300 hover:bg-white/20" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center gap-1">
            {gains.map((gain, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <span className={cn(
                  "text-[10px] mb-1",
                  darkMode ? "text-stone-500" : "text-gray-400"
                )}>
                  {gain > 0 ? `+${gain}` : gain}
                </span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={gain}
                  onChange={(e) => handleGainChange(index, parseInt(e.target.value))}
                  disabled={!enabled}
                  className={cn(
                    "h-24 w-2 appearance-none rounded-full cursor-pointer disabled:opacity-30",
                    darkMode 
                      ? "bg-white/20 [&::-webkit-slider-thumb]:bg-emerald-400" 
                      : "bg-gray-200 [&::-webkit-slider-thumb]:bg-emerald-500"
                  )}
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl'
                  }}
                />
                <span className={cn(
                  "text-[10px] mt-1",
                  darkMode ? "text-stone-500" : "text-gray-400"
                )}>
                  {FREQUENCIES[index]}
                </span>
              </div>
            ))}
          </div>

          <div className={cn(
            "mt-4 pt-4 border-t text-center",
            darkMode ? "border-white/10" : "border-gray-200"
          )}>
            <p className={cn(
              "text-xs",
              darkMode ? "text-stone-500" : "text-gray-400"
            )}>
              调节滑块改变音频频率 • 32Hz - 16kHz
            </p>
          </div>
        </motion.div>
  );
}
