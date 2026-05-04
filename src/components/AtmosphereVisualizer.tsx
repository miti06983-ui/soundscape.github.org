import React, { useMemo } from 'react';
import { motion } from 'motion/react';

export function AtmosphereVisualizer() {
  const bubbles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.random() * 300 + 100,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * -20,
      color: i % 3 === 0 ? 'rgba(29, 185, 84, 0.05)' : i % 3 === 1 ? 'rgba(168, 85, 247, 0.05)' : 'rgba(59, 130, 246, 0.05)'
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-60">
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          className="absolute rounded-full blur-[80px]"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.x}%`,
            top: `${b.y}%`,
            backgroundColor: b.color,
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            delay: b.delay,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Central Pulse */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/80" />
    </div>
  );
}
