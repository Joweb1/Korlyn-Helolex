import React, { useState, useEffect } from 'react';
import NeonBorder from './NeonBorder';
import helolexBgImg from '../assets/images/helolex_cinematic_orange_bg_1782758626894.webp';
import solsticeAssassinImg from '../assets/images/solstice_assassin.webp';
import helolexLudoMaxImg from '../assets/images/helolex_ludo_max.webp';
import helolexSweetMatchImg from '../assets/images/helolex_sweet_match.webp';
import helolexBoasterImg from '../assets/images/helolex_boaster.webp';
import helolexRoadBallImg from '../assets/images/helolex_road_ball.webp';
import { 
  Shield, 
  Terminal, 
  Flame, 
  Compass, 
  TrendingUp, 
  Check, 
  Upload, 
  FileCheck, 
  Copy, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  ArrowLeft,
  ChevronDown,
  LayoutDashboard,
  Coins,
  Cpu,
  Trophy,
  Crown,
  Award,
  Bell,
  Mail,
  Sparkles,
  X
} from 'lucide-react';
import { GamePoster, PaymentRecord, BankDetails, UserAccount } from '../types';
import { normalizePhone } from '../App';
import ThemeToggle from './ThemeToggle';
import ImageWithLoader from './ImageWithLoader';
import { uploadReceipt } from '../firebaseClient';

interface HelolexPageProps {
  onBackToKorlyn: () => void;
  onOpenAdmin: () => void;
  onSubmitPayment: (
    email: string,
    phone: string,
    receiptDataUrl: string,
    receiptName: string,
    fullName: string,
    amount?: string,
    passType?: 'single' | 'multiple'
  ) => void;
  payments: PaymentRecord[];
  onViewCertificate: (payment: PaymentRecord) => void;
  pendingCount: number;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  bankDetails: BankDetails;
  isAdminUnlocked: boolean;
  users: UserAccount[];
  onLogin: (phone: string) => void;
  onRegisterNewUser: (phone: string, referredBy?: string, fullName?: string, email?: string, passType?: 'single' | 'multiple') => void;
}

