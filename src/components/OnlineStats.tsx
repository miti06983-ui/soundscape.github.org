import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Music, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Presence {
  uid: string;
  displayName: string;
  photoURL: string;
  status: 'online' | 'away';
  lastActive: Timestamp;
  currentTrack?: string;
}

export function OnlineStats() {
  const [allPresence, setAllPresence] = useState<Presence[]>([]);
  const [displayPresence, setDisplayPresence] = useState<Presence[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'presence'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(doc => doc.data() as Presence)
        .filter(p => {
          const now = Date.now();
          const last = p.lastActive?.toMillis() || 0;
          return now - last < 120000; // 2 minutes
        });
      setAllPresence(list);
    });
    return () => unsubscribe();
  }, []);

  const refreshDisplay = () => {
    setIsRefreshing(true);
    // Shuffle and pick 5
    const shuffled = [...allPresence].sort(() => 0.5 - Math.random());
    setDisplayPresence(shuffled.slice(0, 5));
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    if (allPresence.length > 0 && displayPresence.length === 0) {
      refreshDisplay();
    } else if (allPresence.length === 0) {
        setDisplayPresence([]);
    }
  }, [allPresence]);

  if (allPresence.length === 0) return null;

  return (
    <div className="mb-8 bg-zinc-900/20 rounded-2xl border border-zinc-800/50 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-[#1DB954]/20 p-1.5 rounded-lg text-[#1DB954]">
            <Users size={16} />
          </div>
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Listening Now</h3>
          <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full border border-zinc-700">
            {allPresence.length} online
          </span>
        </div>
        <button 
          onClick={refreshDisplay}
          disabled={isRefreshing}
          className="text-zinc-500 hover:text-white transition-colors p-1.5 hover:bg-zinc-800 rounded-full"
        >
          <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <AnimatePresence mode="popLayout">
          {displayPresence.map((p) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={p.uid}
              className="flex items-center gap-3 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/40 hover:bg-zinc-800/60 transition-all group overflow-hidden"
            >
              <div className="relative flex-shrink-0">
                {p.photoURL ? (
                  <img src={p.photoURL} className="w-8 h-8 rounded-full border border-zinc-700" alt="" />
                ) : (
                  <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                    <Users size={14} className="text-zinc-500" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-900 rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-zinc-300 truncate capitalize group-hover:text-white">{p.displayName}</span>
                {p.currentTrack ? (
                  <div className="flex items-center gap-1 text-[9px] text-[#1DB954] font-medium truncate">
                    <Music size={8} className="animate-pulse" />
                    <span className="truncate">{p.currentTrack}</span>
                  </div>
                ) : (
                  <span className="text-[9px] text-zinc-500">Just chilling</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
