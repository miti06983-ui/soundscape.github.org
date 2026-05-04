import { LucideIcon } from 'lucide-react';
import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SidebarItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  key?: React.Key;
  darkMode?: boolean;
}

export const SidebarItem = React.memo(({ icon: Icon, label, active, onClick, darkMode = true }: SidebarItemProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all duration-200 relative rounded-lg w-full",
        active
          ? darkMode 
            ? "bg-teal-400/12 text-white ring-1 ring-teal-300/20"
            : "bg-teal-100 text-teal-900 ring-1 ring-teal-200"
          : darkMode
            ? "text-stone-400 hover:text-white hover:bg-white/[0.06]"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      )}
    >
      {active && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.55)]"
        />
      )}
      <Icon
        size={20}
        className={cn(
          "transition-colors flex-shrink-0",
          active ? "text-teal-300" : (darkMode ? "group-hover:text-amber-200" : "group-hover:text-amber-600")
        )}
      />
      <span className="truncate">{label}</span>
    </motion.button>
  );
});

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  darkMode?: boolean;
}

export const SidebarSection = React.memo(({ title, children, darkMode = true }: SidebarSectionProps) => {
  return (
    <div className="flex flex-col gap-0.5 mt-6 px-2">
      <p className={`px-3 mb-1.5 text-[10px] font-black uppercase tracking-[0.15em] ${
        darkMode ? 'text-stone-500' : 'text-gray-500'
      }`}>{title}</p>
      {children}
    </div>
  );
});
