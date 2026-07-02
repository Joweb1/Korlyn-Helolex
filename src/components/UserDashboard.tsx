import React, { useState } from 'react';
import { 
  Award, 
  ShieldCheck, 
  TrendingUp, 
  Copy, 
  Share2, 
  Lock, 
  LogOut, 
  User, 
  Mail, 
  Phone, 
  Clock, 
  Coins, 
  Download, 
  Printer, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  FileText,
  Users,
  QrCode,
  Globe,
  MessageCircle,
  Instagram,
  Linkedin,
  Facebook,
  Send,
  Slack,
  Twitter,
  Disc
} from 'lucide-react';
import { UserAccount, PaymentRecord, BankDetails, SocialLink } from '../types';
import NeonBorder from './NeonBorder';
import ThemeToggle from './ThemeToggle';
import { isFirebaseConfigured, uploadReceipt, deleteReceiptByUrl } from '../firebaseClient';
import ImageWithLoader from './ImageWithLoader';
import DashboardSkeleton from './DashboardSkeleton';

const getSocialIcon = (id: string) => {
  switch (id) {
    case 'whatsapp':
      return <MessageCircle className="w-5 h-5 text-emerald-400" />;
    case 'instagram':
      return <Instagram className="w-5 h-5 text-pink-400" />;
    case 'linkedin':
      return <Linkedin className="w-5 h-5 text-blue-400" />;
    case 'telegram':
      return <Send className="w-5 h-5 text-sky-400" />;
    case 'twitter':
      return <Twitter className="w-5 h-5 text-zinc-300" />;
    case 'discord':
      return <Disc className="w-5 h-5 text-indigo-400" />;
    case 'slack':
      return <Slack className="w-5 h-5 text-amber-400" />;
    case 'facebook':
      return <Facebook className="w-5 h-5 text-blue-500" />;
    default:
      return <Globe className="w-5 h-5 text-purple-400" />;
  }
};

const getSocialColorClass = (id: string) => {
  switch (id) {
    case 'whatsapp':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20';
    case 'instagram':
      return 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20';
    case 'linkedin':
      return 'bg-blue-600/10 text-blue-400 border-blue-600/20 hover:bg-blue-600/20';
    case 'telegram':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20';
    case 'twitter':
      return 'bg-zinc-800/20 text-zinc-300 border-zinc-700/50 hover:bg-zinc-800/35';
    case 'discord':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20';
    case 'slack':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20';
    case 'facebook':
      return 'bg-blue-700/10 text-blue-400 border-blue-700/20 hover:bg-blue-700/20';
    default:
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20';
  }
};

interface UserDashboardProps {
  user: UserAccount;
  payment: PaymentRecord | undefined;
  allUsers: UserAccount[];
  allPayments: PaymentRecord[];
  onLogout: () => void;
  onSubmitPayment: (
    email: string,
    phone: string,
    receiptDataUrl: string,
    receiptName: string,
    fullName: string,
    amount?: string,
    passType?: 'single' | 'multiple'
  ) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  bankDetails: BankDetails;
  onUpdateProfile: (fullName: string, email: string) => void;
  socialLinks: SocialLink[];
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export default function UserDashboard({
  user,
  payment,
  allUsers = [],
  allPayments = [],
  onLogout,
  onSubmitPayment,
  theme,
  setTheme,
  bankDetails,
  onUpdateProfile,
  socialLinks = [],
  onRefresh,
  isLoading = false
}: UserDashboardProps) {
  // Form fields for pass registration if not submitted
  const [email, setEmail] = useState(user.email || '');
  const [fullName, setFullName] = useState(user.fullName || '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (err) {
      console.warn('Error refreshing dashboard data:', err);
    } finally {
      // Keep rotating for at least 800ms for a great visual experience
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    }
  };

  // Profile management edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.fullName || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [profileFeedback, setProfileFeedback] = useState('');
  
  // Tab control for approved user workspace
  const [activeSubTab, setActiveSubTab] = useState<'certificate' | 'referrals'>('certificate');

