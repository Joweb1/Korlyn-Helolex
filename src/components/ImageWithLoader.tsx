import React, { useState } from 'react';

interface ImageWithLoaderProps {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  referrerPolicy?: string;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  [key: string]: any;
}

export default function ImageWithLoader({
  src,
  alt,
  className = '',
  containerClassName = '',
  onLoad,
  ...props
}: ImageWithLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Premium skeletal moving gradient background buffering loader */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 bg-[length:200%_100%] animate-shimmer flex items-center justify-center">
          <div className="absolute inset-0 opacity-40 bg-gradient-to-tr from-purple-500/10 to-blue-500/10" />
          {/* Minimal chic glowing indicator */}
          <div className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/45 dark:bg-black/45 backdrop-blur-md border border-white/20 dark:border-zinc-800/40 shadow-lg shadow-black/5 animate-pulse">
            <div className="w-4 h-4 rounded-full border-2 border-purple-500/40 border-t-purple-500 animate-spin" />
            <span className="text-[7px] font-mono tracking-[0.2em] text-purple-600 dark:text-purple-400 font-bold uppercase">BUFFERING IMAGE</span>
          </div>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        className={`${className} transition-opacity duration-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
}
