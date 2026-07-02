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
      {/* Cool Cyberpunk buffering loader overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-900/10 dark:bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center animate-pulse z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 bg-[length:200%_100%] animate-shimmer" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-purple-400 font-bold">LOADING VISUAL...</span>
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
