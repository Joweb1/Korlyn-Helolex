import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface NetworkStatusToastProps {
  status: 'online' | 'offline' | 'unstable';
}

export function NetworkStatusToast({ status }: NetworkStatusToastProps) {
  const [visible, setVisible] = useState(false);
  const [lastStatus, setLastStatus] = useState<'online' | 'offline' | 'unstable'>(status);

  useEffect(() => {
    // Show toast on status change
    setVisible(true);

    if (status === 'online') {
      // If we are online, automatically hide after 4 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible) return null;

  const config = {
    online: {
      bg: 'bg-zinc-950/95 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
      title: 'ONLINE'
    },
    offline: {
      bg: 'bg-zinc-950/95 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]',
      icon: <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />,
      title: 'OFFLINE'
    },
    unstable: {
      bg: 'bg-zinc-950/95 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />,
      title: 'UNSTABLE'
    }
  };

  const activeConfig = config[status];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -30, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className={`fixed top-6 left-6 z-[9999] flex items-center gap-2.5 px-3 py-2 border rounded-xl backdrop-blur-md font-mono text-[10px] font-bold tracking-wider ${activeConfig.bg}`}
      >
        <div className="flex items-center gap-1.5">
          {activeConfig.icon}
          <span>{activeConfig.title}</span>
        </div>
        <button 
          onClick={() => setVisible(false)}
          className="text-zinc-500 hover:text-zinc-200 transition-colors pl-1 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-3 h-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