export default function HelolexPage({ 
  onBackToKorlyn, 
  onOpenAdmin,
  onSubmitPayment,
  payments,
  onViewCertificate,
  pendingCount,
  theme,
  setTheme,
  bankDetails,
  isAdminUnlocked,
  users,
  onLogin,
  onRegisterNewUser
}: HelolexPageProps) {
  // Parallax Scroll State for Cyberpunk background
  const [scrollZoom, setScrollZoom] = useState(1);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero' | 'games' | 'pass' | 'faq'>('hero');
  
  // Phone auth modal states
  const [isPhoneAuthModalOpen, setIsPhoneAuthModalOpen] = useState(false);
  const [isPassSelectionModalOpen, setIsPassSelectionModalOpen] = useState(false);
  const [isGenericClaimFlow, setIsGenericClaimFlow] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedPass, setSelectedPass] = useState<'single' | 'multiple'>('single');

  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Notification sign-up modal states
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedGameForNotify, setSelectedGameForNotify] = useState<string>('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyOptInAll, setNotifyOptInAll] = useState(true);

  // Gain Access verification flow
  const handleGainAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = authPhone.replace(/\D/g, '');
    let checkDigits = digitsOnly;
    if (checkDigits.startsWith('234')) {
      checkDigits = checkDigits.slice(3);
    }
    if (checkDigits.length !== 10 && checkDigits.length !== 11) {
      setAuthError('Please enter a valid Nigerian phone number (e.g. 08031234567).');
      return;
    }
    setAuthError('');

    const normalized = normalizePhone(digitsOnly);
    const userExists = users.some(u => normalizePhone(u.phone) === normalized);
    const hasSubmittedPayment = payments.some(p => normalizePhone(p.phone) === normalized);
    
    if (userExists || hasSubmittedPayment) {
      if (!userExists) {
        // Create user entry just in case they have a payment but no user entry yet
        const existingPay = payments.find(p => normalizePhone(p.phone) === normalized);
        onRegisterNewUser(normalized, undefined, existingPay?.receiptName ? '' : '', existingPay?.email || '');
      }
      // Return visitor or pending approval: log them straight in and take them to User Dashboard!
      setIsPhoneAuthModalOpen(false);
      onLogin(normalized);
    } else {
      // First time visitor: store phone number
      setPhone(normalized);
      setIsPhoneAuthModalOpen(false);
      if (isGenericClaimFlow) {
        // Show pass selection modal if they clicked generic button and are a new user
        setIsPassSelectionModalOpen(true);
      } else {
        // Show purchase modal directly if they clicked specific card
        setIsPurchaseModalOpen(true);
      }
    }
  };

  // Scroll handler for AAA background zoom & active section tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const zoomValue = 1 + (scrollPosition / 1000) * 0.15; // smooth zoom
      setScrollZoom(Math.min(zoomValue, 1.25)); // Cap zoom at 1.25

      const scrollPos = scrollPosition + window.innerHeight / 2.5;
      const gamesEl = document.getElementById('games');
      const passEl = document.getElementById('pass');
      const faqEl = document.getElementById('faq');

      if (faqEl && scrollPos >= faqEl.offsetTop) {
        setActiveSection('faq');
      } else if (gamesEl && scrollPos >= gamesEl.offsetTop) {
        setActiveSection('games');
      } else if (passEl && scrollPos >= passEl.offsetTop) {
        setActiveSection('pass');
      } else {
        setActiveSection('hero');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fictional AAA Game Poster data
  const gamePosters: GamePoster[] = [
    {
      id: 'solstice_assassin',
      title: 'Solstice Assassin',
      genre: 'STEALTH ACTION',
      rating: 'PEGI 18',
      description: 'A fast-paced 3D stealth action adventure where players become a futuristic ninja assassin, dodging enemies, eliminating robotic guards, collecting upgrades, and completing challenging missions across vibrant cyberpunk worlds.',
      image: solsticeAssassinImg,
      accentColor: '#8B5CF6',
      comingSoon: true
    },
    {
      id: 'helolex_ludo_max',
      title: 'Helolex Ludo Max',
      genre: 'MULTIPLAYER LUDO',
      rating: 'PEGI 3',
      description: 'A modern multiplayer Ludo experience featuring online matches, private rooms, tournaments, AI opponents, power-ups, and beautiful animated boards for friends and family.',
      image: helolexLudoMaxImg,
      accentColor: '#F59E0B',
      comingSoon: true
    },
    {
      id: 'helolex_sweet_match',
      title: 'Helolex Sweet Match',
      genre: 'MATCH-3 PUZZLE',
      rating: 'PEGI 3',
      description: 'A colorful match-3 puzzle game filled with delicious candies, exciting boosters, challenging levels, and rewarding combos designed for relaxing yet addictive gameplay.',
      image: helolexSweetMatchImg,
      accentColor: '#06B6D4',
      comingSoon: true
    },
    {
      id: 'helolex_boaster',
      title: 'Helolex Boaster',
      genre: 'BUBBLE SHOOTER',
      rating: 'PEGI 3',
      description: 'A vibrant bubble shooter game where players aim, shoot, and pop colorful bubbles through hundreds of fun levels using strategic shots, powerful boosters, and satisfying chain reactions.',
      image: helolexBoasterImg,
      accentColor: '#EC4899',
      comingSoon: true
    },
    {
      id: 'helolex_road_ball',
      title: 'Helolex Road Ball',
      genre: '3D ARCADE ROLLER',
      rating: 'PEGI 7',
      description: 'A fast-paced 3D arcade rolling game where players guide a futuristic ball through dynamic tracks, avoid obstacles, perform precision moves, and race toward the finish line.',
      image: helolexRoadBallImg,
      accentColor: '#3B82F6',
      comingSoon: true
    }
  ];

  // Copy account utility
  const copyAccountNum = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  // Drag and Drop files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Only receipt images (JPG, PNG) are permitted.');
      return;
    }
    setReceiptFile(file);
    setFormError('');

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Submit flow
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone || !fullName) {
      setFormError('Please provide your Full Name, active Email and Phone Number.');
      return;
    }
    if (!receiptFile && !receiptDataUrl) {
      setFormError('A payment receipt screenshot is required.');
      return;
    }

    setFormError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let finalReceiptUrl = receiptDataUrl;
      
      if (receiptFile) {
        // Immediately upload file to Cloudinary with progress tracking
        finalReceiptUrl = await uploadReceipt(receiptFile, phone, (percent) => {
          setUploadProgress(percent);
        });
      }

      const refPhoneVal = sessionStorage.getItem('korlyn_active_referrer') || undefined;
      const amountVal = selectedPass === 'multiple' ? '₦100,000' : '₦25,000';
      
      await onRegisterNewUser(phone, refPhoneVal, fullName, email, selectedPass);
      await onSubmitPayment(email, phone, finalReceiptUrl, receiptFile?.name || 'receipt_screenshot.png', fullName, amountVal, selectedPass);
      
      setIsUploading(false);
      setFormSuccess(true);
      
      // Log the user in immediately & close purchase modal
      onLogin(phone);
      setIsPurchaseModalOpen(false);

      // reset form fields
      setEmail('');
      setPhone('');
      setFullName('');
      setReceiptFile(null);
      setReceiptDataUrl('');
    } catch (err: any) {
      console.error('Error during acquisition registration and upload:', err);
      setFormError(err.message || 'An error occurred during file upload or registration.');
      setIsUploading(false);
    }
  };

  // Find if user already submitted a payment
  const userSubmissions = payments.filter((p) => p.email.toLowerCase() === email.toLowerCase());

  const faqs = [
    {
      q: 'What is the HELOLEX Ownership Pass?',
      a: 'The Ownership Pass is a premium, permanent digital identity license. It grants you sovereign ownership of your gaming communities, early access to new game build rollouts, lower transaction fees on community marketplaces, and official certified validation.'
    },
    {
      q: 'How does the bank transfer verification work?',
      a: 'To guarantee sovereign launch limits, we process allocations manually. Transfer the ₦25,000 to our designated KORLYN Infrastructure account, capture the receipt, and upload it via the claiming portal. Our compliance desk approves transactions within minutes.'
    },
    {
      q: 'Can I transfer or monetize my Ownership Pass?',
      a: 'Yes. Every verified Ownership Pass generates a cryptographic certificate tied to a unique ID. In Phase 2, passes can be listed on the KORLYN marketplace or bound to custom gaming brands.'
    },
    {
      q: 'What games are included on the HELOLEX launcher?',
      a: 'We are launching with five highly competitive fictional game arenas including Project Nova, Shadow Realm, and Velocity X. Pass holders have complete master server orchestration tools for these games.'
    }
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="dark:bg-[#05070B] bg-[#FAFAFC] dark:text-zinc-300 text-zinc-700 min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300">
      
      {/* Immersive Background Cyberpunk Art (Zooming on Scroll) */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] overflow-hidden pointer-events-none z-0">
        <div 
          className="w-full h-full bg-cover bg-center origin-center transition-transform duration-100 dark:opacity-65 opacity-25"
          style={{
            backgroundImage: `url(${helolexBgImg})`,
            transform: `scale(${scrollZoom})`,
            backgroundBlendMode: 'overlay',
          }}
        />
        {/* Radial overlays */}
        <div className="absolute inset-0 dark:bg-gradient-to-t dark:from-[#05070B] dark:via-[#05070B]/40 dark:to-transparent bg-gradient-to-t from-[#FAFAFC] via-[#FAFAFC]/40 to-transparent" />
        <div className="absolute inset-0 dark:bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#05070B_95%)] bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#FAFAFC_95%)]" />
      </div>

      {/* Dynamic Fixed Vector Background Overlay */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Section 1: Hero Vector Background (Cyber starfield, constellation nodes, cybercontroller lines) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSection === 'hero' ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dot-grid-fixed-helolex-hero" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" className="fill-purple-500/20 dark:fill-purple-400/10" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-grid-fixed-helolex-hero)" />
            
            {/* Cyberpunk vector crosshairs & angular grids */}
            <g className="stroke-purple-600/30 dark:stroke-purple-400/20" strokeWidth="1" fill="none">
              <path d="M-50,250 L200,250 L250,300 H800 L850,350 H1300" />
              <path d="M120,-100 V200 L180,260 V500" strokeDasharray="3,3" />
            </g>
            <g className="stroke-orange-500/25 dark:stroke-orange-400/15" strokeWidth="1" fill="none">
              <circle cx="200" cy="200" r="120" />
              <circle cx="200" cy="200" r="150" strokeDasharray="4,4" />
              <path d="M200,50 V350 M50,200 H350" />
            </g>
            
            {/* Tech nodes / gaming target corners */}
            <g className="fill-purple-600/50 dark:fill-purple-400/40">
              <circle cx="250" cy="300" r="6" className="animate-pulse" />
              <circle cx="800" cy="300" r="5" />
            </g>
          </svg>
        </div>

        {/* Section 2: Games Vector Background (Gaming grid, console motifs, polygon web) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSection === 'games' ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="gaming-grid" x="0" y="0" width="45" height="45" patternUnits="userSpaceOnUse">
                <path d="M45,0 L0,0 0,45" className="stroke-zinc-200/50 dark:stroke-zinc-900/30" strokeWidth="1" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gaming-grid)" />

            {/* Glowing neon gaming lines and geometric shapes */}
            <g className="stroke-blue-600/20 dark:stroke-blue-500/20" strokeWidth="1.5" fill="none">
              <polygon points="100,100 250,50 350,150 180,250" className="dark:stroke-blue-500/10" />
              <polygon points="850,200 1050,150 1150,300 950,350" className="dark:stroke-blue-500/10" strokeDasharray="5,5" />
            </g>

            {/* Circuit routes */}
            <path d="M100,100 H150 L200,150 H450 L500,200" className="stroke-purple-600/20 dark:stroke-purple-500/15" strokeWidth="1.2" fill="none" />
            <path d="M850,200 H750 L700,250 H550 L500,200" className="stroke-orange-500/15 dark:stroke-orange-400/10" strokeWidth="1" fill="none" strokeDasharray="2,2" />

            <circle cx="500" cy="200" r="5" className="fill-purple-600 dark:fill-purple-400 animate-pulse" />
          </svg>
        </div>

        {/* Section 3: Pass Vector Background (Sovereign License, Radial Rings, Crests) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSection === 'pass' ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pass-diagonal" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="40" className="stroke-zinc-100 dark:stroke-zinc-900/40" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pass-diagonal)" />

            {/* Giant Concentric Sovereign Rings */}
            <g className="stroke-purple-600/15 dark:stroke-purple-400/20" strokeWidth="1" fill="none">
              <circle cx="850" cy="300" r="150" />
              <circle cx="850" cy="300" r="250" />
              <circle cx="850" cy="300" r="300" strokeDasharray="6,6" />
              
              {/* Golden ratio radial spokes */}
              <line x1="550" y1="300" x2="1150" y2="300" />
              <line x1="850" y1="0" x2="850" y2="600" />
            </g>

            <g className="stroke-orange-500/15 dark:stroke-orange-500/10" strokeWidth="1" fill="none">
              <circle cx="150" cy="250" r="90" />
              <circle cx="150" cy="250" r="140" strokeDasharray="3,3" />
            </g>

            {/* Glowing vertices */}
            <circle cx="850" cy="300" r="7" className="fill-purple-600 dark:fill-purple-400 animate-pulse" />
            <circle cx="1150" cy="300" r="5" className="fill-blue-600 dark:fill-blue-400" />
          </svg>
        </div>

        {/* Section 4: FAQ Vector Background (Knowledge Web, Question nodes) */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSection === 'faq' ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="faq-dot-grid" x="0" y="0" width="35" height="35" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" className="fill-zinc-300 dark:fill-zinc-800/60" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#faq-dot-grid)" />

            {/* Interconnected QA nodes */}
            <g className="stroke-purple-600/15 dark:stroke-purple-500/15" strokeWidth="1.5" fill="none">
              <path d="M150,150 L350,120 L450,250 L250,280 Z" />
              <path d="M900,200 L1100,180 L1150,300 L950,320 Z" />
              <line x1="450" y1="250" x2="950" y2="320" strokeDasharray="3,3" />
            </g>

            {/* Knowledge points */}
            <g className="fill-purple-600/35 dark:fill-purple-400/40">
              <circle cx="150" cy="150" r="5" />
              <circle cx="350" cy="120" r="5.5" />
              <circle cx="450" cy="250" r="7" className="animate-pulse" />
              <circle cx="950" cy="320" r="6" />
            </g>
          </svg>
        </div>
      </div>

      {/* Floating neon mesh grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.01)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(139,92,246,0.01)_1px,_transparent_1px)] bg-[size:30px_30px] pointer-events-none dark:opacity-100 opacity-20" />

      {/* Navigation (Riot meets Apple) */}
      <nav className="sticky top-0 z-40 dark:bg-[#05070B]/90 bg-white/95 backdrop-blur-md border-b dark:border-purple-500/10 border-zinc-200 px-4 md:px-8 py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 font-bold dark:text-white text-zinc-950 tracking-[0.25em]">
              <span className="text-purple-600 dark:text-purple-500 font-extrabold text-lg">H</span>
              <span className="text-sm tracking-wider uppercase font-sans">HELOLEX</span>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => scrollToSection('games')} className="text-[11px] font-mono tracking-widest dark:text-zinc-400 text-zinc-500 dark:hover:text-white hover:text-zinc-950 transition-all uppercase cursor-pointer">GAMES</button>
            <button onClick={() => scrollToSection('pass')} className="text-[11px] font-mono tracking-widest dark:text-zinc-400 text-zinc-500 dark:hover:text-white hover:text-zinc-950 transition-all uppercase cursor-pointer">OWNERSHIP PASS</button>
            <button onClick={() => scrollToSection('roadmap')} className="text-[11px] font-mono tracking-widest dark:text-zinc-400 text-zinc-500 dark:hover:text-white hover:text-zinc-950 transition-all uppercase cursor-pointer">ROADMAP</button>
            <button onClick={() => scrollToSection('faq')} className="text-[11px] font-mono tracking-widest dark:text-zinc-400 text-zinc-500 dark:hover:text-white hover:text-zinc-950 transition-all uppercase cursor-pointer">FAQ</button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAdminUnlocked && (
              <button
                onClick={onOpenAdmin}
                id="admin-panel-btn-helolex"
                className="flex items-center gap-1.5 px-3 py-1.5 dark:bg-zinc-900/80 bg-zinc-100 hover:dark:bg-zinc-800 hover:bg-zinc-200 dark:text-zinc-300 text-zinc-700 hover:dark:text-white hover:text-zinc-950 rounded-lg text-xs font-mono tracking-wider transition-all border dark:border-purple-500/10 border-zinc-200 relative cursor-pointer"
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

            <ThemeToggle theme={theme} onChange={setTheme} />

            <button
              onClick={() => {
                setIsGenericClaimFlow(true);
                setIsPhoneAuthModalOpen(true);
              }}
              id="btn-claim-nav"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold tracking-widest uppercase rounded-lg transition-all shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer"
            >
              CLAIM PASS
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-24 pb-20 max-w-7xl mx-auto px-4 md:px-8 z-10 flex flex-col justify-center min-h-[85vh]">
        <div className="max-w-3xl space-y-6 text-left relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 dark:bg-purple-950/40 bg-purple-100/60 border dark:border-purple-500/30 border-purple-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase dark:text-purple-300 text-purple-700 font-bold">
              LAUNCHING SOON
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-sans font-black dark:text-white text-zinc-950 leading-[1.05] tracking-tight">
            Don't Just<br />
            Play Games.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-orange-500 to-blue-600 drop-shadow-[0_2px_30px_rgba(249,115,22,0.2)]">Own One.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base dark:text-zinc-300 text-zinc-600 font-mono max-w-xl leading-relaxed">
            HELOLEX empowers creators to launch, grow and monetize gaming communities through a single platform. Reserve your gaming identity today and become one of the first digital owners.
          </p>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => {
                setIsGenericClaimFlow(true);
                setIsPhoneAuthModalOpen(true);
              }}
              id="hero-primary-cta-helolex"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold tracking-widest uppercase rounded-lg transition-all shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95 cursor-pointer"
            >
              Claim Your Game Brand
            </button>
            <button
              onClick={() => scrollToSection('pass')}
              id="hero-secondary-cta-helolex"
              className="px-8 py-4 dark:bg-zinc-950/80 bg-white hover:dark:bg-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 text-zinc-700 dark:hover:text-white hover:text-zinc-950 text-xs font-bold tracking-widest uppercase rounded-lg transition-all border dark:border-zinc-800 border-zinc-200 active:scale-95 cursor-pointer"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Hero Statistics Block */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-20 pt-8 border-t dark:border-zinc-900/80 border-zinc-200">
          <div>
            <span className="text-[10px] font-mono dark:text-zinc-500 text-zinc-500 uppercase block">Total Slots</span>
            <span className="text-lg font-black dark:text-white text-zinc-900 block mt-0.5 font-sans">10,000 AVAILABLE</span>
          </div>
          <div>
            <span className="text-[10px] font-mono dark:text-zinc-500 text-zinc-500 uppercase block">License Price</span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400 block mt-0.5 font-sans">₦25,000 ONCE</span>
          </div>
          <div>
            <span className="text-[10px] font-mono dark:text-zinc-500 text-zinc-500 uppercase block">Access Rules</span>
            <span className="text-lg font-black dark:text-white text-zinc-900 block mt-0.5 font-sans">PRIORITY PASS</span>
          </div>
          <div>
            <span className="text-[10px] font-mono dark:text-zinc-500 text-zinc-500 uppercase block">Control Console</span>
            <span className="text-lg font-black dark:text-white text-zinc-900 block mt-0.5 font-sans">CREATOR HUB</span>
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className="text-[10px] font-mono dark:text-zinc-500 text-zinc-500 uppercase block">Tier Allocation</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 font-sans">PREMIUM TIER</span>
            <button
              onClick={onBackToKorlyn}
              className="text-[10px] font-mono text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 hover:underline flex items-center gap-1 mt-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Korlyn
            </button>
          </div>
        </div>
      </section>

      {/* Ownership Pass Pricing Section */}
      <section id="pass" className="border-t dark:border-zinc-900/40 border-zinc-200/50 py-24 dark:bg-[#05070B]/10 bg-zinc-100/10 backdrop-blur-[2px] px-4 md:px-8 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center relative z-10 text-center">
          
          <div className="space-y-4 max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
              LIFETIME LICENSE PRICING
            </span>
            <h2 className="text-3xl sm:text-5xl font-sans font-black dark:text-white text-zinc-950 tracking-tight">
              Sovereign Ownership Licenses
            </h2>
            <p className="text-sm font-mono dark:text-zinc-400 text-zinc-600 leading-relaxed max-w-lg mx-auto">
              Choose your master deployment tier. Secure your permanent digital identity and unlock sovereign monetization today.
            </p>
          </div>

          {/* Pricing Card Grid Container */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto relative z-10">
            
            {/* CARD 1: Premium Single Game Pass */}
            <div className="w-full dark:bg-zinc-950/75 bg-white/75 backdrop-blur-md rounded-2xl border-2 dark:border-purple-500/30 border-purple-200 p-8 shadow-[0_0_50px_rgba(139,92,246,0.12)] relative overflow-hidden group text-center flex flex-col justify-between">
              <NeonBorder lines={3} />
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
              
              <div className="space-y-6 relative z-10 flex-grow">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 dark:bg-purple-950/40 bg-purple-50 border dark:border-purple-500/20 border-purple-200 rounded-full text-[9px] font-mono tracking-wider text-purple-700 dark:text-purple-300 uppercase inline-block font-bold">
                    SINGLE PASS
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded text-[9px] font-mono font-bold uppercase animate-pulse">
                    50% OFF (First 1,000)
                  </span>
                </div>

                <div className="text-left">
                  <h3 className="text-xl font-black dark:text-white text-zinc-950">Premium Ownership Pass</h3>
                  <p className="text-[11px] text-zinc-500 font-mono mt-1">Sovereign identity and revenue rights for our flagship game.</p>
                </div>
                
                <div className="py-4 border-y dark:border-zinc-900 border-zinc-250 text-left">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r dark:from-white dark:via-purple-300 dark:to-white from-zinc-950 via-purple-600 to-zinc-950">
                      ₦25,000
                    </span>
                    <span className="text-sm font-mono line-through text-zinc-400 dark:text-zinc-650">
                      ₦50,000
                    </span>
                  </div>
                  <span className="text-[10px] font-mono dark:text-zinc-500 text-zinc-500 block mt-1 uppercase tracking-widest">
                    One-time Payment / Lifetime License
                  </span>
                </div>

                <ul className="text-xs font-mono dark:text-zinc-400 text-zinc-600 space-y-3 py-4 text-left">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                    Sovereign Flagship Game License
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                    Early Access to Build Rollouts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                    Direct Player Monetization Streams
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                    Active Promo Referral Console
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                    Verified Metal-Embossed Certificate
                  </li>
                </ul>
              </div>

              <div className="mt-8 relative z-10 space-y-3">
                <button
                  onClick={() => {
                    setIsGenericClaimFlow(false);
                    setSelectedPass('single');
                    setIsPhoneAuthModalOpen(true);
                  }}
                  id="btn-buy-ownership-pass"
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-xl shadow-purple-500/20 active:scale-95 cursor-pointer"
                >
                  Acquire Single Pass
                </button>
                <p className="text-[10px] dark:text-zinc-500 text-zinc-400 font-mono">
                  Guaranteed allocation slot. License terms apply.
                </p>
              </div>
            </div>

            {/* CARD 2: Premium Multiple Games Pass */}
            <div className="w-full dark:bg-zinc-950/85 bg-white/85 backdrop-blur-md rounded-2xl border-2 dark:border-amber-500/30 border-amber-200 p-8 shadow-[0_0_50px_rgba(245,158,11,0.12)] relative overflow-hidden group text-center flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
              
              <div className="space-y-6 relative z-10 flex-grow">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 dark:bg-amber-950/40 bg-amber-50 border dark:border-amber-500/20 border-amber-200 rounded-full text-[9px] font-mono tracking-wider text-amber-700 dark:text-amber-300 uppercase inline-block font-bold">
                    MULTIPLE GAME PASS
                  </span>
                  <span className="px-2 py-0.5 bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded text-[9px] font-mono font-bold uppercase animate-pulse">
                    75% OFF (Limited Time)
                  </span>
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xl font-black dark:text-white text-zinc-950">Premium Multiple Pass</h3>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono mt-1">Unrestricted sovereign ownership across all current and future releases.</p>
                </div>
                
                <div className="py-4 border-y dark:border-zinc-900 border-zinc-250 text-left">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r dark:from-white dark:via-amber-300 dark:to-white from-zinc-950 via-amber-600 to-zinc-950">
                      ₦100,000
                    </span>
                    <span className="text-sm font-mono line-through text-zinc-400 dark:text-zinc-650">
                      ₦250,000
                    </span>
                  </div>
                  <span className="text-[10px] font-mono dark:text-zinc-500 text-zinc-500 block mt-1 uppercase tracking-widest">
                    One-time Payment / Infinite Licenses
                  </span>
                </div>

                <ul className="text-xs font-mono dark:text-zinc-400 text-zinc-600 space-y-3 py-4 text-left">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                    Sovereign Licenses for ALL Premier Games
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                    Maximized Revenue Sharing Multiplier (+15%)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                    VIP Early Beta Phase 2 Integration Access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                    Double Referral Points Accrual Power
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                    Premium 24/7 Priority Concierge Support Desk
                  </li>
                </ul>
              </div>

              <div className="mt-8 relative z-10 space-y-3">
                <button
                  onClick={() => {
                    setIsGenericClaimFlow(false);
                    setSelectedPass('multiple');
                    setIsPhoneAuthModalOpen(true);
                  }}
                  id="btn-buy-multiple-pass"
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer"
                >
                  Acquire Multiple Pass
                </button>
                <p className="text-[10px] dark:text-zinc-500 text-zinc-400 font-mono">
                  Elite corporate allocation tier. VIP support.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Featured Games Section */}
      <section id="games" className="border-t dark:border-zinc-900/40 border-zinc-200/50 py-24 dark:bg-[#05070B]/10 bg-zinc-100/10 backdrop-blur-[2px] px-4 md:px-8 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
              PLAYSTATION QUALITY MULTIPLAYER
            </span>
            <h2 className="text-3xl sm:text-5xl font-sans font-black dark:text-white text-zinc-950 tracking-tight">
              Featured Game Realms
            </h2>
          </div>
          <p className="text-xs dark:text-zinc-500 text-zinc-500 max-w-sm font-mono leading-relaxed">
            Own the master cluster. These fictional game packages launch with pre-configured high-availability multiplayer nodes under your own custom white-label brands.
          </p>
        </div>

        {/* Featured Game Realm Banner Image */}
        <div className="max-w-7xl mx-auto mb-16 relative z-10 rounded-3xl overflow-hidden border dark:border-zinc-800 border-zinc-200 shadow-2xl group/banner">
          <NeonBorder rx={24} ry={24} />
          <ImageWithLoader 
            src="/helolex_game_banner.webp"
            alt="Helolex Game Banner Realm"
            referrerPolicy="no-referrer"
            className="w-full h-auto object-cover max-h-[480px] transform group-hover/banner:scale-[1.01] transition-all duration-700 select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        </div>

        {/* Posters Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
          {gamePosters.map((game) => (
            <div 
              key={game.id}
              onClick={() => {
                if (game.comingSoon) {
                  setSelectedGameForNotify(game.title);
                  setIsNotifyModalOpen(true);
                  setNotifySuccess(false);
                  setNotifyEmail('');
                  setNotifyOptInAll(true);
                }
              }}
              className="group aspect-[3/4.5] dark:bg-zinc-950/70 bg-white/70 backdrop-blur-md rounded-2xl overflow-hidden border dark:border-zinc-900/80 border-zinc-200/80 hover:border-purple-500/40 transition-all duration-500 flex flex-col justify-between p-5 relative shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)] cursor-pointer"
            >
              <NeonBorder />
              
              {/* Coming Soon Badge */}
              {game.comingSoon && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGameForNotify(game.title);
                    setIsNotifyModalOpen(true);
                    setNotifySuccess(false);
                    setNotifyEmail('');
                    setNotifyOptInAll(true);
                  }}
                  className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 hover:bg-black/95 dark:bg-purple-950/80 dark:hover:bg-purple-900 border dark:border-purple-500/40 border-purple-300 hover:border-purple-400 backdrop-blur-md shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all duration-300 hover:scale-[1.03] active:scale-95 group/badge"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                  <span className="text-[7.5px] font-mono font-bold tracking-widest text-purple-200 uppercase flex items-center gap-1">
                    <span className="group-hover:hidden">COMING SOON</span>
                    <span className="hidden group-hover:inline flex items-center gap-1">
                      NOTIFY ME <Bell className="w-2.5 h-2.5 inline" />
                    </span>
                  </span>
                </div>
              )}

              {/* Poster Backdrop Image & Gradient Overlay */}
              <div className="absolute inset-0 group-hover:scale-105 transition-all duration-700 pointer-events-none overflow-hidden">
                <ImageWithLoader 
                  src={game.image} 
                  alt={game.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-[0.99] transition-opacity duration-700"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t dark:from-zinc-950 dark:via-zinc-950/40 dark:to-transparent from-white via-white/60 to-transparent dark:opacity-90 opacity-95" />
              </div>
              
              {/* Tech background graphic */}
              <div className="absolute inset-0 dark:opacity-10 opacity-[0.05] dark:bg-[radial-gradient(circle_at_center,_#fff_5%,_transparent_100%)] bg-[radial-gradient(circle_at_center,_#000_5%,_transparent_100%)] group-hover:opacity-20 pointer-events-none" />

              {/* GAME 1: SOLSTICE ASSASSIN HUD & LASER SWEEP */}
              {game.id === 'solstice_assassin' && (
                <>
                  {/* Sweeping laser line */}
                  <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_8px_rgba(139,92,246,0.8)] opacity-0 group-hover:animate-laser-sweep pointer-events-none" />
                  
                  {/* Circular radar HUD */}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <div className="w-36 h-36 border border-purple-500/10 rounded-full flex items-center justify-center group-hover:border-purple-500/25 transition-all duration-500 relative">
                      <div className="absolute inset-0 border border-dashed border-purple-400/5 group-hover:border-purple-400/20 rounded-full animate-radar-sweep" />
                      <div className="w-24 h-24 border border-cyan-400/10 rounded-full flex items-center justify-center relative group-hover:border-cyan-400/35 transition-all duration-500">
                        <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-cyan-400/20 group-hover:bg-cyan-400/40" />
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-cyan-400/20 group-hover:bg-cyan-400/40" />
                      </div>
                    </div>
                  </div>

                  {/* Floating HUD tech labels */}
                  <div className="absolute top-12 left-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none font-mono text-[7px] text-cyan-400 space-y-0.5">
                    <div>SYS_STAT: STEALTH</div>
                    <div>SHADOW_M: 98.4%</div>
                  </div>
                  <div className="absolute top-12 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none font-mono text-[7px] text-purple-400 text-right space-y-0.5">
                    <div>ASSASSIN: ACTIVE</div>
                    <div>VIS_RNG: CAL</div>
                  </div>
                </>
              )}

              {/* GAME 2: HELOLEX LUDO MAX FLOATING EMBERS & COSMIC BOARD */}
              {game.id === 'helolex_ludo_max' && (
                <>
                  {/* Drifting Embers */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <span className="absolute bottom-[-10px] left-[15%] w-1.5 h-1.5 bg-amber-500 rounded-full blur-[1px] animate-[driftParticles_3.5s_linear_infinite]" style={{'--drift-x': '30px'} as React.CSSProperties} />
                    <span className="absolute bottom-[-10px] left-[35%] w-2 h-2 bg-red-500 rounded-full blur-[1.5px] animate-[driftParticles_4s_linear_infinite]" style={{'--drift-x': '-20px', animationDelay: '0.8s'} as React.CSSProperties} />
                    <span className="absolute bottom-[-10px] left-[55%] w-1 h-1 bg-yellow-400 rounded-full blur-[0.5px] animate-[driftParticles_2.8s_linear_infinite]" style={{'--drift-x': '25px', animationDelay: '1.5s'} as React.CSSProperties} />
                    <span className="absolute bottom-[-10px] left-[75%] w-2.5 h-2.5 bg-amber-600 rounded-full blur-[2px] animate-[driftParticles_4.5s_linear_infinite]" style={{'--drift-x': '-40px', animationDelay: '0.3s'} as React.CSSProperties} />
                    <span className="absolute bottom-[-10px] left-[90%] w-1.5 h-1.5 bg-orange-500 rounded-full blur-[1px] animate-[driftParticles_3.2s_linear_infinite]" style={{'--drift-x': '15px', animationDelay: '1.9s'} as React.CSSProperties} />
                  </div>

                  {/* Ludo Cosmic Ring */}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-600 via-red-600 to-black opacity-0 group-hover:opacity-30 blur-xl transition-all duration-700 transform scale-75 group-hover:scale-110" />
                    
                    <div className="absolute w-28 h-28 opacity-0 group-hover:opacity-75 transition-all duration-700 transform scale-90 group-hover:scale-100 animate-blueprint-rotate">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-amber-500">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <rect x="35" y="35" width="30" height="30" stroke="currentColor" strokeWidth="1" fill="none" />
                        <path d="M 50,10 L 50,15 M 50,85 L 50,90 M 10,50 L 15,50 M 85,50 L 90,50" stroke="currentColor" strokeWidth="2" />
                        <circle cx="50" cy="50" r="4" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                </>
              )}

              {/* GAME 3: HELOLEX SWEET MATCH SWEET SHIMMER & CELESTIAL STARS */}
              {game.id === 'helolex_sweet_match' && (
                <>
                  {/* Floating candy sparkles cascading */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-40 transition-all duration-700">
                    <div className="absolute inset-y-0 left-[20%] w-[1px] bg-cyan-400 animate-speed-lines" />
                    <div className="absolute inset-y-0 left-[50%] w-[1.5px] bg-pink-400 animate-speed-lines-fast" style={{animationDelay: '0.1s'} as React.CSSProperties} />
                    <div className="absolute inset-y-0 left-[80%] w-[1px] bg-purple-400 animate-speed-lines" style={{animationDelay: '0.3s'} as React.CSSProperties} />
                  </div>

                  {/* Sweet Sparkler Overlay */}
                  <div className="absolute bottom-24 right-5 w-16 h-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400">
                      <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" fill="none" className="animate-spin" style={{animationDuration: '10s'} as React.CSSProperties} />
                      <polygon points="50,15 60,40 85,50 60,60 50,85 40,60 15,50 40,40" stroke="currentColor" strokeWidth="1.5" fill="none" className="animate-pulse" />
                    </svg>
                  </div>
                </>
              )}

              {/* GAME 4: HELOLEX BOASTER SHOCKWAVE & TARGET SELECT */}
              {game.id === 'helolex_boaster' && (
                <>
                  {/* Top hazard warning border */}
                  <div 
                    className="absolute top-0 inset-x-0 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                    style={{
                      backgroundImage: 'repeating-linear-gradient(-45deg, #ec4899, #ec4899 6px, #000 6px, #000 12px)',
                      backgroundSize: '24px 24px',
                    }}
                  />
                  
                  {/* Bottom hazard warning border */}
                  <div 
                    className="absolute bottom-0 inset-x-0 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                    style={{
                      backgroundImage: 'repeating-linear-gradient(-45deg, #ec4899, #ec4899 6px, #000 6px, #000 12px)',
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Expanding shockwave ring from center */}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <div className="w-32 h-32 border-2 border-fuchsia-500 rounded-full opacity-0 group-hover:animate-shockwave flex items-center justify-center relative">
                      <div className="w-20 h-20 border border-pink-400/50 rounded-full animate-pulse opacity-40" />
                    </div>
                  </div>

                  {/* Target locking active crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-12 h-12 flex items-center justify-center relative">
                      <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-pink-500" />
                      <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-pink-500" />
                      <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-pink-500" />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-pink-500" />
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                    </div>
                  </div>
                </>
              )}

              {/* GAME 5: HELOLEX ROAD BALL SPEED BLUEPRINT */}
              {game.id === 'helolex_road_ball' && (
                <>
                  {/* Technical blueprint grid overlay - Dark Theme */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-700 pointer-events-none hidden dark:block" 
                    style={{
                      backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
                      backgroundSize: '16px 16px'
                    }}
                  />
                  {/* Technical blueprint grid overlay - Light Theme */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none block dark:hidden" 
                    style={{
                      backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)',
                      backgroundSize: '16px 16px'
                    }}
                  />

                  {/* Rotating Blueprint Circles */}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-0 group-hover:opacity-60 transition-all duration-700">
                    <div className="w-40 h-40 border border-blue-500/30 rounded-full flex items-center justify-center animate-blueprint-rotate relative">
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[7px] font-mono text-blue-400 font-bold tracking-tighter">BALL_PHYSICS_A</span>
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[7px] font-mono text-blue-400 font-bold tracking-tighter">BALL_PHYSICS_B</span>
                      <div className="w-28 h-28 border border-dashed border-cyan-500/20 rounded-full flex items-center justify-center" style={{animationDirection: 'reverse'} as React.CSSProperties}>
                        <div className="w-16 h-16 border border-blue-400/40 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Giant robot optic visor lens flare & scan bar */}
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-blue-500/20 group-hover:bg-blue-400/50 transition-colors pointer-events-none" />
                  <div className="absolute top-[40%] inset-x-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-[3px] bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.9)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center relative">
                      <span className="w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] animate-ping" />
                    </div>
                  </div>
                </>
              )}

              {/* Poster Header */}
              <div className="relative z-10 flex justify-between items-center">
                <span className="text-[8px] font-mono tracking-wider dark:text-zinc-400 text-zinc-500 px-2 py-0.5 dark:bg-black/50 bg-white/80 backdrop-blur border dark:border-zinc-800 border-zinc-200 rounded">
                  {game.genre}
                </span>
                <span className="text-[8px] font-mono dark:text-zinc-500 text-zinc-400">
                  {game.rating}
                </span>
              </div>

              {/* Poster Footer / Content */}
              <div className="relative z-10 space-y-3">
                <h3 className="text-xl font-sans font-black dark:text-white text-zinc-900 tracking-wide group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                  {game.title}
                </h3>
                <p className="text-[10px] dark:text-zinc-400 text-zinc-600 leading-relaxed font-mono opacity-80 group-hover:opacity-100 transition-opacity">
                  {game.description}
                </p>
                
                {/* Micro interaction */}
                <div className="pt-3 border-t dark:border-zinc-800/60 border-zinc-200 flex justify-between items-center text-[9px] font-mono dark:text-zinc-500 text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  <span>{game.comingSoon ? 'GET NOTIFIED' : 'DEPLOY CLUSTER'}</span>
                  <span className="text-sm">{game.comingSoon ? '🔔' : '→'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pass Benefits Section */}
      <section id="benefits" className="border-t dark:border-zinc-900/40 border-zinc-200/50 py-24 dark:bg-[#05070B]/15 bg-zinc-100/20 backdrop-blur-[2px] px-4 md:px-8 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto relative z-10">
          
          <div className="text-center mb-16 space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
              THE PASS BENEFITS
            </span>
            <h2 className="text-3xl sm:text-5xl font-sans font-black dark:text-white text-zinc-950 tracking-tight">
              Own Your Gaming Future.
            </h2>
            <p className="text-sm font-mono dark:text-zinc-400 text-zinc-600 leading-relaxed max-w-xl mx-auto">
              The Ownership Pass is your permanent gateway into the HELOLEX creator ecosystem. Lock down your digital rights and unlock master monetization channels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              'Reserve Your Gaming Identity',
              'Premium Creator Dashboard',
              'Ownership Badge',
              'Priority Product Access',
              'Higher Revenue Share Opportunities',
              'Early Access Features',
              'Exclusive Creator Community',
              'Tournament Invitations',
              'Premium Analytics',
              'Future Rewards'
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 dark:bg-zinc-950/40 bg-white/70 backdrop-blur-md border dark:border-zinc-900/60 border-zinc-200 rounded-xl shadow-sm relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <NeonBorder rx={12} ry={12} />
                <div className="p-1.5 dark:bg-purple-950/40 bg-purple-50 border dark:border-purple-500/20 border-purple-200 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-mono font-medium dark:text-zinc-300 text-zinc-700">{benefit}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* How Payment Works Timeline */}
      <section className="border-t dark:border-zinc-900/40 border-zinc-200/50 py-24 dark:bg-[#05070B]/10 bg-zinc-100/10 backdrop-blur-[2px] px-4 md:px-8 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
              SECURE REGISTRATION PIPELINE
            </span>
            <h2 className="text-3xl sm:text-5xl font-sans font-black dark:text-white text-zinc-950 tracking-tight">
              How Payment Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            {/* Timeline connection line on desktop */}
            <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-[1px] dark:bg-zinc-800 bg-zinc-300 z-0" />

            {[
              { title: 'Step One', desc: 'Click "Become An Owner" or "Claim Pass" button.' },
              { title: 'Step Two', desc: 'Transfer payment to the displayed corporate account.' },
              { title: 'Step Three', desc: 'Capture & upload your digital receipt receipt.' },
              { title: 'Step Four', desc: 'Sovereign compliance desk verifies transactions.' },
              { title: 'Step Five', desc: 'Receive your luxury Ownership Certificate by email.' }
            ].map((step, idx) => (
              <div 
                key={idx}
                className="dark:bg-zinc-950/40 bg-white/70 backdrop-blur-md border dark:border-zinc-900/80 border-zinc-200 p-6 rounded-2xl relative z-10 text-center hover:dark:border-zinc-800 hover:border-zinc-300 transition-all flex flex-col items-center shadow-sm overflow-hidden"
              >
                <NeonBorder />
                <div className="w-12 h-12 rounded-full dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-200 flex items-center justify-center font-mono text-purple-600 dark:text-purple-400 font-bold text-xs mb-4 shadow-md shadow-purple-500/5">
                  {idx + 1}
                </div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider dark:text-white text-zinc-900">
                  {step.title}
                </h4>
                <p className="text-[11px] dark:text-zinc-500 text-zinc-500 font-mono mt-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section id="faq" className="border-t dark:border-zinc-900/40 border-zinc-200/50 py-24 dark:bg-[#05070B]/10 bg-zinc-100/10 backdrop-blur-[2px] px-4 md:px-8 relative z-10 transition-colors">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
              HAVE QUESTIONS?
            </span>
            <h2 className="text-3xl sm:text-5xl font-sans font-black dark:text-white text-zinc-950 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="dark:bg-zinc-950/40 bg-white/70 backdrop-blur-md border dark:border-zinc-900 border-zinc-200 hover:dark:border-zinc-800 hover:border-zinc-300 rounded-xl overflow-hidden transition-all shadow-sm relative"
              >
                <NeonBorder rx={12} ry={12} />
                <button
                  onClick={() => setActiveFAQ(activeFAQ === idx ? null : idx)}
                  className="w-full p-5 flex justify-between items-center text-left font-sans text-sm font-semibold dark:text-white text-zinc-900 tracking-wide uppercase cursor-pointer select-none"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 dark:text-zinc-500 text-zinc-400 transition-transform ${activeFAQ === idx ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''}`} />
                </button>
                {activeFAQ === idx && (
                  <div className="px-5 pb-5 pt-1 border-t dark:border-zinc-900 border-zinc-200 text-xs dark:text-zinc-400 text-zinc-600 leading-relaxed font-mono">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / Call to action */}
      <footer className="border-t dark:border-zinc-900 border-zinc-200 dark:bg-zinc-950 bg-white py-16 px-4 md:px-8 text-center relative overflow-hidden transition-colors">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.05)_0%,_transparent_60%)] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <div className="flex justify-center items-center gap-1.5 font-bold dark:text-white text-zinc-950 tracking-[0.25em]">
            <span className="text-purple-600 dark:text-purple-500 font-extrabold text-2xl">H</span>
            <span className="text-sm tracking-wider uppercase">HELOLEX</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-sans font-black dark:text-white text-zinc-950 tracking-tight leading-tight">
            Join the next generation of digital creators.
          </h3>
          <p className="text-xs md:text-sm dark:text-zinc-400 text-zinc-600 font-mono leading-relaxed max-w-xl mx-auto">
            KORLYN isn't just building software. We're building the future of digital ownership. Take complete command of your universe today.
          </p>

          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto" />

          <p className="text-[10px] dark:text-zinc-500 text-zinc-400 uppercase tracking-widest font-mono">
            "Digital Ownership Starts Here."
          </p>

          <div className="pt-2">
            <button
              onClick={onBackToKorlyn}
              className="text-xs font-mono text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 inline-flex items-center gap-1.5 cursor-pointer transition-all px-4 py-2 rounded-lg border border-purple-500/10 hover:border-purple-500/30 bg-purple-500/5 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Korlyn Portal
            </button>
          </div>
        </div>
      </footer>


      {/* Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md overflow-hidden">
          <div className="relative w-full max-w-xl max-h-[calc(100vh-1rem)] sm:max-h-[90vh] dark:bg-zinc-950 bg-white border dark:border-zinc-800 border-zinc-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl animate-fade-in-up flex flex-col">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsPurchaseModalOpen(false);
                setFormSuccess(false);
              }}
              className="absolute top-4 right-4 p-1.5 dark:bg-zinc-900 bg-zinc-100 hover:dark:bg-zinc-800 hover:bg-zinc-200 dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-zinc-950 rounded-lg transition-all cursor-pointer z-10"
            >
              <span className="text-xs font-mono">CLOSE [X]</span>
            </button>

            {/* Scrollable Container */}
            <div className="flex-grow overflow-y-auto pr-1 min-h-0 pt-6 sm:pt-4">
              {/* Success View */}
              {formSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 bg-emerald-950/40 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-sans font-black dark:text-white text-zinc-950 uppercase tracking-wider">Payment Submitted!</h3>
                  <p className="text-xs dark:text-zinc-400 text-zinc-600 font-mono leading-relaxed max-w-sm mx-auto">
                    Your receipt has been queued securely. Once verified by the KORLYN Admin Panel, you can instantly render and download your luxury Certificate of Ownership!
                  </p>
                  <div className="p-4 dark:bg-purple-950/20 bg-purple-50 border dark:border-purple-500/10 border-purple-200 rounded-xl space-y-3 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Verification Hub</span>
                      <span className="text-purple-600 dark:text-purple-300 font-bold hover:underline cursor-pointer" onClick={() => {
                        setIsPurchaseModalOpen(false);
                        setFormSuccess(false);
                        onOpenAdmin();
                      }}>Open Admin Console</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Registered Contact</span>
                      <span className="dark:text-zinc-300 text-zinc-700">Awaiting clearance</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setIsPurchaseModalOpen(false);
                        setFormSuccess(false);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer"
                    >
                      RETURN TO LAUNCHER
                    </button>
                  </div>
                </div>
              ) : (
                /* Submission Form */
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-purple-600 dark:text-purple-400 font-bold block mb-1">
                      ACQUISITION STAGE
                    </span>
                    <h3 className="text-lg md:text-xl font-sans font-black dark:text-white text-zinc-950 uppercase tracking-tight">
                      {selectedPass === 'multiple' ? 'Secure Multiple Games Pass' : 'Secure Single Ownership Pass'}
                    </h3>
                    <p className="text-xs dark:text-zinc-500 text-zinc-500 font-mono mt-1">
                      Verify allocation pricing ({selectedPass === 'multiple' ? '₦100,000' : '₦25,000'}), execute your corporate wire transfer, and upload proof of dispatch.
                    </p>
                  </div>

                  {/* Bank account details card */}
                  <div className="dark:bg-[#0B1020]/50 bg-zinc-50/70 backdrop-blur-md border dark:border-purple-500/10 border-purple-200 rounded-xl p-4 md:p-5 relative overflow-hidden">
                    <NeonBorder rx={12} ry={12} />
                    <span className="text-[9px] font-mono tracking-widest uppercase text-purple-600 dark:text-purple-400 font-bold block mb-3">
                      DESIGNATED TREASURY BANK
                    </span>
                    
                    <div className="space-y-2.5 font-mono text-xs">
                      <div className="flex justify-between border-b dark:border-zinc-900 border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Bank Name</span>
                        <span className="dark:text-zinc-200 text-zinc-800 font-bold">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between border-b dark:border-zinc-900 border-zinc-200 pb-1.5">
                        <span className="text-zinc-500">Account Name</span>
                        <span className="dark:text-zinc-200 text-zinc-800 font-bold">{bankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Account Number</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-purple-600 dark:text-purple-400 font-bold">{bankDetails.accountNumber}</span>
                          <button
                            type="button"
                            onClick={copyAccountNum}
                            className="p-1 dark:hover:bg-zinc-900 hover:bg-zinc-200 rounded text-zinc-500 dark:hover:text-white hover:text-zinc-900 transition-all cursor-pointer"
                            title="Copy account number"
                          >
                            {copiedAccount ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User details fields */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider dark:text-zinc-400 text-zinc-500 uppercase block">Owner Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Marcus Vance"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full dark:bg-zinc-900/60 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 rounded-lg p-2.5 text-xs dark:text-zinc-200 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-purple-500 transition-all font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono tracking-wider dark:text-zinc-400 text-zinc-500 uppercase block">Active Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. name@domain.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full dark:bg-zinc-900/60 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 rounded-lg p-2.5 text-xs dark:text-zinc-200 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-purple-500 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono tracking-wider dark:text-zinc-400 text-zinc-500 uppercase block">Contact Phone Number (Pre-filled)</label>
                        <input
                          type="tel"
                          required
                          readOnly
                          placeholder="e.g. +234..."
                          value={phone}
                          className="w-full bg-zinc-100 dark:bg-zinc-900 border dark:border-zinc-800 border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-500 dark:text-zinc-500 placeholder-zinc-400 focus:outline-none focus:border-purple-500 transition-all font-mono cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Drag and Drop receipt box */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider dark:text-zinc-400 text-zinc-500 uppercase block">Upload Wire Receipt Screenshot</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isDragOver 
                          ? 'border-purple-500 bg-purple-950/15' 
                          : receiptFile 
                            ? 'border-emerald-500/50 bg-emerald-950/5' 
                            : 'dark:border-zinc-800 border-zinc-300 dark:hover:border-zinc-700 hover:border-zinc-400 dark:bg-zinc-900/20 bg-zinc-50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="receipt-file-input"
                      />
                      <label htmlFor="receipt-file-input" className="cursor-pointer flex flex-col items-center w-full">
                        {receiptFile ? (
                          <>
                            <FileCheck className="w-8 h-8 text-emerald-500 mb-2 animate-bounce" />
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-300">{receiptFile.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-1">Screenshot logged. Drag or click to change.</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mb-2 group-hover:text-purple-500 transition-colors" />
                            <span className="text-xs font-mono dark:text-zinc-300 text-zinc-700">Drag and Drop or Browse files</span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-1">Accepts JPG, PNG receipt screenshots</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="space-y-1.5 pt-1 pb-2">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider">Uploading Dispatch Proof</span>
                        <span className="text-purple-400 font-black">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-zinc-500 font-mono italic">Please keep this page open, uploading large screenshots can take a moment...</p>
                    </div>
                  )}

                  {/* Error handling */}
                  {formError && (
                    <p className="text-xs font-mono text-red-500 font-semibold">{formError}</p>
                  )}

                  {/* Form CTA */}
                  <div className="pt-2 flex justify-between items-center gap-4 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black dark:text-white text-zinc-950">
                        {selectedPass === 'multiple' ? '₦100,000' : '₦25,000'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">LIQUIDATION TOTAL</span>
                    </div>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold tracking-widest uppercase rounded-lg transition-all shadow-lg shadow-purple-500/20 w-full sm:w-auto ${
                        isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      {isUploading ? 'UPLOADING...' : 'SUBMIT DISPATCH PROOF'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Phone Authentication Modal */}
      {isPhoneAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-hidden animate-fade-in">
          <div className="relative w-full max-w-md dark:bg-zinc-950 bg-white border dark:border-purple-500/20 border-purple-200 rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in-up overflow-hidden group">
            <NeonBorder rx={24} ry={24} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/5 blur-3xl rounded-full" />
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setIsPhoneAuthModalOpen(false);
                setAuthPhone('');
                setAuthError('');
              }}
              className="absolute top-4 right-4 p-2 rounded-full dark:bg-zinc-900 bg-zinc-100 hover:dark:bg-purple-950/80 hover:bg-purple-100 text-zinc-600 dark:text-zinc-400 hover:dark:text-purple-400 hover:text-purple-600 transition-all border dark:border-zinc-800 border-zinc-200 cursor-pointer z-20"
              aria-label="Close"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 space-y-6 pt-4">
              <div className="space-y-1.5 text-center">
                <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
                  OWNERSHIP ACCREDITATION
                </span>
                <h3 className="text-xl md:text-2xl font-sans font-black dark:text-white text-zinc-950 uppercase tracking-tight">
                  Gain Owner Access
                </h3>
                <p className="text-xs dark:text-zinc-400 text-zinc-600 font-mono leading-relaxed max-w-xs mx-auto">
                  Enter your phone number to secure your Premium {selectedPass === 'multiple' ? 'Multiple Games Pass' : 'Single Game Pass'} slot or unlock your active control dashboard.
                </p>
              </div>

              <form onSubmit={handleGainAccess} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase block">Active Phone Number</label>
                  <div className="flex rounded-xl bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-800 border-zinc-200 focus-within:border-purple-500 transition-all overflow-hidden items-center px-4">
                    <span className="text-sm font-sans font-black text-purple-600 dark:text-purple-400 select-none mr-2 pr-2 border-r dark:border-zinc-800 border-zinc-200">
                      +234
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 803 112 4589"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="w-full bg-transparent py-3.5 text-sm dark:text-zinc-200 text-zinc-800 placeholder-zinc-500 focus:outline-none font-mono"
                    />
                  </div>
                  <span className="text-[9px] dark:text-zinc-500 text-zinc-400 font-mono block">
                    Supported length: 10 or 11 digits (with or without leading 0).
                  </span>
                </div>

                {authError && (
                  <p className="text-xs text-red-500 font-mono text-center font-semibold">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-mono font-bold tracking-widest uppercase rounded-xl transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group/btn"
                >
                  <span>Gain Owner Access</span>
                  <ChevronDown className="w-4 h-4 -rotate-90 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Super Decorative Pass Selection Modal */}
      {isPassSelectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] dark:bg-zinc-950 bg-white border dark:border-purple-500/20 border-purple-200 rounded-3xl p-4 sm:p-8 md:p-10 shadow-2xl animate-fade-in-up my-auto overflow-hidden flex flex-col">
            <NeonBorder rx={24} ry={24} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/5 blur-3xl rounded-full pointer-events-none" />
            
            {/* Close */}
            <button
              onClick={() => setIsPassSelectionModalOpen(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 px-3 py-1.5 dark:bg-zinc-900 bg-zinc-100 dark:hover:bg-zinc-800 hover:bg-zinc-200 dark:text-zinc-400 text-zinc-600 dark:hover:text-white hover:text-zinc-950 rounded-lg transition-all cursor-pointer z-30 font-mono text-[10px]"
            >
              CANCEL [X]
            </button>

            <div className="relative z-10 flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-6 sm:space-y-8 scrollbar-thin dark:scrollbar-track-zinc-950 scrollbar-thumb-purple-500/50 mt-6 sm:mt-2">
              <div className="space-y-2 text-center max-w-2xl mx-auto">
                <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
                  CHOOSE YOUR ALLOCATION TIER
                </span>
                <h2 className="text-xl sm:text-3xl md:text-4xl font-sans font-black dark:text-white text-zinc-950 uppercase tracking-tight">
                  Select Game Ownership Pass
                </h2>
                <p className="text-xs dark:text-zinc-400 text-zinc-600 font-mono max-w-lg mx-auto leading-relaxed">
                  Every pass guarantees a custom allocated high-availability cluster slot. Differentiate your deployment profile by selecting either the single game or the unlimited master pass.
                </p>
              </div>

              {/* Side-by-Side Super Decorative Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 pb-2">
                {/* Single Pass option */}
                <div 
                  onClick={() => {
                    setSelectedPass('single');
                    setIsPassSelectionModalOpen(false);
                    setIsPurchaseModalOpen(true);
                  }}
                  className="group/card cursor-pointer p-5 sm:p-8 rounded-2xl border dark:bg-zinc-900/40 bg-zinc-50 dark:border-zinc-800 border-zinc-200 hover:dark:border-purple-500/40 hover:border-purple-300 transition-all shadow hover:shadow-purple-500/5 flex flex-col justify-between space-y-4 sm:space-y-6 relative overflow-hidden active:scale-[0.99] text-left"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="p-2 sm:p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                        <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="px-2 sm:px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[9px] font-bold uppercase rounded-full">
                        ₦25,000 / ONCE
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-black dark:text-white text-zinc-950 font-sans group-hover/card:text-purple-500 transition-colors">
                        Single Game Ownership Pass
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-zinc-500 font-mono leading-relaxed">
                        Secure a certified, permanent master deployment license for any one premium HELOLEX game title.
                      </p>
                    </div>

                    <ul className="space-y-2 text-[10px] sm:text-[11px] font-mono dark:text-zinc-400 text-zinc-600 pt-1 sm:pt-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        1x Premium Master Allocation Slot
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        Full Player Monetization Rights
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        Authentic Platinum/Purple Certificate
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        Standard Affiliate Point System Enabled
                      </li>
                    </ul>
                  </div>

                  <button className="w-full py-2.5 sm:py-3 bg-zinc-900 dark:bg-zinc-850 group-hover/card:bg-purple-600 text-zinc-300 group-hover/card:text-white font-mono text-xs font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer">
                    Register for Single Pass
                  </button>
                </div>

                {/* Multiple Pass option */}
                <div 
                  onClick={() => {
                    setSelectedPass('multiple');
                    setIsPassSelectionModalOpen(false);
                    setIsPurchaseModalOpen(true);
                  }}
                  className="group/card cursor-pointer p-5 sm:p-8 rounded-2xl border dark:bg-[#161208]/40 bg-amber-50/20 border-amber-500/20 hover:border-amber-500/60 transition-all shadow hover:shadow-amber-500/5 flex flex-col justify-between space-y-4 sm:space-y-6 relative overflow-hidden active:scale-[0.99] text-left"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center">
                      <div className="p-2 sm:p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-0.5 sm:gap-1">
                        <span className="px-2 sm:px-2.5 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-[9px] font-bold uppercase rounded-full">
                          ₦100,000 / ONCE
                        </span>
                        <span className="text-[8px] font-mono text-amber-500 font-bold uppercase tracking-wider">
                          75% First-Adopter Saving
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base sm:text-lg font-black dark:text-white text-zinc-950 font-sans group-hover/card:text-amber-500 transition-colors">
                          Premium Multiple Games Pass
                        </h3>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-zinc-500 font-mono leading-relaxed">
                        Acquire lifetime master licenses covering ALL five premier games including future rollouts under Helolex.
                      </p>
                    </div>

                    <ul className="space-y-2 text-[10px] sm:text-[11px] font-mono dark:text-zinc-400 text-zinc-600 pt-1 sm:pt-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Infinite Master Game Deployment Slots
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Maximized Revenue Multipliers (+15%)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Exquisite Goldish Minted Certificate
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Double Affiliate Point Power (2x Multiplier)
                      </li>
                    </ul>
                  </div>

                  <button className="w-full py-2.5 sm:py-3 bg-zinc-900 dark:bg-amber-950/40 border border-amber-500/20 group-hover/card:bg-gradient-to-r group-hover/card:from-amber-500 group-hover/card:to-yellow-600 text-amber-500 group-hover/card:text-white font-mono text-xs font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer">
                    Register for Multiple Pass
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Poster Notification Sign-Up Modal */}
      {isNotifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-hidden animate-fade-in">
          <div className="relative w-full max-w-md dark:bg-zinc-950 bg-white border dark:border-purple-500/20 border-purple-200 rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in-up overflow-hidden group">
            <NeonBorder rx={24} ry={24} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/5 blur-3xl rounded-full" />
            
            {/* Close Button */}
            <button
              onClick={() => setIsNotifyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 dark:bg-zinc-900 bg-zinc-100 hover:dark:bg-zinc-800 hover:bg-zinc-200 dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-zinc-950 rounded-lg transition-all cursor-pointer z-20"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 space-y-6 pt-2">
              {!notifySuccess ? (
                <>
                  <div className="space-y-1.5 text-center">
                    <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-purple-600 dark:text-purple-400 font-bold block flex items-center justify-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-purple-500 animate-bounce" /> NOTIFICATION PIPELINE
                    </span>
                    <h3 className="text-xl md:text-2xl font-sans font-black dark:text-white text-zinc-950 uppercase tracking-tight">
                      Track {selectedGameForNotify}
                    </h3>
                    <p className="text-xs dark:text-zinc-400 text-zinc-600 font-mono leading-relaxed max-w-xs mx-auto">
                      Deploying direct telemetry updates to your inbox. Be the first to secure cluster slots when alpha pipelines spin up.
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!notifyEmail) return;
                      // Save subscription locally to simulate real server storage
                      const currentSubs = JSON.parse(localStorage.getItem('helolex_game_notifications') || '[]');
                      currentSubs.push({
                        email: notifyEmail,
                        game: selectedGameForNotify,
                        allGames: notifyOptInAll,
                        subscribedAt: new Date().toISOString()
                      });
                      localStorage.setItem('helolex_game_notifications', JSON.stringify(currentSubs));
                      setNotifySuccess(true);
                    }}
                    className="space-y-4 text-left"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase block">Inbox Destination Address</label>
                      <div className="flex rounded-xl bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-800 border-zinc-200 focus-within:border-purple-500 transition-all overflow-hidden items-center px-4">
                        <Mail className="w-4 h-4 text-purple-500 mr-2 shrink-0" />
                        <input
                          type="email"
                          required
                          placeholder="e.g. pilot@helolex.space"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          className="w-full bg-transparent py-3.5 text-sm dark:text-zinc-200 text-zinc-800 placeholder-zinc-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {/* Selected Game Checkbox */}
                      <label className="flex items-start gap-3 p-3 dark:bg-zinc-900/50 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 rounded-xl cursor-pointer hover:border-purple-500/20 transition-all">
                        <input 
                          type="checkbox" 
                          checked 
                          disabled
                          className="mt-0.5 rounded border-zinc-700 text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0 accent-purple-600" 
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono font-bold dark:text-zinc-200 text-zinc-800 block">
                            Subscribed to: {selectedGameForNotify}
                          </span>
                          <span className="text-[9px] font-mono dark:text-zinc-500 text-zinc-400 block">
                            Receive priority dev logs, alpha/beta access and direct key releases.
                          </span>
                        </div>
                      </label>

                      {/* Ecosystem Checkbox */}
                      <label className="flex items-start gap-3 p-3 dark:bg-zinc-900/30 bg-zinc-50/50 border dark:border-zinc-800/80 border-zinc-200 rounded-xl cursor-pointer hover:border-purple-500/20 transition-all">
                        <input 
                          type="checkbox" 
                          checked={notifyOptInAll}
                          onChange={(e) => setNotifyOptInAll(e.target.checked)}
                          className="mt-0.5 rounded border-zinc-700 text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0 accent-purple-600" 
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono font-medium dark:text-zinc-300 text-zinc-700 block">
                            Include All 5 Game Realms
                          </span>
                          <span className="text-[9px] font-mono dark:text-zinc-500 text-zinc-400 block">
                            Add Solstice Assassin, Helolex Ludo Max, Helolex Sweet Match, Helolex Boaster, and Helolex Road Ball.
                          </span>
                        </div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-mono font-bold tracking-widest uppercase rounded-xl transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>INITIALIZE SUBSCRIPTION</span>
                      <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(168,85,247,0.25)] animate-bounce">
                    <CheckCircle2 className="w-8 h-8 text-purple-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-emerald-400 font-bold block">
                      TELEMETRY LINK SECURED
                    </span>
                    <h3 className="text-xl sm:text-2xl font-sans font-black dark:text-white text-zinc-950 uppercase tracking-tight">
                      Subscription Active
                    </h3>
                    <p className="text-xs dark:text-zinc-400 text-zinc-600 font-mono leading-relaxed max-w-xs mx-auto">
                      A secure notification channel has been registered for <span className="text-purple-400 font-bold">{notifyEmail}</span>.
                    </p>
                  </div>

                  <div className="p-4 dark:bg-zinc-900 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 rounded-xl text-left space-y-2">
                    <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block">Active Dispatches Watchlist:</span>
                    <ul className="space-y-1 font-mono text-[10px] dark:text-zinc-300 text-zinc-700">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{selectedGameForNotify} (Full Track)</span>
                      </li>
                      {notifyOptInAll && gamePosters.filter(g => g.title !== selectedGameForNotify).map(g => (
                        <li key={g.id} className="flex items-center gap-2 opacity-60">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <span>{g.title} (System Broadside)</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => setIsNotifyModalOpen(false)}
                    className="w-full py-3.5 dark:bg-zinc-900 bg-zinc-100 dark:hover:bg-zinc-800 hover:bg-zinc-200 dark:text-zinc-300 text-zinc-700 font-mono text-xs font-bold tracking-widest uppercase rounded-xl transition-all cursor-pointer border dark:border-zinc-800 border-zinc-200"
                  >
                    RETURN TO REALM EXPLORER
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