  // Standardized phone helper for matching
  const normalizePhone = (phoneStr: string): string => {
    let clean = phoneStr.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = clean.replace(/^0+/, '');
    }
    if (clean.startsWith('234')) {
      return '+' + clean;
    }
    return '+234' + clean;
  };

  // Keep form fields and edit inputs synchronized with the parent user state
  React.useEffect(() => {
    if (user.fullName) {
      setFullName(user.fullName);
      setEditName(user.fullName);
    }
    if (user.email) {
      setEmail(user.email);
      setEditEmail(user.email);
    }
  }, [user.fullName, user.email]);

  // Generate unique referral link
  const referralLink = `${window.location.origin}/helolex?ref=${encodeURIComponent(user.phone)}`;

  // Copy referral link utility
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Share buttons utilities
  const shareOnWhatsApp = () => {
    const text = `Join me on HELOLEX and secure your Premium Ownership Pass today! Acquire full ownership of premium games and unlock passive player monetization. Use my invitation link: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = `Secure your Premium Ownership Pass on HELOLEX and get full ownership to premium games! Here is my link: ${referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnTelegram = () => {
    const text = `Join me on HELOLEX to secure your Premium Ownership Pass! Here is my link:`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Copy account utility
  const copyAccountNum = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  // File processing
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('File must be an image receipt (PNG, JPG, JPEG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('File size must be under 5MB');
      return;
    }
    setFormError('');
    setReceiptFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setReceiptDataUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle submit form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!receiptDataUrl) {
      setFormError('Please upload your transaction payment receipt image.');
      return;
    }

    setFormError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let finalReceiptUrl = receiptDataUrl;
      if (isFirebaseConfigured() && receiptFile) {
        // If user is uploading a new file, find previous file in the database and delete it first
        if (payment && payment.receiptDataUrl) {
          try {
            console.log('Attempting to delete previous receipt:', payment.receiptDataUrl);
            await deleteReceiptByUrl(payment.receiptDataUrl);
          } catch (deleteError) {
            console.warn('Non-blocking error deleting previous receipt:', deleteError);
          }
        }
        // Upload real file to Firebase Cloud Storage / Cloudinary
        finalReceiptUrl = await uploadReceipt(receiptFile, user.phone, (percent) => {
          setUploadProgress(percent);
        });
      }

      const amt = user.passType === 'multiple' ? '₦100,000' : '₦25,000';
      await onSubmitPayment(
        email.trim(), 
        user.phone, 
        finalReceiptUrl, 
        receiptFile?.name || 'receipt_screenshot.png', 
        fullName.trim(),
        amt,
        user.passType || 'single'
      );
      setFormSuccess(true);
    } catch (uploadErr: any) {
      console.warn(uploadErr);
      setFormError(uploadErr?.message || 'Failed to upload receipt file to Cloudinary. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle profile update save
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileFeedback('Full Name is required.');
      return;
    }
    onUpdateProfile(editName.trim(), editEmail.trim());
    setProfileFeedback('Profile updated successfully!');
    setIsEditingProfile(false);
    setTimeout(() => setProfileFeedback(''), 3000);
  };

  // Print/Download Certificate Action
  const handlePrintCertificate = () => {
    const url = `${window.location.origin}/print-certificate?phone=${encodeURIComponent(user.phone)}`;
    window.open(url, '_blank');
  };

  // Determine current status
  const status = payment ? payment.status : 'unsubmitted';

  return (
    <div className="min-h-screen dark:bg-[#05070B] bg-[#FAFAFC] dark:text-zinc-300 text-zinc-700 transition-colors duration-300 relative pb-20">
      
      {/* Decorative grids */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <svg className="w-full h-full opacity-30 dark:opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dashboard-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40,0 L0,0 0,40" className="stroke-zinc-200 dark:stroke-zinc-900/40" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dashboard-grid)" />
        </svg>
      </div>

      {/* Top Header */}
      <nav className="sticky top-0 z-40 dark:bg-[#05070B]/95 bg-white/95 backdrop-blur-md border-b dark:border-purple-500/10 border-zinc-200 px-4 md:px-8 py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-1.5 font-bold dark:text-white text-zinc-950 tracking-[0.25em]">
            <span className="text-purple-600 dark:text-purple-500 font-extrabold text-lg">H</span>
            <span className="text-sm tracking-wider uppercase font-sans">HELOLEX</span>
            <span className="text-[9px] font-mono font-bold dark:bg-purple-950 bg-purple-50 px-2 py-0.5 rounded border dark:border-purple-500/20 border-purple-200 text-purple-600 dark:text-purple-400">
              OWNER HUB
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onChange={setTheme} />
            {onRefresh && (
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing || isLoading}
                className="flex items-center justify-center p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/80 hover:dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 hover:dark:text-white transition-all border dark:border-purple-500/10 border-zinc-200 cursor-pointer disabled:opacity-50"
                title="Refresh database records"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/80 hover:dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 hover:dark:text-white rounded-lg text-xs font-mono tracking-wider transition-all border dark:border-purple-500/10 border-zinc-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Layout */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Card & Navigation Desk (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Welcome User Account Card */}
          <div className="dark:bg-zinc-950/80 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <NeonBorder rx={24} ry={24} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/5 blur-3xl rounded-full" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 p-[2px] shadow-lg shadow-purple-500/10">
                <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center text-white font-sans font-black text-xl">
                  {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'HL'}
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-sans font-black dark:text-white text-zinc-950 tracking-tight flex items-center gap-1.5">
                  {user.fullName || 'HELOLEX Owner'}
                  {status === 'approved' && <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />}
                </h2>
                <p className="text-xs text-zinc-500 font-mono tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3 text-purple-500 shrink-0" />
                  {user.phone}
                </p>
              </div>
            </div>

            {/* Ownership Tier Indicator Badge */}
            <div className={`mt-4 px-3 py-2 rounded-xl border flex items-center justify-between ${
              user.passType === 'multiple'
                ? 'dark:bg-amber-950/20 bg-amber-50 border-amber-200/50 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
                : 'dark:bg-purple-950/20 bg-purple-50 border-purple-200/50 dark:border-purple-500/20 text-purple-700 dark:text-purple-400'
            }`}>
              <span className="text-[9px] font-mono tracking-wider font-bold uppercase">Ownership Tier</span>
              <span className="text-xs font-sans font-black uppercase flex items-center gap-1">
                {user.passType === 'multiple' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Multiple Games Pass
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    Single Game Pass
                  </>
                )}
              </span>
            </div>

            {/* Verification Status Banner */}
            <div className="mt-6 pt-6 border-t dark:border-zinc-900 border-zinc-200 space-y-4">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase block">License Allocation Status</span>
              
              {status === 'unsubmitted' && (
                <div className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-500">
                  <AlertCircle className="w-5 h-5 shrink-0 animate-pulse" />
                  <div className="text-xs font-mono leading-relaxed">
                    <span className="font-bold block uppercase text-[10px]">PASS NOT CLAIMED</span>
                    Submit payment details below to claim yours.
                  </div>
                </div>
              )}

              {status === 'pending' && (
                <div className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl text-purple-500">
                  <Clock className="w-5 h-5 shrink-0 animate-spin" />
                  <div className="text-xs font-mono leading-relaxed">
                    <span className="font-bold block uppercase text-[10px]">PENDING VERIFICATION</span>
                    Allocating cluster node. Reviewing receipt.
                  </div>
                </div>
              )}

              {status === 'approved' && (
                <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-500">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div className="text-xs font-mono leading-relaxed">
                    <span className="font-bold block uppercase text-[10px] text-emerald-400">OWNERSHIP APPROVED</span>
                    Ownership ID: <span className="text-white font-bold">{payment?.ownershipId}</span>
                  </div>
                </div>
              )}

              {status === 'rejected' && (
                <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <div className="text-xs font-mono leading-relaxed">
                    <span className="font-bold block uppercase text-[10px]">RECEIPT REJECTED</span>
                    Please resubmit genuine payment proof below.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Stats & Credit Points Ledger */}
          <div className="dark:bg-zinc-950/80 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-bold tracking-[0.2em] dark:text-zinc-400 text-zinc-500 uppercase mb-4 font-mono flex items-center justify-between">
              <span>PROMO LEDGER & POINTS</span>
              <Coins className="w-4 h-4 text-amber-500" />
            </h3>

            {/* Glowing Points Card */}
            <div className="p-4 bg-gradient-to-r from-purple-900/10 to-blue-900/10 border dark:border-purple-500/20 border-purple-200 rounded-2xl flex items-center justify-between mb-6 shadow-lg shadow-purple-500/5">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono dark:text-purple-400 text-purple-700 tracking-wider font-bold block">CREDIT REWARD POINTS</span>
                <span className="text-3xl font-sans font-black dark:text-white text-zinc-950">{user.points} <span className="text-xs font-medium font-mono text-zinc-500">pts</span></span>
              </div>
              <div className="p-3 bg-purple-500/10 dark:bg-purple-950/60 border border-purple-500/20 rounded-xl text-purple-500">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            {/* Point Rules Table */}
            <div className="space-y-2.5 font-mono text-[11px] mb-6 border-b dark:border-zinc-900 border-zinc-100 pb-5">
              <span className="text-[10px] text-zinc-500 tracking-wider uppercase block mb-1.5">Point Accrual Metrics</span>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Referral Link Clicked</span>
                <span className="dark:text-zinc-300 text-zinc-700 font-bold">+1 Point</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Phone Account Registered</span>
                <span className="dark:text-zinc-300 text-zinc-700 font-bold">+2 Points</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Approved Pass Purchased</span>
                <span className="dark:text-emerald-400 text-emerald-600 font-bold">+5 Points</span>
              </div>
            </div>

            {/* Promo Live Status Indicators */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 dark:bg-zinc-900 bg-zinc-50 rounded-xl border dark:border-zinc-900 border-zinc-200/60">
                <span className="text-[10px] text-zinc-500 font-mono block">CLICKS</span>
                <span className="text-lg font-black dark:text-zinc-200 text-zinc-800 font-sans block mt-1">{user.clicksCount}</span>
              </div>
              <div className="p-2.5 dark:bg-zinc-900 bg-zinc-50 rounded-xl border dark:border-zinc-900 border-zinc-200/60">
                <span className="text-[10px] text-zinc-500 font-mono block">REGISTERS</span>
                <span className="text-lg font-black dark:text-zinc-200 text-zinc-800 font-sans block mt-1">{user.registrationsCount}</span>
              </div>
              <div className="p-2.5 dark:bg-zinc-900 bg-zinc-50 rounded-xl border dark:border-zinc-900 border-zinc-200/60">
                <span className="text-[10px] text-zinc-500 font-mono block">SALES</span>
                <span className="text-lg font-black dark:text-emerald-400 text-emerald-600 font-sans block mt-1">{user.purchasesCount}</span>
              </div>
            </div>
          </div>

          {/* Profile Management Card */}
          <div className="dark:bg-zinc-950/80 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-bold tracking-[0.2em] dark:text-zinc-400 text-zinc-500 uppercase mb-4 font-mono">
              PROFILE SETTINGS
            </h3>

            {isEditingProfile ? (
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border dark:border-zinc-800 border-zinc-200 rounded-lg p-2 text-zinc-900 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border dark:border-zinc-800 border-zinc-200 rounded-lg p-2 text-zinc-900 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 font-mono text-xs pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold uppercase"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-2 border-b dark:border-zinc-900 border-zinc-100 pb-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">FullName</span>
                    <span className="dark:text-zinc-300 text-zinc-700 font-bold">{user.fullName || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Email</span>
                    <span className="dark:text-zinc-300 text-zinc-700 font-bold truncate max-w-[150px]">{user.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Registered</span>
                    <span className="dark:text-zinc-400 text-zinc-600">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {profileFeedback && (
                  <p className="text-[10px] text-emerald-400 text-center font-bold">
                    {profileFeedback}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 hover:dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 font-bold tracking-wider uppercase rounded-xl transition-all border dark:border-zinc-900 border-zinc-200 text-center text-xs block"
                >
                  Manage Profile Info
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Primary Functional Panel (Col 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section 1: Referral Promotion Campaign (Only for approved owners) */}
          {status === 'approved' ? (
            <div className="dark:bg-zinc-950/80 bg-white border-2 dark:border-purple-500/30 border-purple-200 rounded-3xl p-8 shadow-[0_0_50px_rgba(139,92,246,0.1)] relative overflow-hidden group">
              <NeonBorder lines={2} />
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
                      PROMOTIONAL CAMPAIGN DESK
                    </span>
                    <h3 className="text-xl sm:text-2xl font-sans font-black dark:text-white text-zinc-950 tracking-tight">
                      Share Your Link &amp; Accrue Points
                    </h3>
                  </div>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-xl border dark:border-purple-500/20 border-purple-200 text-purple-600 dark:text-purple-400 animate-bounce">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <p className="text-xs dark:text-zinc-400 text-zinc-600 leading-relaxed max-w-2xl font-mono">
                  As an approved Premium Owner, you hold master referral capabilities. Share your unique link below via social platforms. Your points accumulate instantly inside your ledger as visitors interact, register and purchase licenses.
                </p>

                {/* Referral Link Box */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block">Your Custom Referral Link</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="flex-1 bg-zinc-100 dark:bg-zinc-900 border dark:border-zinc-800 border-zinc-200 rounded-xl px-4 py-3 font-mono text-xs text-zinc-900 dark:text-zinc-200 select-all"
                    />
                    <button
                      type="button"
                      onClick={copyReferralLink}
                      className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Social Share Buttons */}
                <div className="pt-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block mb-3">Quick Social Broadcast</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={shareOnWhatsApp}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow"
                    >
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={shareOnTwitter}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-900 hover:dark:bg-zinc-800 border dark:border-zinc-800 border-zinc-200 text-zinc-950 dark:text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow"
                    >
                      <span>X (Twitter)</span>
                    </button>
                    <button
                      onClick={shareOnTelegram}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow"
                    >
                      <span>Telegram</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* Informative state: Tell them why link is not unlocked */
            <div className="dark:bg-zinc-950/40 bg-zinc-100/50 border dark:border-zinc-900 border-zinc-200/80 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex gap-4 items-start text-xs font-mono">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 text-zinc-500">
                  <h4 className="font-bold dark:text-zinc-300 text-zinc-800 uppercase text-[10px] tracking-wider">Referral Campaign Locked</h4>
                  <p className="leading-relaxed">
                    The Promotion Campaign Desk and your custom referral link will unlock immediately once your Premium Ownership Pass is approved by our corporate treasury. Complete payment below to start.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tabs Selection (for approved owners) */}
          {status === 'approved' && (
            <div className="flex flex-wrap gap-2 p-1.5 dark:bg-zinc-950 bg-white rounded-2xl border dark:border-zinc-900 border-zinc-250 w-fit no-print">
              <button
                type="button"
                onClick={() => setActiveSubTab('certificate')}
                className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeSubTab === 'certificate'
                    ? 'dark:bg-purple-950/60 bg-purple-50 dark:text-purple-400 text-purple-700 shadow-sm border dark:border-purple-500/20 border-purple-200'
                    : 'text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-800'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('qrcode')}
                className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeSubTab === 'qrcode'
                    ? 'dark:bg-purple-950/60 bg-purple-50 dark:text-purple-400 text-purple-700 shadow-sm border dark:border-purple-500/20 border-purple-200'
                    : 'text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Verification QR</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('referrals')}
                className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeSubTab === 'referrals'
                    ? 'dark:bg-purple-950/60 bg-purple-50 dark:text-purple-400 text-purple-700 shadow-sm border dark:border-purple-500/20 border-purple-200'
                    : 'text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Referral Network ({allUsers.filter(u => u.referredBy && normalizePhone(u.referredBy) === normalizePhone(user.phone)).length})</span>
              </button>
            </div>
          )}

          {/* Section 2: Conditional Render (Certificate, QR Code, or Referrals) */}
          {(status !== 'approved' || activeSubTab === 'certificate') ? (
            /* Section 2a: Certificate Viewer Panel (Print/Download ready, blurred if not approved) */
            <div className="dark:bg-zinc-950/80 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block">Digital Master Document</span>
                  <h3 className="text-xl font-sans font-black dark:text-white text-zinc-900 tracking-tight">Sovereign Ownership Certificate</h3>
                </div>
                
                {status === 'approved' && (
                  <div className="flex gap-2 no-print">
                    <button
                      onClick={handlePrintCertificate}
                      className="p-2 dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-200 rounded-xl hover:text-purple-500 transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono uppercase"
                      title="Print Certificate"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Certificate Display Area */}
              <div className="relative">
                
                {/* Blur and overlay if not approved */}
                {status !== 'approved' && (
                  <div className="absolute inset-0 z-20 backdrop-blur-[8px] bg-white/20 dark:bg-black/40 flex flex-col items-center justify-center text-center p-6 rounded-2xl">
                    <div className="w-12 h-12 rounded-full dark:bg-zinc-950/90 bg-white border dark:border-zinc-900 border-zinc-200 shadow flex items-center justify-center text-zinc-400 mb-4 animate-bounce">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-sans font-black dark:text-white text-zinc-900 uppercase tracking-widest">Certificate Locked</h4>
                    <p className="text-xs text-zinc-500 font-mono mt-2 max-w-sm leading-relaxed">
                      This official A4 metallic-embossed landscape certificate is only minted for validated owners. Once approved, the document renders dynamically here.
                    </p>
                  </div>
                )}

                {/* The gorgeous landscape certificate */}
                {(() => {
                  const isMultiple = user.passType === 'multiple' || payment?.passType === 'multiple' || payment?.amount === '₦100,000';
                  const holderName = user.fullName || payment?.fullName || payment?.receiptName.replace(/\..+$/, '').replace(/_/g, ' ') || 'HELOLEX OWNER';
                  const holderPhone = user.phone || payment?.phone || '';
                  const deedId = payment?.ownershipId || 'HLX-PENDING';
                  const issueDate = payment?.issueDate || payment?.submittedAt?.split('T')[0] || new Date().toISOString().split('T')[0];

                  return (
                    <div 
                      id="certificate-print-area"
                      className={`relative w-full aspect-[1.414/1] rounded-xl p-6 sm:p-12 text-center flex flex-col justify-between overflow-hidden border-[8px] sm:border-[12px] transition-all ${
                        isMultiple
                          ? 'bg-[#120F08] border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]'
                          : 'bg-[#0B0C12] border-purple-500/20 shadow-[0_0_50px_rgba(139,92,246,0.05)]'
                      }`}
                    >
                      {/* Ambient inner gradient */}
                      <div className={`absolute inset-0 opacity-15 pointer-events-none ${
                        isMultiple 
                          ? 'bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.1)_0%,_transparent_70%)]' 
                          : 'bg-[radial-gradient(circle_at_center,_rgba(147,51,234,0.1)_0%,_transparent_70%)]'
                      }`} />

                      {/* Vintage borders */}
                      <div className={`absolute inset-2 border m-1 pointer-events-none rounded ${isMultiple ? 'border-amber-500/10' : 'border-purple-500/10'}`} />
                      <div className={`absolute inset-4 border m-1 pointer-events-none rounded ${isMultiple ? 'border-amber-500/5' : 'border-purple-500/5'}`} />

                      {/* Corner decorations */}
                      <div className={`absolute top-0 left-0 w-6 h-6 border-t-[2px] border-l-[2px] m-4 pointer-events-none ${isMultiple ? 'border-amber-500/30' : 'border-purple-500/30'}`} />
                      <div className={`absolute top-0 right-0 w-6 h-6 border-t-[2px] border-r-[2px] m-4 pointer-events-none ${isMultiple ? 'border-amber-500/30' : 'border-purple-500/30'}`} />
                      <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-[2px] border-l-[2px] m-4 pointer-events-none ${isMultiple ? 'border-amber-500/30' : 'border-purple-500/30'}`} />
                      <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-[2px] border-r-[2px] m-4 pointer-events-none ${isMultiple ? 'border-amber-500/30' : 'border-purple-500/30'}`} />

                      {/* Huge Watermark Letter "H" */}
                      <div className={`absolute inset-0 flex items-center justify-center opacity-[0.01] select-none pointer-events-none text-[18rem] font-black ${isMultiple ? 'text-amber-500' : 'text-purple-500'}`}>
                        H
                      </div>

                      {/* Header / Brand */}
                      <div className="relative z-10 flex flex-col items-center">
                        <span className={`text-[8px] sm:text-[10px] font-mono tracking-[0.4em] font-bold uppercase ${isMultiple ? 'text-amber-500' : 'text-purple-400'}`}>
                          HELOLEX GAMING OWNERSHIP
                        </span>
                        <h1 className={`text-base sm:text-3xl font-sans font-black tracking-wide uppercase mt-1 ${isMultiple ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200' : 'text-white'}`}>
                          {isMultiple ? 'Multiple Games Ownership License' : 'Game Ownership License'}
                        </h1>
                        
                        {/* Centered brand-aligned License Tier Badge */}
                        <div className="mt-1 flex items-center justify-center">
                          <span className={`px-3 py-1 rounded-full text-[7px] sm:text-[9px] font-mono tracking-widest uppercase font-black border ${
                            isMultiple 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}>
                            License Tier: {isMultiple ? 'Multiple Game Pass (VIP Lifetime)' : 'Single Game Pass (Standard Lifetime)'}
                          </span>
                        </div>

                        <div className={`w-20 sm:w-32 h-[1px] mx-auto mt-2 ${isMultiple ? 'bg-amber-500/20' : 'bg-purple-500/20'}`} />
                      </div>

                      {/* Recipient Details */}
                      <div className="relative z-10 my-4 space-y-1">
                        <span className="text-[8px] sm:text-[9px] font-mono text-zinc-600 uppercase tracking-widest block">
                          Conferred to
                        </span>
                        <h2 className={`text-lg sm:text-2xl font-sans font-black tracking-wide uppercase ${isMultiple ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-100' : 'text-white'}`}>
                          {holderName}
                        </h2>
                        <p className="text-[8px] sm:text-[9px] font-mono text-zinc-500">
                          Registered Phone ID: <span className={isMultiple ? 'text-amber-500' : 'text-purple-400'}>{holderPhone}</span>
                        </p>
                      </div>

                      {/* Bottom Grid: ID, Seal, Signature */}
                      <div className="relative z-10 grid grid-cols-3 items-end gap-2 pt-4 border-t border-zinc-900">
                        {/* Metadata */}
                        <div className="text-left font-mono text-[8px] sm:text-[10px] text-zinc-500 space-y-1">
                          <div>
                            <span className="uppercase tracking-widest block text-[7px] text-zinc-600">Deed Code</span>
                            <span className={`font-bold ${isMultiple ? 'text-amber-400' : 'text-purple-400'}`}>{deedId}</span>
                          </div>
                          <div>
                            <span className="uppercase tracking-widest block text-[7px] text-zinc-600">Date Issued</span>
                            <span className="text-zinc-400">{issueDate}</span>
                          </div>
                        </div>

                        {/* Official Seal */}
                        <div className="flex flex-col items-center justify-center">
                          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full p-[1px] flex items-center justify-center ${
                            isMultiple
                              ? 'bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600'
                              : 'bg-gradient-to-br from-zinc-300 via-purple-500 to-zinc-500'
                          }`}>
                            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                              {isMultiple ? (
                                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500" />
                              ) : (
                                <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Authorized signature */}
                        <div className="text-right flex flex-col items-end">
                          <div className="font-mono text-right mb-0.5">
                            <span className={`text-[10px] sm:text-sm italic font-serif ${isMultiple ? 'text-amber-400' : 'text-purple-400'}`}>
                              HELOLEX LABS
                            </span>
                            <div className="w-16 sm:w-24 h-[1px] bg-zinc-900" />
                          </div>
                          <span className="text-[6px] sm:text-[8px] font-mono text-zinc-600 uppercase tracking-widest block">
                            Authorized Sign
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : activeSubTab === 'qrcode' ? (
            /* Section 2c: Mobile Verification QR Code Panel */
            <div className="dark:bg-zinc-950/80 bg-white border-2 dark:border-purple-500/30 border-purple-200 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(139,92,246,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full pointer-events-none" />
              <NeonBorder rx={24} ry={24} />

              <div className="relative z-10 space-y-6">
                <div className="text-center sm:text-left space-y-1.5 border-b dark:border-zinc-900 border-zinc-150 pb-5">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-purple-600 dark:text-purple-400 uppercase font-bold block">
                    Sovereign Title Validation
                  </span>
                  <h3 className="text-xl font-sans font-black dark:text-white text-zinc-900 tracking-tight">
                    MOBILE VERIFICATION QR CODE
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                    This encrypted title signature allows instant scan validation via corporate mobile nodes. Present this QR code on your mobile device to verify authenticated game license ownership.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-4">
                  {/* QR Scan Target Area */}
                  <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/40 dark:bg-zinc-950/40 border dark:border-zinc-900 border-zinc-200 rounded-2xl relative w-full max-w-[280px]">
                    {/* Scan target corners */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-purple-500/50" />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-purple-500/50" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-purple-500/50" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-purple-500/50" />

                    {/* QR Code Frame */}
                    <div className="p-3 bg-white rounded-xl shadow-lg shadow-purple-500/5 hover:scale-[1.02] transition-transform duration-300">
                      <ImageWithLoader 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          JSON.stringify({
                            owner: user.fullName || 'HELOLEX Owner',
                            id: payment?.ownershipId,
                            email: user.email,
                            phone: user.phone,
                            tier: user.passType === 'multiple' ? 'Multiple' : 'Single',
                            verified: true,
                            timestamp: payment?.submittedAt
                          })
                        )}`}
                        alt={`QR Code for ${payment?.ownershipId}`} 
                        className="w-40 h-40 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 dark:text-emerald-400 text-[9px] font-mono tracking-wider font-bold uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                      VERIFIED DIGITAL TITLE
                    </div>
                  </div>

                  {/* Comprehensive Metadata Checklist */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 border dark:border-zinc-900 border-zinc-150 rounded-2xl p-5 space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center border-b dark:border-zinc-900/50 border-zinc-100 pb-2.5">
                        <span className="text-zinc-500 font-bold">REGISTRY STATUS</span>
                        <span className="text-emerald-500 font-black tracking-wider uppercase">AUTHENTICATED</span>
                      </div>
                      <div className="flex justify-between items-center border-b dark:border-zinc-900/50 border-zinc-100 pb-2.5">
                        <span className="text-zinc-500">OWNERSHIP KEY</span>
                        <span className="dark:text-white text-zinc-900 font-black tracking-wider">{payment?.ownershipId}</span>
                      </div>
                      <div className="flex justify-between items-center border-b dark:border-zinc-900/50 border-zinc-100 pb-2.5">
                        <span className="text-zinc-500">LICENSED HOLDER</span>
                        <span className="dark:text-zinc-300 text-zinc-700 font-bold truncate max-w-[180px]">{user.fullName || 'Not Provided'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b dark:border-zinc-900/50 border-zinc-100 pb-2.5">
                        <span className="text-zinc-500">VERIFICATION PHONE</span>
                        <span className="dark:text-zinc-300 text-zinc-700 font-bold">{user.phone}</span>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-zinc-500">ALLOCATION TIER</span>
                        <span className={`font-black uppercase ${user.passType === 'multiple' ? 'text-amber-500' : 'text-purple-500'}`}>
                          {user.passType === 'multiple' ? 'MULTIPLE PASS (VIP)' : 'SINGLE GAME PASS'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1 font-mono text-xs">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(payment?.ownershipId || '');
                        }}
                        className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 hover:dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 hover:dark:text-white border dark:border-zinc-850 border-zinc-200 rounded-xl transition-all cursor-pointer font-bold text-center"
                      >
                        COPY LICENSE ID
                      </button>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/print-certificate?phone=${encodeURIComponent(user.phone)}`;
                          window.open(url, '_blank');
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl transition-all font-bold tracking-wider uppercase shadow-md shadow-purple-500/10 text-center cursor-pointer"
                      >
                        VALIDATE REPORT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Section 2b: Referred Users Network Panel */
            <div className="dark:bg-zinc-950/80 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full" />
              <NeonBorder rx={24} ry={24} />
              
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b dark:border-zinc-900 border-zinc-150 pb-5 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block">Affiliate Ledger Network</span>
                    <h3 className="text-xl font-sans font-black dark:text-white text-zinc-900 tracking-tight">Your Referred Owners</h3>
                  </div>
                  <div className="p-2.5 dark:bg-zinc-900 bg-zinc-50 border dark:border-zinc-900 border-zinc-200 rounded-xl font-mono text-xs flex items-center gap-1.5 font-bold self-start sm:self-auto">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="dark:text-zinc-400 text-zinc-500">Total Referred:</span>
                    <span className="text-purple-600 dark:text-purple-400 text-sm font-black">
                      {allUsers.filter(u => u.referredBy && normalizePhone(u.referredBy) === normalizePhone(user.phone)).length}
                    </span>
                  </div>
                </div>

                {/* Referrals list */}
                {(() => {
                  const referred = allUsers.filter(u => u.referredBy && normalizePhone(u.referredBy) === normalizePhone(user.phone));
                  
                  if (referred.length === 0) {
                    return (
                      <div className="text-center py-16 border border-dashed dark:border-zinc-800 border-zinc-200 rounded-2xl space-y-3">
                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900/60 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-mono font-bold dark:text-zinc-300 text-zinc-700 uppercase">No Referrals Registered Yet</h4>
                        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed max-w-sm mx-auto">
                          Share your custom promotion link. You accrue +2 points instantly when they register and +5 points once their pass is approved!
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b dark:border-zinc-900 border-zinc-200 font-mono text-[10px] uppercase text-zinc-500">
                            <th className="py-3 px-2">Owner Profile</th>
                            <th className="py-3 px-2">Phone</th>
                            <th className="py-3 px-2">Joined Date</th>
                            <th className="py-3 px-2 text-center">Pass Status</th>
                            <th className="py-3 px-2 text-right">Points Gained</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-zinc-900/40 divide-zinc-100">
                          {referred.map((u, index) => {
                            const refPayment = allPayments.find(p => normalizePhone(p.phone) === normalizePhone(u.phone));
                            const itemStatus = refPayment ? refPayment.status : 'unsubmitted';
                            
                            return (
                              <tr key={index} className="font-mono text-xs hover:dark:bg-zinc-900/30 hover:bg-zinc-50/55 transition-colors">
                                <td className="py-4 px-2">
                                  <div className="font-sans font-bold dark:text-white text-zinc-900">
                                    {u.fullName || 'Anonymous Registrant'}
                                  </div>
                                  <div className="text-[9px] text-zinc-400 truncate max-w-[150px]">
                                    {u.email || 'No email shared'}
                                  </div>
                                </td>
                                <td className="py-4 px-2 dark:text-zinc-300 text-zinc-700">
                                  {u.phone}
                                </td>
                                <td className="py-4 px-2 text-zinc-500">
                                  {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="py-4 px-2 text-center">
                                  {itemStatus === 'approved' ? (
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-bold uppercase border border-emerald-500/20">
                                      Approved
                                    </span>
                                  ) : itemStatus === 'pending' ? (
                                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded text-[9px] font-bold uppercase border border-purple-500/20">
                                      Pending
                                    </span>
                                  ) : itemStatus === 'rejected' ? (
                                    <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[9px] font-bold uppercase border border-red-500/20">
                                      Rejected
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-zinc-500/10 text-zinc-400 rounded text-[9px] font-bold uppercase border border-zinc-200/50 dark:border-zinc-800">
                                      Registered
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-2 text-right font-black text-purple-600 dark:text-purple-400">
                                  {itemStatus === 'approved' ? '+7' : '+2'} pts
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

          {/* Section 3: Ownership License Pass Card / Purchase Form */}
          {status !== 'approved' && (
            <div className="dark:bg-zinc-950/80 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
              
              <div className="mb-6 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-purple-600 dark:text-purple-400 uppercase font-bold block">
                  SUBMIT PROOF OF ACQUISITION
                </span>
                <h3 className="text-xl font-sans font-black dark:text-white text-zinc-900 tracking-tight">
                  {status === 'unsubmitted' ? 'Secure Your Slot Now' : 'Update Transaction Receipt'}
                </h3>
                <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                  Transfer the <span className="text-purple-500 font-bold font-mono">{user.passType === 'multiple' ? '₦100,000' : '₦25,000'}</span> one-time fee to our treasury bank below for your <span className="font-bold">{user.passType === 'multiple' ? 'Multiple Games Ownership Pass' : 'Single Game Ownership Pass'}</span>, capture a clear screenshot of your transaction, and submit it below to register your license.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Bank details side */}
                <div className="md:col-span-5 bg-zinc-50 dark:bg-[#0B1020]/25 border dark:border-zinc-900 border-zinc-200/80 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase block">Corporate Treasury Bank</span>
                  
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Bank Name</span>
                      <span className="dark:text-zinc-200 text-zinc-800 font-bold block mt-0.5">{bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Account Name</span>
                      <span className="dark:text-zinc-200 text-zinc-800 font-bold block mt-0.5">{bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Account Number</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">{bankDetails.accountNumber}</span>
                        <button
                          type="button"
                          onClick={copyAccountNum}
                          className="p-1 text-zinc-400 hover:text-purple-500 transition-colors"
                          title="Copy Account Number"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {copiedAccount && (
                        <span className="text-[9px] text-emerald-400 block mt-1">Copied!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Proof submit form */}
                <form onSubmit={handleFormSubmit} className="md:col-span-7 space-y-4">
                  
                  {formSuccess ? (
                    <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center space-y-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                        <CheckCircle2 className="w-5 h-5 animate-bounce" />
                      </div>
                      <h4 className="text-sm font-sans font-black text-emerald-400 uppercase">Receipt Submitted successfully</h4>
                      <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                        Our compliance desk is reviewing your payment and allocating your custom game node. Approval takes 5-15 minutes.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormSuccess(false);
                          setReceiptFile(null);
                          setReceiptDataUrl('');
                        }}
                        className="py-1.5 px-3 bg-zinc-200 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 rounded-lg text-xs font-mono"
                      >
                        Submit another
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 font-mono text-xs">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase block mb-1">Owner Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Marcus Vance"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-800 border-zinc-200/80 rounded-xl p-3 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-purple-500 transition-all placeholder-zinc-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase block mb-1">Owner Contact Email</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. name@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-800 border-zinc-200/80 rounded-xl p-3 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-purple-500 transition-all placeholder-zinc-500"
                          />
                        </div>

                        {/* File Upload Box with drag & drop */}
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase block mb-1">Upload Payment Screenshot / Receipt</label>
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragOver(true);
                            }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragOver(false);
                              if (e.dataTransfer.files?.[0]) {
                                handleFileChange(e.dataTransfer.files[0]);
                              }
                            }}
                            onClick={() => document.getElementById('dashboard-file-upload')?.click()}
                            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                              isDragOver 
                                ? 'border-purple-500 bg-purple-500/5' 
                                : receiptFile 
                                ? 'border-emerald-500/30 bg-emerald-500/5' 
                                : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:border-purple-500/40'
                            }`}
                          >
                            <input
                              type="file"
                              id="dashboard-file-upload"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                              className="hidden"
                            />
                            
                            <div className="space-y-2">
                              {receiptFile ? (
                                <div className="text-emerald-500 space-y-1.5">
                                  <CheckCircle2 className="w-8 h-8 mx-auto" />
                                  <p className="font-bold text-xs truncate max-w-[200px] mx-auto">{receiptFile.name}</p>
                                  <p className="text-[9px] text-zinc-500">File loaded successfully. Tap to change.</p>
                                </div>
                              ) : (
                                <div className="text-zinc-500 space-y-2">
                                  <UploadCloud className="w-8 h-8 mx-auto text-purple-500" />
                                  <p className="font-bold text-xs">Drag &amp; Drop receipt here or click to browse</p>
                                  <p className="text-[9px]">Supports PNG, JPG, JPEG under 5MB</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {isUploading && (
                        <div className="space-y-1.5 pt-1 pb-2">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-400 font-bold uppercase tracking-wider">Uploading Payment Receipt</span>
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

                      {formError && (
                        <p className="text-xs text-red-500 font-mono text-center">
                          {formError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isUploading}
                        className={`w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Uploading to Cloud Storage...
                          </>
                        ) : (
                          'Submit Verification Proof'
                        )}
                      </button>
                    </>
                  )}
                </form>

              </div>
            </div>
          )}

          {/* Join Social Community Section */}
          <div className="dark:bg-zinc-950/80 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden mt-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-blue-500/5 blur-3xl rounded-full" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-purple-600 dark:text-purple-400 font-bold block">
                    GLOBAL COMMUNITY NETWORK
                  </span>
                  <h3 className="text-xl sm:text-2xl font-sans font-black dark:text-white text-zinc-950 tracking-tight">
                    Join Our Social Channels
                  </h3>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-xl border dark:border-purple-500/20 border-purple-200 text-purple-600 dark:text-purple-400">
                  <Globe className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              <p className="text-xs dark:text-zinc-400 text-zinc-600 leading-relaxed max-w-2xl font-mono">
                Connect with thousands of gamers, creators, and platform nodes. Share strategies, claim promos, and receive real-time server diagnostics directly from our decentralized guild chambers.
              </p>

              {/* Grid of enabled social links */}
              {socialLinks.filter(link => link.enabled).length === 0 ? (
                <div className="text-center py-6 border border-dashed dark:border-zinc-900 border-zinc-200 rounded-2xl">
                  <p className="text-xs text-zinc-500 font-mono">No active social channels configured by administrator.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {socialLinks.filter(link => link.enabled).map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 group/btn ${getSocialColorClass(link.id)}`}
                    >
                      <div className="shrink-0 transition-transform duration-300 group-hover/btn:scale-110">
                        {getSocialIcon(link.id)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-sans font-bold text-xs truncate block text-zinc-800 dark:text-zinc-200 group-hover/btn:text-black group-hover/btn:dark:text-white">
                          {link.name}
                        </span>
                        <span className="font-mono text-[9px] text-zinc-500 block truncate group-hover/btn:text-zinc-600 group-hover/btn:dark:text-zinc-400">
                          Join channel
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover/btn:opacity-100 transition-opacity shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
      )}

    </div>
  );
}
