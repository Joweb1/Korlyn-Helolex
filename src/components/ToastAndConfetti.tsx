import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
  };

  const bgClasses = {
    success: 'bg-zinc-950/95 border-emerald-500/30 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.15)]',
    info: 'bg-zinc-950/95 border-blue-500/30 text-blue-200 shadow-[0_0_25px_rgba(59,130,246,0.15)]',
    error: 'bg-zinc-950/95 border-red-500/30 text-red-200 shadow-[0_0_25px_rgba(239,68,68,0.15)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`fixed top-6 right-6 z-[9999] max-w-sm flex items-center gap-3.5 px-5 py-4 border rounded-2xl backdrop-blur-md font-mono text-xs ${bgClasses[type]}`}
    >
      {icons[type]}
      <div className="flex-grow leading-relaxed font-semibold">
        {message}
      </div>
      <button 
        onClick={onClose}
        className="text-zinc-500 hover:text-zinc-200 transition-colors pl-2 cursor-pointer font-bold text-sm"
      >
        ×
      </button>
    </motion.div>
  );
}

interface ConfettiProps {
  active: boolean;
}

export function Confetti({ active }: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    delay: number;
    duration: number;
    shape: 'square' | 'circle' | 'triangle';
  }>>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const colors = [
      '#a855f7', // purple
      '#f59e0b', // amber
      '#3b82f6', // blue
      '#10b981', // emerald
      '#ec4899', // pink
      '#f43f5e', // rose
      '#eab308'  // yellow
    ];

    const shapes: Array<'square' | 'circle' | 'triangle'> = ['square', 'circle', 'triangle'];

    const newPieces = Array.from({ length: 140 }).map((_, i) => {
      return {
        id: i,
        x: Math.random() * 100, // percentage of screen width
        y: -10 - Math.random() * 25, // start above screen
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 360 - 180,
        delay: Math.random() * 1.5,
        duration: Math.random() * 2.5 + 2.5,
        shape: shapes[Math.floor(Math.random() * shapes.length)]
      };
    });

    setPieces(newPieces);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      {pieces.map((p) => {
        const shapeStyle: React.CSSProperties = {
          backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
          width: `${p.size}px`,
          height: `${p.size}px`,
          borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'triangle' ? '0' : '2px',
          ...(p.shape === 'triangle' && {
            width: '0',
            height: '0',
            borderLeft: `${p.size / 2}px solid transparent`,
            borderRight: `${p.size / 2}px solid transparent`,
            borderBottom: `${p.size}px solid ${p.color}`,
          })
        };

        return (
          <motion.div
            key={p.id}
            initial={{ 
              x: `${p.x}vw`, 
              y: `${p.y}vh`, 
              rotate: p.rotation,
              opacity: 1
            }}
            animate={{ 
              y: '110vh',
              x: `${p.x + (Math.random() * 20 - 10)}vw`,
              rotate: p.rotation + p.rotationSpeed * p.duration,
              opacity: 0.3
            }}
            transition={{ 
              duration: p.duration, 
              delay: p.delay, 
              ease: 'linear',
              repeat: 0
            }}
            style={shapeStyle}
            className="absolute"
          />
        );
      })}
    </div>
  );
}
