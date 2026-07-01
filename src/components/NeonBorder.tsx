import React from 'react';

interface NeonBorderProps {
  rx?: number;
  ry?: number;
  lines?: 2 | 3; // Configurable number of moving neon lines
}

export default function NeonBorder({ rx = 16, ry = 16, lines = 2 }: NeonBorderProps) {
  // Use pathLength="100" to normalize the entire perimeter to 100.
  // This guarantees a perfectly seamless, mathematically precise looping animation on all containers.
  // For 2 lines: dash + gap = 50 (e.g., 10 unit dash, 40 unit gap)
  // For 3 lines: dash + gap = 33.33 (e.g., 7 unit dash, 26.33 unit gap)
  const dashArray = lines === 3 ? '7 26.33' : '10 40';
  const animationSpeedClass = 'animate-neon-border';

  return (
    <div className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden z-20">
      <svg className="absolute inset-0 w-full h-full" width="100%" height="100%">
        <defs>
          {/* Neon lights gradient mixed with the three core brand accent colors - high contrast and razor-sharp */}
          <linearGradient id="neon-glow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d946ef" /> {/* Vivid Neon Fuchsia */}
            <stop offset="50%" stopColor="#ff5a00" /> {/* Ultra-Bright Electric Orange */}
            <stop offset="100%" stopColor="#00f0ff" /> {/* Electric Cyber Cyan */}
          </linearGradient>

          {/* High-fidelity blur filter to cast light and illuminate the box edges */}
          <filter id="neon-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComponentTransfer in="blur" result="boost">
              <feFuncA type="linear" slope="2.0" /> {/* Amplify the illumination glow */}
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="boost" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Deep ambient blur filter for the inner fluid glow projection */}
          <filter id="neon-ambient-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="24" result="blur" />
            <feComponentTransfer in="blur" result="boost">
              <feFuncA type="linear" slope="1.8" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="boost" />
            </feMerge>
          </filter>
        </defs>

        {/* 0. Ambient Internal Flowing Glow (Diffused, moving inside-cast spotlights that track the border lines) */}
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx={rx}
          ry={ry}
          pathLength="100"
          className={`fill-none stroke-[url(#neon-glow-gradient)] ${animationSpeedClass} opacity-20 dark:opacity-35`}
          style={{
            strokeWidth: '25px',
            strokeDasharray: dashArray,
            filter: 'url(#neon-ambient-filter)',
          }}
        />

        {/* 2. Sharp Core Filament (The crisp plasma light beam) */}
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx={rx}
          ry={ry}
          pathLength="100"
          className={`fill-none stroke-[url(#neon-glow-gradient)] ${animationSpeedClass} opacity-100`}
          style={{
            strokeWidth: '0.1px', // Razor-thin core filament
            strokeDasharray: dashArray,
          }}
        />
      </svg>
    </div>
  );
}


