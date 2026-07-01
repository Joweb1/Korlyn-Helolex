import React, { useState, useEffect } from 'react';
import NeonBorder from './NeonBorder';
import korlynCubeImg from '../assets/images/korlyn_cube_illustration_1782756172238.jpg';
import { 
  ArrowRight, 
  Gamepad2, 
  ShoppingBag, 
  Globe, 
  BookOpen, 
  Cpu, 
  Users, 
  Globe2, 
  Coins, 
  BarChart3, 
  Zap, 
  Activity, 
  Layers, 
  ShieldCheck, 
  LayoutDashboard,
  Code
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface KorlynPageProps {
  onExploreHelolex: () => void;
  onOpenAdmin: () => void;
  pendingCount: number;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  isAdminUnlocked: boolean;
  onHoldTrigger: () => void;
}

export default function KorlynPage({ 
  onExploreHelolex, 
  onOpenAdmin,
  pendingCount,
  theme,
  setTheme,
  isAdminUnlocked,
  onHoldTrigger
}: KorlynPageProps) {
  const [activeSection, setActiveSection] = useState<'hero' | 'products' | 'statistics' | 'features'>('hero');
  
  // Click-and-hold 4s secret unlock state
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHolding) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          const next = prev + 2.5;
          if (next >= 100) {
            return 100;
          }
          return next;
        });
      }, 100);
    } else {
      setHoldProgress(0);
    }
    return () => clearInterval(interval);
  }, [isHolding]);

  useEffect(() => {
    if (holdProgress >= 100) {
      setIsHolding(false);
      setHoldProgress(0);
      onHoldTrigger();
    }
  }, [holdProgress, onHoldTrigger]);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    setIsHolding(true);
  };

  const endHold = () => {
    setIsHolding(false);
  };


  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 2.5;
      
      const heroEl = document.getElementById('hero');
      const productsEl = document.getElementById('products');
      const statsEl = document.getElementById('statistics');
      const featuresEl = document.getElementById('features');
      
      if (featuresEl && scrollPos >= featuresEl.offsetTop) {
        setActiveSection('features');
      } else if (statsEl && scrollPos >= statsEl.offsetTop) {
        setActiveSection('statistics');
      } else if (productsEl && scrollPos >= productsEl.offsetTop) {
        setActiveSection('products');
      } else {
        setActiveSection('hero');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const products = [
    {
      id: 'helolex',
      name: 'HELOLEX',
      description: 'Launch your own gaming business. Own your audience. Earn through engagement.',
      icon: Gamepad2,
      badge: 'FLAGSHIP PRODUCT',
      color: 'from-purple-600 via-orange-500 to-blue-600',
      shadowColor: 'rgba(249, 115, 22, 0.15)',
      actionText: 'Explore HELOLEX →',
      isHelolex: true,
    },
    {
      id: 'commerce',
      name: 'Commerce',
      description: 'Launch lightning-fast online stores. True decentralized catalog hosting, secure checkouts, and custom ownership ledgers.',
      icon: ShoppingBag,
      color: 'from-orange-500 to-yellow-500',
      shadowColor: 'rgba(249, 115, 22, 0.1)',
      actionText: 'Join Waitlist',
    },
    {
      id: 'business',
      name: 'Business Websites',
      description: 'Professional high-converting custom websites with automated localization, secure zero-maintenance hosting, and integrated pipelines.',
      icon: Globe,
      color: 'from-blue-600 to-cyan-500',
      shadowColor: 'rgba(59, 130, 246, 0.1)',
      actionText: 'Join Waitlist',
    },
    {
      id: 'blogs',
      name: 'Blogs',
      description: 'Own your publishing platform. Zero platform fees, immutable writer-to-audience subscriptions, and customized themes.',
      icon: BookOpen,
      color: 'from-purple-600 to-pink-500',
      shadowColor: 'rgba(217, 70, 239, 0.1)',
      actionText: 'Join Waitlist',
    },
    {
      id: 'ai_products',
      name: 'AI Products',
      description: 'Direct AI logic wrappers with built-in API monetization. Plug-and-play inference endpoints without server configuration.',
      icon: Cpu,
      color: 'from-fuchsia-600 to-orange-500',
      shadowColor: 'rgba(249, 115, 22, 0.1)',
      badge: 'COMING SOON',
      actionText: 'Join Waitlist',
    }
  ];

  const features = [
    {
      title: 'Digital Ownership',
      desc: 'True digital asset title registries powered by the KORLYN premium layer.',
      icon: ShieldCheck,
    },
    {
      title: 'Built-in Monetization',
      desc: 'Seamless payments, multi-channel subscriptions, and automated creator disbursements out-of-the-box.',
      icon: Coins,
    },
    {
      title: 'No Technical Skills',
      desc: 'Direct visual orchestration canvas. Launch deep production codebases without touching a terminal.',
      icon: Code,
    },
    {
      title: 'Creator Analytics',
      desc: 'High-fidelity visitor tracking, revenue models, retention metrics, and real-time funnels.',
      icon: BarChart3,
    },
    {
      title: 'Creator Dashboard',
      desc: 'Your central control tower. Monitor growth, configure access rules, and orchestrate payouts in real-time.',
      icon: LayoutDashboard,
    },
    {
      title: 'Global Scale',
      desc: 'Automatically distributed over our global low-latency CDN network. Ready for peak traffic cycles.',
      icon: Globe2,
    },
    {
      title: 'Fast Infrastructure',
      desc: 'Zero cold start times, minimal bundle sizes, and extreme rendering performance on every screen.',
      icon: Zap,
    },
    {
      title: 'Future Ready',
      desc: 'Forward-compatible with emerging modular networks, advanced LLM models, and virtual environments.',
      icon: Layers,
    }
  ];

  const stats = [
    { value: '1M+', label: 'Future Creators', sub: 'Targeted globally' },
    { value: '10M+', label: 'Digital Products', sub: 'Projected listings' },
    { value: '150+', label: 'Countries', sub: 'Unrestricted coverage' },
    { value: '$50M+', label: 'Creator Economy', sub: 'Potential earnings' }
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="dark:bg-[#05070B] bg-[#FAFAFC] dark:text-[#D1D5DB] text-zinc-700 min-h-screen relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.08)_0%,_transparent_60%)] dark:opacity-100 opacity-40 pointer-events-none" />
      <div className="absolute top-[40%] right-[-25%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.07)_0%,_transparent_60%)] dark:opacity-100 opacity-40 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,_rgba(217,70,239,0.05)_0%,_transparent_60%)] dark:opacity-100 opacity-40 pointer-events-none" />

      {/* Dynamic Fixed Vector Background Overlay */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Section 1: Hero Vector Background (Tech circuit & Constellation Nodes) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSection === 'hero' ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dot-grid-fixed-hero" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" className="fill-zinc-300/60 dark:fill-zinc-800/60" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-grid-fixed-hero)" />
            
            {/* Glowing circuit matrix traces */}
            <g className="stroke-purple-600/25 dark:stroke-purple-400/20" strokeWidth="1.5" fill="none">
              <path d="M-100,200 H300 L380,280 H700 L760,340 H1200" />
              <path d="M100,-100 V150 L180,230 V450" />
              <path d="M900,-50 V180 L820,260 V600" />
            </g>
            <g className="stroke-orange-500/20 dark:stroke-orange-400/15" strokeWidth="1" fill="none" strokeDasharray="4,4">
              <path d="M-50,380 H400 L450,330 H800 L850,380 H1400" />
              <path d="M500,-100 V250 L450,300 V700" />
            </g>
            
            {/* Elegant wavy topographic ribbons */}
            <path d="M-200,400 C200,550 500,250 850,500 C1100,650 1400,350 1700,550" className="stroke-purple-600/10 dark:stroke-purple-500/15" strokeWidth="4" fill="none" />
            <path d="M-200,450 C150,600 450,300 800,550 C1050,700 1350,400 1700,600" className="stroke-orange-500/10 dark:stroke-orange-500/15" strokeWidth="2.5" fill="none" />
            
            {/* High-fidelity glowing nodes */}
            <g className="fill-purple-600/45 dark:fill-purple-400/50">
              <circle cx="300" cy="200" r="5" />
              <circle cx="380" cy="280" r="7.5" className="animate-pulse" />
              <circle cx="700" cy="280" r="5" />
              <circle cx="760" cy="340" r="8" />
              <circle cx="180" cy="230" r="5.5" />
            </g>
            <g className="fill-orange-600/40 dark:fill-orange-400/50">
              <circle cx="450" cy="330" r="6" />
              <circle cx="850" cy="380" r="7.5" className="animate-pulse" />
            </g>
          </svg>
        </div>

        {/* Section 2: Products Vector Background (Flowing curved bezier ribbons) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSection === 'products' ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="product-waves-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1" className="fill-zinc-300/40 dark:fill-zinc-800/40" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#product-waves-grid)" />

            {/* Seamless, intricate wave mesh ribbons */}
            <g className="stroke-purple-600/15 dark:stroke-purple-500/20" strokeWidth="1" fill="none">
              <path d="M-100,150 C200,300 400,50 700,250 C1000,450 1200,200 1500,350" />
              <path d="M-100,170 C200,320 400,70 700,270 C1000,470 1200,220 1500,370" />
              <path d="M-100,190 C200,340 400,90 700,290 C1000,490 1200,240 1500,390" />
              <path d="M-100,210 C200,360 400,110 700,310 C1000,510 1200,260 1500,410" />
            </g>
            <g className="stroke-blue-600/15 dark:stroke-blue-500/20" strokeWidth="1" fill="none">
              <path d="M-100,300 C250,100 550,400 850,200 C1150,0 1350,300 1600,100" />
              <path d="M-100,320 C250,120 550,420 850,220 C1150,20 1350,320 1600,120" />
            </g>
            <g className="stroke-orange-500/10 dark:stroke-orange-500/15" strokeWidth="1.5" fill="none" strokeDasharray="3,6">
              <path d="M-100,400 C300,500 600,200 900,450 C1200,700 1400,300 1700,500" />
            </g>

            {/* Orbit rings & abstract intersections */}
            <circle cx="700" cy="270" r="60" className="stroke-purple-500/15 dark:stroke-purple-400/10" strokeWidth="1" fill="none" />
            <circle cx="700" cy="270" r="100" className="stroke-purple-500/10 dark:stroke-purple-400/5" strokeWidth="1" strokeDasharray="5,5" fill="none" />
            <circle cx="850" cy="220" r="80" className="stroke-blue-500/15 dark:stroke-blue-400/10" strokeWidth="1.2" fill="none" />
            
            {/* Glowing vertices */}
            <circle cx="700" cy="270" r="5" className="fill-purple-600 dark:fill-purple-400 animate-pulse" />
            <circle cx="850" cy="220" r="4.5" className="fill-blue-600 dark:fill-blue-400" />
          </svg>
        </div>

        {/* Section 3: Statistics Vector Background (Isometric Matrix & Telemetry) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSection === 'statistics' ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="stats-hex-grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M25,0 L50,14.4 L50,43.3 L25,57.7 L0,43.3 L0,14.4 Z" className="stroke-zinc-200/50 dark:stroke-zinc-900/40" strokeWidth="1" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stats-hex-grid)" />

            {/* Telemetry charts and lines */}
            <g className="stroke-purple-600/20 dark:stroke-purple-500/20" strokeWidth="1.5" fill="none">
              {/* Telemetry coordinate boxes */}
              <rect x="150" y="100" width="180" height="100" rx="6" className="dark:stroke-purple-500/15 stroke-purple-600/20" />
              <line x1="150" y1="150" x2="330" y2="150" className="stroke-purple-600/10 dark:stroke-purple-500/10" strokeWidth="1" />
              <rect x="850" y="250" width="220" height="140" rx="8" className="dark:stroke-purple-500/15 stroke-purple-600/20" />
              {/* Tech circle nodes */}
              <circle cx="960" cy="320" r="45" />
              <circle cx="960" cy="320" r="30" strokeDasharray="3,3" />
            </g>

            {/* Glowing telemetry wireframe nodes */}
            <g className="fill-purple-600/30 dark:fill-purple-400/40">
              <circle cx="150" cy="100" r="4" />
              <circle cx="330" cy="200" r="4" />
              <circle cx="850" cy="250" r="4" />
              <circle cx="1070" cy="390" r="4.5" className="animate-pulse" />
            </g>

            {/* High speed binary/signal lines */}
            <path d="M50,120 L300,120 L350,170 H600 L650,120 H900" className="stroke-orange-500/15 dark:stroke-orange-400/15" strokeWidth="1" fill="none" strokeDasharray="4,2" />
            <circle cx="350" cy="170" r="5" className="fill-orange-500/50 animate-ping" />
          </svg>
        </div>

        {/* Section 4: Features Vector Background (Futuristic Isometric Cubes & Mesh Nodes) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSection === 'features' ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="features-mesh" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
                <circle cx="18" cy="18" r="1.5" className="fill-zinc-300/50 dark:fill-zinc-800/60" />
                <path d="M18,0 V36 M0,18 H36" className="stroke-zinc-100 dark:stroke-zinc-900/40" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#features-mesh)" />

            {/* Isometric wireframe cube vectors */}
            <g className="stroke-purple-600/25 dark:stroke-purple-400/20" strokeWidth="1" fill="none">
              {/* Cube 1 (Left) */}
              <g transform="translate(150, 200)">
                <path d="M0,0 L30,-15 L60,0 L30,15 Z" />
                <path d="M0,0 V40 L30,55 V15 Z" />
                <path d="M60,0 V40 L30,55" />
              </g>
              {/* Cube 2 (Right) */}
              <g transform="translate(950, 150)">
                <path d="M0,0 L40,-20 L80,0 L40,20 Z" />
                <path d="M0,0 V50 L40,70 V20 Z" />
                <path d="M80,0 V50 L40,70" />
                <line x1="40" y1="0" x2="40" y2="50" strokeDasharray="2,2" />
              </g>
              {/* Cube 3 (Center Bottom) */}
              <g transform="translate(550, 380)">
                <path d="M0,0 L35,-17 L70,0 L35,17 Z" />
                <path d="M0,0 V45 L35,62 V17 Z" />
                <path d="M70,0 V45 L35,62" />
              </g>
            </g>

            {/* Network interconnections flowing between the cubes */}
            <g className="stroke-orange-500/20 dark:stroke-orange-400/15" strokeWidth="1.2" fill="none">
              <path d="M210,225 C400,200 500,400 585,397" />
              <path d="M585,397 C700,390 850,250 990,175" strokeDasharray="4,4" />
            </g>

            {/* Glowing endpoint connections */}
            <circle cx="210" cy="225" r="4.5" className="fill-purple-600 dark:fill-purple-500" />
            <circle cx="585" cy="397" r="5" className="fill-orange-500 animate-pulse" />
            <circle cx="990" cy="175" r="4.5" className="fill-purple-600 dark:fill-purple-500" />
          </svg>
        </div>
      </div>

      {/* Grid Pattern fallback */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.02)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(120,120,120,0.02)_1px,_transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.005)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.005)_1px,_transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Persistent Elegant Header */}
      <nav className="sticky top-0 z-40 dark:bg-[#05070B]/80 bg-white/80 backdrop-blur-md border-b dark:border-zinc-900/80 border-zinc-200 px-4 md:px-8 py-4 transition-all">
        {isHolding && (
          <div 
            className="fixed top-0 left-0 h-[4px] bg-gradient-to-r from-purple-500 via-orange-500 to-blue-500 z-50 transition-all duration-75" 
            style={{ width: `${holdProgress}%` }} 
          />
        )}
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 group cursor-pointer select-none" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            onTouchCancel={endHold}
            title="Click and hold for 4 seconds to trigger Admin verification"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-orange-500 to-blue-500 p-[1.5px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full dark:bg-[#05070B] bg-white rounded-md flex items-center justify-center font-black dark:text-white text-zinc-900 text-sm tracking-tighter">
                K
              </div>
            </div>
            <span className="text-xl font-black dark:text-white text-zinc-900 tracking-[0.15em] font-sans group-hover:text-purple-400 transition-colors">
              KORLYN
            </span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={onExploreHelolex} 
              className="text-xs font-mono tracking-widest text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-bold flex items-center gap-1.5 transition-all"
            >
              HELOLEX GAMING
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
            </button>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onChange={setTheme} />

            {/* Quick Admin Toggle */}
            {isAdminUnlocked && (
              <button
                onClick={onOpenAdmin}
                id="admin-panel-btn-korlyn"
                className="flex items-center gap-1.5 px-3 py-1.5 dark:bg-zinc-900 bg-white hover:dark:bg-zinc-800 hover:bg-zinc-100 dark:text-zinc-300 text-zinc-700 dark:hover:text-white hover:text-zinc-950 rounded-lg text-xs font-mono tracking-wider transition-all border dark:border-zinc-800 border-zinc-200 relative"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>ADMIN</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white text-[9px] font-mono w-4 h-4 rounded-full flex items-center justify-center font-bold border border-zinc-950 animate-bounce">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={onExploreHelolex}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold tracking-wider uppercase rounded-lg transition-all shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-95"
            >
              LAUNCH APP
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-12 pb-20 md:py-24 max-w-7xl mx-auto px-4 md:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 flex flex-col text-left space-y-6">
            {/* Tagline Badge */}
            <div className="inline-flex self-start items-center gap-2 px-3 py-1 dark:bg-purple-950/30 bg-purple-100/60 border dark:border-purple-500/20 border-purple-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase dark:text-purple-300 text-purple-700 font-bold">
                Digital Ownership Starts Here
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7.5xl font-sans font-black dark:text-white text-zinc-950 leading-[1.05] tracking-tight">
              We Build it.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-orange-500 to-blue-500 drop-shadow-[0_2px_20px_rgba(249,115,22,0.15)]">You Own It.</span><br />
              You Earn From it.
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base dark:text-zinc-400 text-zinc-600 leading-relaxed max-w-xl font-mono">
              <span className="text-purple-600 dark:text-purple-400 font-bold">KORLYN</span> is building the future of digital ownership.
              <br /><br />
              Whether it's games, online stores, business websites, blogs or AI-powered products, KORLYN gives creators the infrastructure to launch, own and grow digital businesses without the complexity.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => scrollToSection('products')}
                id="btn-explore-products"
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold tracking-widest uppercase rounded-lg transition-all shadow-xl shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-95 group cursor-pointer"
              >
                Explore Products
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                id="btn-how-it-works"
                className="flex items-center gap-2 px-6 py-3.5 dark:bg-zinc-900/60 bg-zinc-100 hover:dark:bg-zinc-850 hover:bg-zinc-200 dark:text-zinc-300 text-zinc-700 hover:dark:text-white hover:text-zinc-950 text-xs font-bold tracking-widest uppercase rounded-lg transition-all border dark:border-zinc-800 border-zinc-200 active:scale-95 cursor-pointer"
              >
                How It Works
              </button>
            </div>
          </div>

          {/* Hero Right: Floating Interactive Cube Illustration */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-full max-w-[420px] aspect-square rounded-2xl p-4 flex items-center justify-center bg-radial from-purple-950/15 via-transparent to-transparent">
              {/* Outer light aura */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-orange-500/5 to-transparent blur-3xl rounded-full animate-pulse" />

              {/* Holographic orbit rings */}
              <div className="absolute inset-2 border border-purple-500/10 dark:opacity-100 opacity-40 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-10 border border-dashed border-blue-500/15 dark:opacity-100 opacity-40 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

              {/* Floating Container */}
              <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border dark:border-zinc-800/80 border-zinc-200 dark:bg-zinc-950/40 bg-white/70 backdrop-blur-md p-1.5 shadow-[0_0_50px_rgba(139,92,246,0.15)] dark:shadow-[0_0_50px_rgba(139,92,246,0.15)] group hover:border-purple-500/30 transition-all duration-700">
                <NeonBorder />
                {/* Embedded generated cube image */}
                <img 
                  src={korlynCubeImg} 
                  alt="KORLYN Monolithic Product Cube"
                  className="w-full h-full object-cover rounded-xl opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />

                {/* Overlaid Holographic label HUD */}
                <div className="absolute bottom-4 left-4 right-4 dark:bg-zinc-950/80 bg-white/95 backdrop-blur-md border dark:border-zinc-800/80 border-zinc-200 rounded-xl p-3 flex justify-between items-center font-mono text-[10px]">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">Monolith Engine</span>
                    <span className="dark:text-white text-zinc-900 font-bold block mt-0.5 tracking-widest">KORLYN_CUBE_V1.0</span>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-600 dark:text-purple-400 block font-bold uppercase tracking-widest animate-pulse">● CORE_ONLINE</span>
                    <span className="text-zinc-500 dark:text-zinc-400 block mt-0.5">5 ACTIVE CORES</span>
                  </div>
                </div>

                {/* Floating holographic product mini-nodes */}
                <div className="absolute top-6 left-6 px-2.5 py-1 dark:bg-[#05070B]/90 bg-white border border-purple-500/30 rounded-md font-mono text-[9px] tracking-wider text-purple-600 dark:text-purple-300 shadow-md">
                  GAMING
                </div>
                <div className="absolute top-12 right-6 px-2.5 py-1 dark:bg-[#05070B]/90 bg-white border border-blue-500/30 rounded-md font-mono text-[9px] tracking-wider text-blue-600 dark:text-blue-300 shadow-md">
                  COMMERCE
                </div>
                <div className="absolute bottom-20 right-6 px-2.5 py-1 dark:bg-[#05070B]/90 bg-white border border-orange-500/30 rounded-md font-mono text-[9px] tracking-wider text-orange-600 dark:text-orange-300 shadow-md">
                  AI PRODUCTS
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Feature Highlight Divider */}
      <section id="products" className="border-t dark:border-zinc-900/40 border-zinc-200/50 dark:bg-[#05070B]/10 bg-zinc-100/10 backdrop-blur-[2px] py-20 px-4 md:px-8 transition-colors">
        <div className="max-w-7xl mx-auto text-center mb-16 space-y-4">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
            THE DIGITAL OWNERSHIP PLATFORM
          </span>
          <h2 className="text-3xl sm:text-5xl font-sans font-black dark:text-white text-zinc-950 tracking-tight leading-tight">
            One Platform.<br />
            Unlimited Digital Ownership.
          </h2>
          <p className="text-sm dark:text-zinc-500 text-zinc-500 font-mono max-w-xl mx-auto">
            Break free from digital gatekeepers. KORLYN places core monetization assets directly under your complete command.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, index) => {
            const Icon = p.icon;
            return (
              <div 
                key={p.id}
                onClick={p.isHelolex ? onExploreHelolex : undefined}
                className={`dark:bg-[#0B1020]/35 bg-white/70 backdrop-blur-md border dark:border-zinc-800/80 border-zinc-200 dark:hover:border-zinc-700/80 hover:border-zinc-300 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group flex flex-col justify-between cursor-pointer shadow-sm dark:shadow-none ${
                  p.isHelolex 
                    ? 'md:col-span-2 lg:col-span-1 dark:shadow-[0_0_30px_rgba(139,92,246,0.05)] shadow-md dark:border-purple-900/30 border-purple-200 hover:border-purple-500/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.12)]' 
                    : ''
                }`}
              >
                <NeonBorder lines={p.isHelolex ? 3 : 2} />
                {/* Glow Element */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 10% 10%, ${p.shadowColor || 'rgba(139, 92, 246, 0.05)'} 0%, transparent 50%)`
                  }}
                />

                <div className="space-y-6">
                  {/* Badge & Icon */}
                  <div className="flex justify-between items-start">
                    <div className="p-3 dark:bg-zinc-950/80 bg-zinc-100 rounded-xl border dark:border-zinc-800 border-zinc-200 group-hover:border-purple-500/20 group-hover:scale-105 transition-all">
                      <Icon className={`w-5 h-5 ${p.isHelolex ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    </div>
                    {p.badge && (
                      <span className={`text-[8px] font-mono tracking-widest font-bold px-2 py-0.5 rounded ${
                        p.isHelolex 
                          ? 'dark:bg-purple-950/40 bg-purple-50 dark:text-purple-300 text-purple-700 border dark:border-purple-500/20 border-purple-200' 
                          : 'dark:bg-zinc-900 bg-zinc-100 dark:text-zinc-500 text-zinc-600 border dark:border-zinc-800 border-zinc-200'
                      }`}>
                        {p.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-lg font-bold dark:text-white text-zinc-950 tracking-wide group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs dark:text-zinc-400 text-zinc-600 leading-relaxed mt-2 font-mono">
                      {p.description}
                    </p>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="pt-6 mt-6 border-t dark:border-zinc-900 border-zinc-200 flex justify-between items-center">
                  <span className={`text-xs font-bold tracking-widest uppercase font-mono flex items-center gap-1.5 ${
                    p.isHelolex ? 'text-purple-600 dark:text-purple-400 group-hover:text-purple-500 dark:group-hover:text-purple-300' : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {p.actionText}
                  </span>
                  <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                    p.isHelolex ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Metrics / Statistics Section */}
      <section id="statistics" className="border-t dark:border-zinc-900/40 border-zinc-200/50 py-20 dark:bg-[#05070B]/10 bg-zinc-100/10 backdrop-blur-[2px] px-4 md:px-8 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, idx) => (
              <div 
                key={idx}
                className="dark:bg-zinc-950/40 bg-white/70 backdrop-blur-md border dark:border-zinc-900/60 border-zinc-200 rounded-2xl p-6 text-center hover:dark:border-zinc-800 hover:border-zinc-300 transition-all shadow-sm relative overflow-hidden"
              >
                <NeonBorder />
                <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br dark:from-white dark:via-zinc-200 dark:to-zinc-500 from-zinc-950 via-zinc-800 to-zinc-500 tracking-tighter">
                  {s.value}
                </div>
                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-2 tracking-widest uppercase font-mono">
                  {s.label}
                </div>
                <div className="text-[10px] dark:text-zinc-600 text-zinc-500 mt-1 font-mono">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Features Section */}
      <section id="features" className="border-t dark:border-zinc-900/40 border-zinc-200/50 py-20 dark:bg-[#05070B]/10 bg-zinc-100/10 backdrop-blur-[2px] px-4 md:px-8 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-left mb-16 space-y-4 max-w-2xl">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
              WORLD-CLASS PERFORMANCE
            </span>
            <h2 className="text-3xl sm:text-5xl font-sans font-black dark:text-white text-zinc-950 tracking-tight">
              Engineered for Ownership.
            </h2>
            <p className="text-sm dark:text-zinc-500 text-zinc-500 font-mono">
              Designed from first principles to give you full control of your infrastructure, monetization capabilities, and distribution channels.
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div 
                  key={idx}
                  className="dark:bg-[#0B1020]/20 bg-white/70 backdrop-blur-md border dark:border-zinc-800/40 border-zinc-200 rounded-xl p-5 transition-all hover:translate-y-[-2px] hover:border-zinc-300 dark:hover:border-zinc-800 shadow-sm relative overflow-hidden"
                >
                  <NeonBorder rx={12} ry={12} />
                  <div className="p-2.5 dark:bg-zinc-900/80 bg-zinc-100 rounded-lg border dark:border-zinc-800/80 border-zinc-200 inline-block text-purple-600 dark:text-purple-400 mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold dark:text-white text-zinc-900 tracking-wide uppercase">
                    {f.title}
                  </h3>
                  <p className="text-xs dark:text-zinc-500 text-zinc-600 mt-2 leading-relaxed font-mono">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="border-t dark:border-zinc-900/80 border-zinc-200 dark:bg-gradient-to-b dark:from-[#05070B] dark:to-[#0A0D14] bg-gradient-to-b from-[#FAFAFC] to-white py-24 px-4 md:px-8 text-center relative overflow-hidden transition-colors">
        {/* Glow behind final CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.1)_0%,_transparent_60%)] pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
            ESTABLISH YOUR FRONTIER
          </span>
          <h2 className="text-3xl sm:text-6xl font-sans font-black dark:text-white text-zinc-950 tracking-tight leading-tight">
            Your Digital Empire<br />Starts Today.
          </h2>
          <p className="text-sm md:text-base dark:text-zinc-400 text-zinc-600 leading-relaxed font-mono max-w-xl mx-auto">
            Take command of your publishing, gaming, and commercial platforms under a single premium operating layer.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={onExploreHelolex}
              id="final-cta-btn-korlyn"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold tracking-widest uppercase rounded-lg transition-all shadow-xl shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-95 group cursor-pointer"
            >
              Explore HELOLEX
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t dark:border-zinc-900/60 border-zinc-200 dark:bg-[#05070B] bg-[#FAFAFC] py-12 px-4 md:px-8 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-sm font-black dark:text-white text-zinc-950 tracking-[0.2em] uppercase">KORLYN</span>
            </div>
            <p className="text-xs dark:text-zinc-500 text-zinc-500 font-mono">
              "Digital Ownership Starts Here."
            </p>
          </div>

          <p className="text-xs dark:text-zinc-600 text-zinc-500 font-mono">
            &copy; 2026 KORLYN Technology Group. All rights reserved. Built with precision.
          </p>
        </div>
      </footer>
    </div>
  );
}
