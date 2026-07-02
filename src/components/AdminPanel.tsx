import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Award, 
  ArrowLeft, 
  FileText, 
  Activity,
  User,
  ShieldAlert,
  Search,
  ChevronRight,
  Eye,
  QrCode,
  Globe,
  Sparkles,
  MessageCircle,
  Instagram,
  Linkedin,
  Send,
  Twitter,
  Disc,
  Slack,
  Facebook
} from 'lucide-react';
import { PaymentRecord, BankDetails, UserAccount, SocialLink } from '../types';
import { Lock, Save, KeyRound, ChevronDown, Award as AwardIcon, Share2, Database, Copy, Check, RefreshCw } from 'lucide-react';
import { normalizePhone } from '../App';
import { SEO_DATA } from './SEOManager';
import { isFirebaseConfigured, testFirebaseConnection, seedFirebaseDatabase, TestResult, SeedResult } from '../firebaseClient';
import ImageWithLoader from './ImageWithLoader';

interface AdminPanelProps {
  payments: PaymentRecord[];
  users: UserAccount[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClose: () => void;
  onViewCertificate: (payment: PaymentRecord) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  bankDetails: BankDetails;
  onUpdateBankDetails: (newDetails: BankDetails) => void;
  adminPasscode: string;
  onUpdatePasscode: (newPasscode: string) => void;
  onLockConsole: () => void;
  socialLinks: SocialLink[];
  onUpdateSocialLinks: (newLinks: SocialLink[]) => void;
  disableLocalStorage?: boolean;
  onToggleDisableLocalStorage?: (disabled: boolean) => void;
  onRefresh?: () => Promise<void>;
}

export default function AdminPanel({ 
  payments, 
  users = [],
  onApprove,
  onReject, 
  onClose,
  onViewCertificate,
  theme,
  setTheme,
  bankDetails,
  onUpdateBankDetails,
  adminPasscode,
  onUpdatePasscode,
  onLockConsole,
  socialLinks = [],
  onUpdateSocialLinks,
  disableLocalStorage = false,
  onToggleDisableLocalStorage,
  onRefresh
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'users' | 'seo' | 'social' | 'supabase'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (err) {
      console.warn('Error refreshing admin panel data:', err);
    } finally {
      // Ensure the rotation plays for at least 800ms
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    }
  };
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedQRRecord, setSelectedQRRecord] = useState<PaymentRecord | null>(null);

  // Editable configurations states
  const [editBankName, setEditBankName] = useState(bankDetails.bankName);
  const [editAccountName, setEditAccountName] = useState(bankDetails.accountName);
  const [editAccountNumber, setEditAccountNumber] = useState(bankDetails.accountNumber);
  const [editPasscode, setEditPasscode] = useState(adminPasscode);

  const [bankFeedback, setBankFeedback] = useState('');
  const [passcodeFeedback, setPasscodeFeedback] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Social Links management states
  const [localLinks, setLocalLinks] = useState<SocialLink[]>(socialLinks);
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [socialFeedback, setSocialFeedback] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedKeys, setCopiedKeys] = useState(false);
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isSeedingFirebase, setIsSeedingFirebase] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);

  // Cloudinary settings states
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState(() => {
    return localStorage.getItem('cloudinary_cloud_name') || (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || '';
  });
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState(() => {
    return localStorage.getItem('cloudinary_upload_preset') || (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
  });
  const [cloudinarySaveFeedback, setCloudinarySaveFeedback] = useState('');
  const [isTestingCloudinary, setIsTestingCloudinary] = useState(false);
  const [cloudinaryTestProgress, setCloudinaryTestProgress] = useState(0);
  const [cloudinaryTestResult, setCloudinaryTestResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  useEffect(() => {
    const fetchCloudinarySettingsFromFirestore = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebaseClient');
        if (db) {
          const cloudNameDoc = await getDoc(doc(db, 'admin_settings', 'cloudinary_cloud_name'));
          const uploadPresetDoc = await getDoc(doc(db, 'admin_settings', 'cloudinary_upload_preset'));
          if (cloudNameDoc.exists()) {
            const val = cloudNameDoc.data().value;
            setCloudinaryCloudName(val);
            localStorage.setItem('cloudinary_cloud_name', val);
          }
          if (uploadPresetDoc.exists()) {
            const val = uploadPresetDoc.data().value;
            setCloudinaryUploadPreset(val);
            localStorage.setItem('cloudinary_upload_preset', val);
          }
        }
      } catch (err) {
        console.warn('Failed to load Cloudinary settings from Firestore:', err);
      }
    };
    fetchCloudinarySettingsFromFirestore();
  }, []);

  const handleSaveCloudinaryConfig = async () => {
    setCloudinarySaveFeedback('');
    try {
      const trimmedCloud = cloudinaryCloudName.trim();
      const trimmedPreset = cloudinaryUploadPreset.trim();

      setCloudinaryCloudName(trimmedCloud);
      setCloudinaryUploadPreset(trimmedPreset);

      localStorage.setItem('cloudinary_cloud_name', trimmedCloud);
      localStorage.setItem('cloudinary_upload_preset', trimmedPreset);

      const { upsertAdminSettingToFirebase, isFirebaseConfigured } = await import('../firebaseClient');
      if (isFirebaseConfigured()) {
        const ok1 = await upsertAdminSettingToFirebase('cloudinary_cloud_name', trimmedCloud);
        const ok2 = await upsertAdminSettingToFirebase('cloudinary_upload_preset', trimmedPreset);

        if (ok1 && ok2) {
          setCloudinarySaveFeedback('✅ Configuration successfully synchronized to Firestore database & client cache.');
        } else {
          setCloudinarySaveFeedback('⚠️ Saved to local browser cache, but database writing returned false.');
        }
      } else {
        setCloudinarySaveFeedback('✅ Saved to local browser cache (Firebase Fallback Sandbox mode active).');
      }
    } catch (err: any) {
      setCloudinarySaveFeedback(`❌ Error saving: ${err.message || err}`);
    }
    setTimeout(() => setCloudinarySaveFeedback(''), 5000);
  };

  const handleTestCloudinaryUpload = async () => {
    setIsTestingCloudinary(true);
    setCloudinaryTestProgress(0);
    setCloudinaryTestResult(null);
    try {
      if (!cloudinaryCloudName.trim() || !cloudinaryUploadPreset.trim()) {
        throw new Error('Please configure and save both Cloud Name and Upload Preset first.');
      }

      // Draw a pretty dynamic diagnostic badge on a programmatical canvas to upload as file
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#111827'; // Dark theme background
        ctx.fillRect(0, 0, 300, 300);

        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        for (let i = 0; i < 300; i += 30) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 300);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(300, i);
          ctx.stroke();
        }

        ctx.fillStyle = '#3b82f6'; // Bright blue badge
        ctx.beginPath();
        ctx.arc(150, 150, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CLOUDINARY', 150, 130);
        ctx.fillText('DIAGNOSTIC', 150, 150);
        ctx.fillText('ACTIVE', 150, 170);
      }

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        throw new Error('Could not generate canvas test blob.');
      }
      const testFile = new File([blob], `cloudinary_diagnostic_${Date.now()}.png`, { type: 'image/png' });

      const { uploadReceipt } = await import('../firebaseClient');
      console.log('Dispatching programmatical test upload to Cloudinary...');
      const uploadedUrl = await uploadReceipt(testFile, 'ADMIN_DIAGNOSTIC', (percent) => {
        setCloudinaryTestProgress(percent);
      });

      setCloudinaryTestResult({
        success: true,
        message: 'Cloudinary storage connection is fully operational! The image uploaded successfully.',
        url: uploadedUrl
      });
    } catch (err: any) {
      console.error('Test Cloudinary upload failed:', err);
      setCloudinaryTestResult({
        success: false,
        message: err.message || 'An unexpected error occurred during testing.'
      });
    } finally {
      setIsTestingCloudinary(false);
    }
  };

  useEffect(() => {
    setLocalLinks(socialLinks);
  }, [socialLinks]);

  const handleBankSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBankName.trim() || !editAccountName.trim() || !editAccountNumber.trim()) {
      setBankFeedback('All fields are required.');
      return;
    }
    onUpdateBankDetails({
      bankName: editBankName,
      accountName: editAccountName,
      accountNumber: editAccountNumber,
    });
    setBankFeedback('Bank account details saved successfully!');
    setTimeout(() => setBankFeedback(''), 3000);
  };

  const handlePasscodeSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(editPasscode)) {
      setPasscodeError('Passcode must be exactly 4 digits.');
      return;
    }
    setPasscodeError('');
    onUpdatePasscode(editPasscode);
    setPasscodeFeedback('Passcode updated successfully!');
    setTimeout(() => setPasscodeFeedback(''), 3000);
  };

  const handleUpdateLinkUrl = (id: string, url: string) => {
    setLocalLinks(prev => prev.map(link => link.id === id ? { ...link, url } : link));
  };

  const handleToggleLink = (id: string) => {
    setLocalLinks(prev => prev.map(link => link.id === id ? { ...link, enabled: !link.enabled } : link));
  };

  const handleAddSocialLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocialName.trim() || !newSocialUrl.trim()) {
      setSocialFeedback('Name and URL are required.');
      return;
    }
    const id = newSocialName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (localLinks.some(l => l.id === id)) {
      setSocialFeedback('A social link with a similar ID already exists.');
      return;
    }
    const newLink: SocialLink = {
      id,
      name: newSocialName.trim(),
      url: newSocialUrl.trim(),
      enabled: true
    };
    const updated = [...localLinks, newLink];
    setLocalLinks(updated);
    setNewSocialName('');
    setNewSocialUrl('');
    setSocialFeedback('New social link added locally! Click "Save All Configuration" to apply.');
    setTimeout(() => setSocialFeedback(''), 4000);
  };

  const handleDeleteSocialLink = (id: string) => {
    setLocalLinks(prev => prev.filter(link => link.id !== id));
  };

  const handleSaveSocialLinks = () => {
    onUpdateSocialLinks(localLinks);
    setSocialFeedback('All social link configurations saved and deployed live!');
    setTimeout(() => setSocialFeedback(''), 4000);
  };


  // Filter payments
  const filteredPayments = payments.filter((p) => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch = 
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.phone.includes(searchQuery) ||
      (p.ownershipId && p.ownershipId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Filter users
  const filteredUsers = (users || []).filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.referredBy && u.referredBy.includes(q))
    );
  });

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length;

  // Calculate stats
  const totalRevenue = payments
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + (p.passType === 'multiple' || p.amount === '₦100,000' ? 100000 : 25000), 0);

  const potentialRevenue = payments
    .reduce((sum, p) => sum + (p.passType === 'multiple' || p.amount === '₦100,000' ? 100000 : 25000), 0);

  return (
    <div className="min-h-screen bg-[#05070B] text-zinc-100 p-4 md:p-8 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-6">
        <div>
          <button 
            onClick={onClose}
            id="admin-back-btn"
            className="flex items-center gap-2 text-xs font-mono text-purple-400 hover:text-purple-300 transition-all uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK TO LANDING
          </button>
          <h1 className="text-2xl md:text-3xl font-sans font-black text-white tracking-tight flex items-center gap-2">
            KORLYN <span className="text-purple-500 font-normal">ADMIN CONSOLE</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            Verify HELOLEX Ownership Passes, view uploaded payment receipts, and manage digital identities.
          </p>
        </div>

        {/* Sync Indicator & Refresh Button */}
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full text-xs font-mono tracking-wider transition-all border border-zinc-800 cursor-pointer disabled:opacity-50 shadow-sm"
              title="Refresh console records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>REFRESH</span>
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/20 border border-purple-500/20 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider text-purple-200">LIVE STORAGE SYNC ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Stat Cards */}
        <div className="bg-[#0B1020]/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Total Revenue</span>
              <h3 className="text-2xl md:text-3xl font-black text-white mt-1">₦{totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-4 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Based on {approvedCount} approved passes</span>
          </div>
        </div>

        <div className="bg-[#0B1020]/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Pending Review</span>
              <h3 className="text-2xl md:text-3xl font-black text-purple-400 mt-1">{pendingCount}</h3>
            </div>
            <div className="p-2 bg-purple-950/20 border border-purple-500/20 rounded-xl text-purple-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-4">
            Requires receipt manual verification
          </div>
        </div>

        <div className="bg-[#0B1020]/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Active Owners</span>
              <h3 className="text-2xl md:text-3xl font-black text-blue-400 mt-1">{approvedCount}</h3>
            </div>
            <div className="p-2 bg-blue-950/20 border border-blue-500/20 rounded-xl text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-4">
            Registered creators holding certificates
          </div>
        </div>

        <div className="bg-[#0B1020]/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Registered Users</span>
              <h3 className="text-2xl md:text-3xl font-black text-purple-400 mt-1">{(users || []).length}</h3>
            </div>
            <div className="p-2 bg-purple-950/20 border border-purple-500/20 rounded-xl text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-4">
            Total creators in referral network
          </div>
        </div>

        <div className="bg-[#0B1020]/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-magenta-500/5 blur-2xl rounded-full" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Platform Capacity</span>
              <h3 className="text-2xl md:text-3xl font-black text-white mt-1">
                {(10000 - approvedCount).toLocaleString()} <span className="text-xs text-zinc-500 font-normal">/ 10,000 Left</span>
              </h3>
            </div>
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-4">
            Remaining ownership passes
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List Section */}
        <div className="lg:col-span-2 bg-[#0B1020]/20 border border-zinc-800/60 rounded-2xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all border ${
                  activeTab === 'pending' 
                    ? 'bg-purple-900/30 text-purple-300 border-purple-500/40' 
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                }`}
              >
                PENDING ({pendingCount})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all border ${
                  activeTab === 'approved' 
                    ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/40' 
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                }`}
              >
                APPROVED ({approvedCount})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all border ${
                  activeTab === 'rejected' 
                    ? 'bg-red-900/30 text-red-300 border-red-500/40' 
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                }`}
              >
                REJECTED ({rejectedCount})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all border ${
                  activeTab === 'all' 
                    ? 'bg-zinc-850 text-white border-zinc-700' 
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                }`}
              >
                ALL PASSES ({payments.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('users');
                  setExpandedUserId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all border flex items-center gap-1.5 ${
                  activeTab === 'users' 
                    ? 'bg-blue-900/30 text-blue-300 border-blue-500/40' 
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                USERS & REFERRALS ({(users || []).length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('seo');
                  setExpandedUserId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all border flex items-center gap-1.5 ${
                  activeTab === 'seo' 
                    ? 'bg-amber-900/30 text-amber-300 border-amber-500/40' 
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                SEO, AIO & GEO REGISTRY
              </button>
              <button
                onClick={() => {
                  setActiveTab('social');
                  setExpandedUserId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all border flex items-center gap-1.5 ${
                  activeTab === 'social' 
                    ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/40' 
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                SOCIAL CHANNELS ({localLinks.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('supabase');
                  setExpandedUserId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all border flex items-center gap-1.5 ${
                  activeTab === 'supabase' 
                    ? 'bg-sky-900/30 text-sky-300 border-sky-500/40' 
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-sky-400'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-orange-400" />
                FIREBASE ENGINE
              </button>
            </div>

            {/* Search Input */}
            {activeTab !== 'seo' && activeTab !== 'social' && activeTab !== 'supabase' && (
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={activeTab === 'users' ? "Search by name, phone, email..." : "Search by email, phone..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            )}
          </div>

          {/* List Content */}
          <div className="space-y-3">
            {activeTab === 'users' ? (
              filteredUsers.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-900 rounded-xl">
                  <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No registered users found matching search query.</p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isExpanded = expandedUserId === user.phone;
                  const referredByObj = user.referredBy ? (users || []).find(ru => normalizePhone(ru.phone) === normalizePhone(user.referredBy!)) : null;
                  const directReferrals = (users || []).filter(u => u.referredBy && normalizePhone(u.referredBy) === normalizePhone(user.phone));
                  const userPayment = payments.find(p => normalizePhone(p.phone) === normalizePhone(user.phone));

                  return (
                    <div 
                      key={user.phone}
                      className="bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 rounded-xl p-4 transition-all space-y-4"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 shrink-0">
                            <User className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-white">{user.fullName || 'Anonymous Registrant'}</span>
                              {user.email && (
                                <span className="text-xs text-zinc-400">({user.email})</span>
                              )}
                              {userPayment?.status === 'approved' && (
                                <span className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono tracking-wider rounded-md uppercase font-semibold">
                                  {userPayment.ownershipId}
                                </span>
                              )}
                              {user.passType && (
                                <span className={`px-2 py-0.5 border text-[9px] font-mono tracking-wider rounded-md uppercase font-semibold ${
                                  user.passType === 'multiple' 
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                }`}>
                                  {user.passType} pass
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1 flex flex-col gap-0.5 font-mono">
                              <span>Phone: <span className="text-zinc-300">{user.phone}</span></span>
                              <span>Joined: <span className="text-zinc-400">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></span>
                              {referredByObj ? (
                                <span className="text-purple-400">
                                  Referred By: <span className="font-bold">{referredByObj.fullName || 'Anonymous'}</span> ({referredByObj.phone})
                                </span>
                              ) : user.referredBy ? (
                                <span className="text-zinc-500">
                                  Referred By (External): <span className="font-mono">{user.referredBy}</span>
                                </span>
                              ) : (
                                <span className="text-zinc-600">Organic Direct Signup</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* User Stats & Toggle Referrals */}
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          {/* Mini Stats Display */}
                          <div className="flex gap-2 font-mono text-[10px]">
                            <div className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-center">
                              <span className="text-zinc-500 uppercase block text-[8px]">CLICKS</span>
                              <span className="font-bold text-zinc-300">{user.clicksCount}</span>
                            </div>
                            <div className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-center">
                              <span className="text-zinc-500 uppercase block text-[8px]">REGISTERS</span>
                              <span className="font-bold text-zinc-300">{user.registrationsCount}</span>
                            </div>
                            <div className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-center">
                              <span className="text-zinc-500 uppercase block text-[8px]">SALES</span>
                              <span className="font-bold text-emerald-400">{user.purchasesCount}</span>
                            </div>
                            <div className="px-2 py-1 bg-purple-950/20 border border-purple-500/20 rounded text-purple-300 text-center">
                              <span className="text-purple-400 uppercase block text-[8px]">POINTS</span>
                              <span className="font-bold">{user.points}</span>
                            </div>
                          </div>

                          {/* Connections button */}
                          <button
                            onClick={() => setExpandedUserId(isExpanded ? null : user.phone)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/30 text-purple-300 rounded-lg text-xs font-mono tracking-wider transition-all border border-purple-500/20 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>CONNECTIONS ({directReferrals.length})</span>
                            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Connections Sub-table */}
                      {isExpanded && (
                        <div className="bg-[#0b0f19]/45 border border-purple-500/10 rounded-xl p-4 space-y-3">
                          <h4 className="text-xs font-bold font-mono text-purple-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-2">
                            <Users className="w-3.5 h-3.5" />
                            <span>Referred Connections Network ({directReferrals.length})</span>
                          </h4>

                          {directReferrals.length === 0 ? (
                            <p className="text-[11px] text-zinc-500 font-mono italic">
                              This user has not successfully referred any new accounts yet.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {directReferrals.map((dr) => {
                                const drPayment = payments.find(p => normalizePhone(p.phone) === normalizePhone(dr.phone));
                                return (
                                  <div 
                                    key={dr.phone}
                                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-950/20 border border-zinc-900/40 rounded-lg p-2.5 hover:border-zinc-800 transition-colors gap-2 text-xs font-mono"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="font-sans font-bold text-zinc-200">{dr.fullName || 'Anonymous Registrant'}</div>
                                      <div className="text-[10px] text-zinc-500 font-mono">Phone: {dr.phone} | Email: {dr.email || 'N/A'}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] text-zinc-500">
                                        Joined: {new Date(dr.createdAt).toLocaleDateString()}
                                      </span>
                                      {drPayment ? (
                                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                                          drPayment.status === 'approved' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                            : drPayment.status === 'pending'
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                          {drPayment.status} pass
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded border bg-zinc-900 text-zinc-500 border-zinc-800">
                                          Unsubmitted
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )
            ) : activeTab === 'social' ? (
              /* Social Channels Control Deck */
              <div className="space-y-6">
                {/* Intro banner */}
                <div className="bg-[#0B1020]/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 blur-3xl rounded-full" />
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <h3 className="text-xs font-mono tracking-widest font-black text-white uppercase">COMMUNITY INDEX GATEWAY</h3>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-4xl">
                      Activate, disable, customize, or append digital gateway nodes for the client dashboard community deck. Disabling any channel will seamlessly hide the button block on all user accounts in real time.
                    </p>
                  </div>
                </div>

                {/* Add New Channel form */}
                <div className="bg-[#0B1020]/30 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                    Add Custom Community Link
                  </h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddSocialLink(e);
                    }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-mono uppercase block">Channel Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Helolex Threads"
                        value={newSocialName}
                        onChange={(e) => setNewSocialName(e.target.value)}
                        className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-mono uppercase block">URL Endpoint</label>
                      <input
                        type="url"
                        placeholder="https://threads.net/helolex"
                        value={newSocialUrl}
                        onChange={(e) => setNewSocialUrl(e.target.value)}
                        className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer font-bold"
                      >
                        Add Node Link
                      </button>
                    </div>
                  </form>
                </div>

                {/* Manage channels deck */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                      Gateway Channel List
                    </h4>
                    <button
                      onClick={handleSaveSocialLinks}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-500/10"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save All Changes
                    </button>
                  </div>

                  {socialFeedback && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-xl text-center">
                      {socialFeedback}
                    </div>
                  )}

                  <div className="space-y-3">
                    {localLinks.map((link) => (
                      <div
                        key={link.id}
                        className={`bg-zinc-950/40 border rounded-xl p-4 transition-all duration-300 ${
                          link.enabled 
                            ? 'border-zinc-800/80 hover:border-zinc-700' 
                            : 'border-zinc-900 opacity-65'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            {/* Icon & Name */}
                            <div className={`p-2.5 rounded-xl border shrink-0 ${
                              link.enabled 
                                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                            }`}>
                              {link.id === 'whatsapp' && <MessageCircle className="w-5 h-5" />}
                              {link.id === 'instagram' && <Instagram className="w-5 h-5" />}
                              {link.id === 'linkedin' && <Linkedin className="w-5 h-5" />}
                              {link.id === 'telegram' && <Send className="w-5 h-5" />}
                              {link.id === 'twitter' && <Twitter className="w-5 h-5" />}
                              {link.id === 'discord' && <Disc className="w-5 h-5" />}
                              {link.id === 'slack' && <Slack className="w-5 h-5" />}
                              {link.id === 'facebook' && <Facebook className="w-5 h-5" />}
                              {link.id !== 'whatsapp' && link.id !== 'instagram' && link.id !== 'linkedin' && link.id !== 'telegram' && link.id !== 'twitter' && link.id !== 'discord' && link.id !== 'slack' && link.id !== 'facebook' && <Globe className="w-5 h-5" />}
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-sans font-black text-white text-sm">
                                  {link.name}
                                </span>
                                <span className="font-mono text-[9px] text-zinc-500 uppercase">
                                  ({link.id})
                                </span>
                              </div>
                              {/* Editable URL input */}
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) => handleUpdateLinkUrl(link.id, e.target.value)}
                                className="w-full bg-zinc-950/80 border border-zinc-900 rounded-lg py-1 px-2.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="Enter channel URL"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                            {/* Enabled/Disabled Toggle */}
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-zinc-500 uppercase font-bold">
                                {link.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleLink(link.id)}
                                className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                                  link.enabled 
                                    ? 'bg-emerald-500/20 border border-emerald-500/50 shadow-inner' 
                                    : 'bg-zinc-900 border border-zinc-800'
                                }`}
                              >
                                <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                                  link.enabled 
                                    ? 'right-1 bg-emerald-400' 
                                    : 'left-1 bg-zinc-600'
                                }`} />
                              </button>
                            </div>

                            {/* Delete custom link button */}
                            {!['whatsapp', 'instagram', 'linkedin', 'telegram', 'twitter', 'discord', 'slack', 'facebook'].includes(link.id) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSocialLink(link.id)}
                                className="p-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-lg transition-colors text-xs font-mono cursor-pointer font-bold"
                                title="Delete Custom Link"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={handleSaveSocialLinks}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-purple-500/15 flex items-center gap-2 font-bold"
                    >
                      <Save className="w-4 h-4" />
                      Save All Social Channel Configurations
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === 'seo' ? (
              /* SEO / AIO / GEO Engine Control Room */
              <div className="space-y-6">
                {/* Intro banner */}
                <div className="bg-gradient-to-r from-purple-500/10 via-amber-500/5 to-blue-500/10 border border-zinc-900 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    <h3 className="text-xs font-mono tracking-widest font-black text-white uppercase">ADVANCED SEO / AIO / GEO DEPLOYMENT MODULE</h3>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-4xl">
                    This workspace implements state-of-the-art Search Engine Optimization, Answer Engine Optimization, and Generative Engine Optimization. Content structures are optimized with semantic schemas (JSON-LD), responsive social OG cards, and highly-converting copy specifically tailored to trigger conversational AI agents (Gemini, Perplexity, OpenAI Search, Claude) as well as human clicks.
                  </p>
                </div>

                {/* Grid comparing Korlyn vs Helolex */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Korlyn Platform Column */}
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                        <h4 className="font-sans font-black text-xs text-purple-400 uppercase tracking-widest">KORLYN PLATFORM</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-purple-950/40 text-purple-300 border border-purple-500/20 rounded-md text-[9px] font-mono font-bold">ROOT ROUTE (/)</span>
                    </div>

                    {/* Meta Mock Share Card */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Social / Search Live Snippet Preview</label>
                      <div className="bg-[#0b0c10] border border-zinc-800/80 rounded-xl overflow-hidden hover:scale-[1.01] transition-transform duration-300">
                        <div className="aspect-[1.91/1] w-full bg-zinc-900 relative overflow-hidden flex items-center justify-center border-b border-zinc-900">
                          <ImageWithLoader 
                            src={SEO_DATA.korlyn.imageUrl} 
                            alt={SEO_DATA.korlyn.imageAlt}
                            className="w-full h-full object-cover opacity-85"
                            containerClassName="w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                            <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-bold">KORLYN CUBE SECURE ROOT</span>
                            <h5 className="text-xs font-sans font-black text-white tracking-tight">{SEO_DATA.korlyn.tagline}</h5>
                          </div>
                        </div>
                        <div className="p-3 space-y-1 bg-zinc-950/90 font-sans">
                          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                            <span>https://mydomain.com</span>
                            <span>•</span>
                            <span>Secure Node</span>
                          </div>
                          <div className="text-xs font-bold text-blue-400 hover:underline cursor-pointer tracking-tight">
                            {SEO_DATA.korlyn.title}
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-normal">
                            {SEO_DATA.korlyn.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Metadata attributes list */}
                    <div className="bg-zinc-900/30 rounded-xl p-3 space-y-2 text-[11px] font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-zinc-500 text-[9px] uppercase font-bold">META TITLE</span>
                        <span className="text-zinc-200 font-semibold">{SEO_DATA.korlyn.title}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-t border-zinc-900/50 pt-2">
                        <span className="text-zinc-500 text-[9px] uppercase font-bold">META DESCRIPTION</span>
                        <span className="text-zinc-300 leading-relaxed">{SEO_DATA.korlyn.description}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-t border-zinc-900/50 pt-2">
                        <span className="text-zinc-500 text-[9px] uppercase font-bold">SEO & GEO KEYWORDS</span>
                        <span className="text-zinc-400 text-[10px] leading-relaxed">{SEO_DATA.korlyn.keywords}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-t border-zinc-900/50 pt-2">
                        <span className="text-zinc-500 text-[9px] uppercase font-bold">SEO KEY CONVERSION TAGLINE</span>
                        <span className="text-emerald-400 font-bold">{SEO_DATA.korlyn.tagline}</span>
                      </div>
                    </div>

                    {/* AIO and GEO targeting prompts */}
                    <div className="space-y-2">
                      <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Conversational AI Engine (AIO/GEO) Triggers</label>
                      <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-3.5 space-y-2">
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                          Optimized semantic pathways configured to rank as an authoritative source in search engine LLM queries:
                        </p>
                        <div className="space-y-1.5 font-mono text-[10px]">
                          {SEO_DATA.korlyn.aioKeywords.map((kw, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-zinc-300">
                              <span className="text-amber-500 font-black shrink-0">▸</span>
                              <span>{kw}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Copy Buttons */}
                    <div className="flex gap-2 font-mono text-[10px]">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(SEO_DATA.korlyn.structuredData, null, 2));
                        }}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg transition-all cursor-pointer font-bold text-center"
                      >
                        COPY JSON-LD SCHEMA
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('https://mydomain.com/');
                        }}
                        className="flex-1 py-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/20 rounded-lg transition-all cursor-pointer font-bold text-center"
                      >
                        COPY KORLYN LINK
                      </button>
                    </div>
                  </div>

                  {/* Helolex Platform Column */}
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <h4 className="font-sans font-black text-xs text-amber-400 uppercase tracking-widest">HELOLEX REALMS</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-950/40 text-amber-300 border border-amber-500/20 rounded-md text-[9px] font-mono font-bold">SUB-ROUTE (/helolex)</span>
                    </div>

                    {/* Meta Mock Share Card */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Social / Search Live Snippet Preview</label>
                      <div className="bg-[#0b0c10] border border-zinc-800/80 rounded-xl overflow-hidden hover:scale-[1.01] transition-transform duration-300">
                        <div className="aspect-[1.91/1] w-full bg-zinc-900 relative overflow-hidden flex items-center justify-center border-b border-zinc-900">
                          <ImageWithLoader 
                            src={SEO_DATA.helolex.imageUrl} 
                            alt={SEO_DATA.helolex.imageAlt}
                            className="w-full h-full object-cover opacity-85"
                            referrerPolicy="no-referrer"
                            containerClassName="w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                            <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold">HELOLEX SECURE PORTAL</span>
                            <h5 className="text-xs font-sans font-black text-white tracking-tight">{SEO_DATA.helolex.tagline}</h5>
                          </div>
                        </div>
                        <div className="p-3 space-y-1 bg-zinc-950/90 font-sans">
                          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                            <span>https://mydomain.com/helolex</span>
                            <span>•</span>
                            <span>Secure Node</span>
                          </div>
                          <div className="text-xs font-bold text-blue-400 hover:underline cursor-pointer tracking-tight">
                            {SEO_DATA.helolex.title}
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-normal">
                            {SEO_DATA.helolex.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Metadata attributes list */}
                    <div className="bg-zinc-900/30 rounded-xl p-3 space-y-2 text-[11px] font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-zinc-500 text-[9px] uppercase font-bold">META TITLE</span>
                        <span className="text-zinc-200 font-semibold">{SEO_DATA.helolex.title}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-t border-zinc-900/50 pt-2">
                        <span className="text-zinc-500 text-[9px] uppercase font-bold">META DESCRIPTION</span>
                        <span className="text-zinc-300 leading-relaxed">{SEO_DATA.helolex.description}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-t border-zinc-900/50 pt-2">
                        <span className="text-zinc-500 text-[9px] uppercase font-bold">SEO & GEO KEYWORDS</span>
                        <span className="text-zinc-400 text-[10px] leading-relaxed">{SEO_DATA.helolex.keywords}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-t border-zinc-900/50 pt-2">
                        <span className="text-zinc-500 text-[9px] uppercase font-bold">SEO KEY CONVERSION TAGLINE</span>
                        <span className="text-emerald-400 font-bold">{SEO_DATA.helolex.tagline}</span>
                      </div>
                    </div>

                    {/* AIO and GEO targeting prompts */}
                    <div className="space-y-2">
                      <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Conversational AI Engine (AIO/GEO) Triggers</label>
                      <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-3.5 space-y-2">
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                          Optimized semantic pathways configured to rank as an authoritative source in search engine LLM queries:
                        </p>
                        <div className="space-y-1.5 font-mono text-[10px]">
                          {SEO_DATA.helolex.aioKeywords.map((kw, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-zinc-300">
                              <span className="text-amber-500 font-black shrink-0">▸</span>
                              <span>{kw}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Copy Buttons */}
                    <div className="flex gap-2 font-mono text-[10px]">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(SEO_DATA.helolex.structuredData, null, 2));
                        }}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg transition-all cursor-pointer font-bold text-center"
                      >
                        COPY JSON-LD SCHEMA
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('https://mydomain.com/helolex');
                        }}
                        className="flex-1 py-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border border-amber-500/20 rounded-lg transition-all cursor-pointer font-bold text-center"
                      >
                        COPY HELOLEX LINK
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'supabase' ? (
              /* Firebase Engine Control Panel */
              <div className="space-y-6">
                {/* Status card */}
                <div className={`p-6 border rounded-2xl relative overflow-hidden transition-all ${
                  isFirebaseConfigured()
                    ? 'bg-[#002B1D]/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-[#2D1600]/20 border-amber-500/30 text-amber-300'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-amber-500/5 blur-3xl rounded-full" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          isFirebaseConfigured() ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-amber-400 shadow-lg shadow-amber-500/50 animate-pulse'
                        }`} />
                        <h3 className="text-xs font-mono tracking-widest font-black uppercase text-white">
                          {isFirebaseConfigured() ? 'FIREBASE FIRESTORE ENGINE: ONLINE' : 'FIREBASE FIRESTORE ENGINE: FALLBACK MODE'}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-2xl">
                        {isFirebaseConfigured()
                          ? 'The application is successfully connected to your real Firebase Firestore database. All member records, reference referrals, and uploaded payments receipts are persistent.'
                          : 'The application is running in local sandbox fallback mode using localStorage. To persist data in production, configure your Firebase applet keys.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Local Storage Persistency Control Card */}
                <div className="p-6 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/5 to-transparent blur-2xl rounded-full" />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Database className="w-4 h-4 text-orange-400 shrink-0" />
                        LOCAL STORAGE PERSISTENCY CONTROL
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed max-w-2xl">
                        Toggle to disable all local browser caching (localStorage). When disabled, the application is strictly prohibited from writing or reading user data, payments, and admin settings to browser cache, executing all operations strictly against the live Firebase Firestore database.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                      <span className="font-mono text-[10px] text-zinc-500 uppercase font-black tracking-wider">
                        {disableLocalStorage ? 'DATABASE ONLY' : 'HYBRID CACHE'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleDisableLocalStorage?.(!disableLocalStorage)}
                        className={`w-12 h-6 rounded-full transition-all relative cursor-pointer border ${
                          disableLocalStorage
                            ? 'bg-red-500/10 border-red-500/30 shadow-inner'
                            : 'bg-emerald-500/10 border-emerald-500/30 shadow-inner'
                        }`}
                        id="btn-toggle-local-storage"
                      >
                        <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all ${
                          disableLocalStorage
                            ? 'right-0.5 bg-red-500 shadow-md shadow-red-500/50'
                            : 'left-0.5 bg-emerald-500 shadow-md shadow-emerald-500/50'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cloudinary Integration Configuration Card */}
                <div className="p-6 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent blur-2xl rounded-full" />
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400 shrink-0" />
                      CLOUDINARY RECEIPTS STORAGE CONFIGURATION
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-mono leading-relaxed max-w-2xl">
                      Configure your Cloudinary credentials for durable receipts storage. When configured, transaction receipt uploads are securely saved to your Cloudinary storage instance.
                    </p>
                  </div>

                  {/* Troubleshooting Guide */}
                  <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1.5">
                    <p className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      💡 HOW TO GET A VALID UNSIGNED UPLOAD PRESET:
                    </p>
                    <ol className="text-[10px] text-zinc-400 font-mono list-decimal pl-4 space-y-1 leading-normal">
                      <li>Log into your <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">Cloudinary Console</a>.</li>
                      <li>Click the <strong>Settings (Gear Icon)</strong> in the bottom-left or top-right.</li>
                      <li>Select the <strong>Upload</strong> tab from the sidebar/menu.</li>
                      <li>Scroll down to the <strong>Upload presets</strong> section.</li>
                      <li>Click <strong>"Add upload preset"</strong>.</li>
                      <li><strong>CRITICAL STEP:</strong> Change the <strong>"Signing Mode"</strong> dropdown from <em>Signed</em> to <strong>Unsigned</strong>.</li>
                      <li>Copy the generated <strong>Upload preset name</strong> (exactly as displayed, keeping case-sensitive) and paste it below. Then click <strong>Save Cloudinary Config</strong>.</li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono font-black uppercase tracking-wider block">CLOUDINARY CLOUD NAME</label>
                      <input
                        type="text"
                        value={cloudinaryCloudName}
                        onChange={(e) => setCloudinaryCloudName(e.target.value)}
                        placeholder="e.g. dxyz12345"
                        className="w-full bg-zinc-900 border border-zinc-850 focus:border-blue-500/40 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-mono font-black uppercase tracking-wider block">UNSIGNED UPLOAD PRESET</label>
                      <input
                        type="text"
                        value={cloudinaryUploadPreset}
                        onChange={(e) => setCloudinaryUploadPreset(e.target.value)}
                        placeholder="e.g. helolex_unsigned"
                        className="w-full bg-zinc-900 border border-zinc-850 focus:border-blue-500/40 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveCloudinaryConfig}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                      SAVE CLOUDINARY CONFIG
                    </button>

                    <button
                      type="button"
                      disabled={isTestingCloudinary}
                      onClick={handleTestCloudinaryUpload}
                      className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-2 select-none transition-all cursor-pointer whitespace-nowrap ${
                        isTestingCloudinary
                          ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/60 hover:border-zinc-600'
                      }`}
                    >
                      {isTestingCloudinary ? (
                        <>
                          <span className="w-2.5 h-2.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                          TESTING UPLOAD...
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5 text-blue-400" />
                          RUN CLOUDINARY UPLOAD TEST
                        </>
                      )}
                    </button>
                  </div>

                  {isTestingCloudinary && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider">Test Upload Progress</span>
                        <span className="text-blue-400 font-black">{cloudinaryTestProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                          style={{ width: `${cloudinaryTestProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {cloudinarySaveFeedback && (
                    <p className="text-[10px] font-mono text-zinc-300 leading-relaxed pt-1">
                      {cloudinarySaveFeedback}
                    </p>
                  )}

                  {cloudinaryTestResult && (
                    <div className={`p-4 border rounded-xl font-mono text-xs space-y-2 transition-all ${
                      cloudinaryTestResult.success
                        ? 'bg-[#002B1D]/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-[#2D1600]/20 border-rose-500/30 text-rose-300'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className="shrink-0">{cloudinaryTestResult.success ? '🟢' : '🔴'}</span>
                        <div className="space-y-1">
                          <p className="font-bold text-white uppercase tracking-wider text-[10px]">
                            {cloudinaryTestResult.success ? 'CLOUDINARY TEST UPLOAD PASSED' : 'CLOUDINARY TEST UPLOAD FAILED'}
                          </p>
                          <p className="text-[11px] leading-relaxed text-zinc-300">
                            {cloudinaryTestResult.message}
                          </p>
                          {cloudinaryTestResult.success && cloudinaryTestResult.url && (
                            <div className="pt-1.5 space-y-1">
                              <span className="text-[9px] text-zinc-500 block">SECURE URL:</span>
                              <a
                                href={cloudinaryTestResult.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline break-all block"
                              >
                                {cloudinaryTestResult.url}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Firebase Test/Seed Action Panel */}
                <div className="p-6 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-6">
                  <div>
                    <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest mb-1">
                      DATABASE DIAGNOSTICS & DATA SEEDER
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                      Validate active Firebase connectivity, verify Firestore accessibility, or populate the collections with realistic mock participant and settings data.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Connection Test Action */}
                    <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl flex flex-col justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider">01. CONNECTION TEST</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                          Checks live connection and read/write capabilities on admin_settings to ensure backend access is functional.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isTestingFirebase}
                        onClick={async () => {
                          setIsTestingFirebase(true);
                          setTestResult(null);
                          try {
                            const result = await testFirebaseConnection();
                            setTestResult(result);
                          } catch (err: any) {
                            setTestResult({
                              success: false,
                              message: err?.message || 'An unexpected error occurred.',
                            });
                          } finally {
                            setIsTestingFirebase(false);
                          }
                        }}
                        className={`w-full px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 select-none transition-all cursor-pointer whitespace-nowrap ${
                          isTestingFirebase
                            ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/60 hover:border-zinc-600'
                        }`}
                      >
                        {isTestingFirebase ? (
                          <>
                            <span className="w-2.5 h-2.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                            TESTING CONNECTION...
                          </>
                        ) : (
                          'RUN CONNECTION TEST'
                        )}
                      </button>
                    </div>

                    {/* Data Seeding Action */}
                    <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl flex flex-col justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider">02. SEED DATABASE</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                          Registers mock participant accounts, diagnostic settings, and test payment records inside Firebase Firestore.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isSeedingFirebase}
                        onClick={async () => {
                          setIsSeedingFirebase(true);
                          setSeedResult(null);
                          try {
                            const result = await seedFirebaseDatabase();
                            setSeedResult(result);
                            if (result.success && onRefresh) {
                              onRefresh().catch(console.error);
                            }
                          } catch (err: any) {
                            setSeedResult({
                              success: false,
                              message: err?.message || 'An unexpected error occurred.',
                            });
                          } finally {
                            setIsSeedingFirebase(false);
                          }
                        }}
                        className={`w-full px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 select-none transition-all cursor-pointer whitespace-nowrap ${
                          isSeedingFirebase
                            ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md shadow-orange-500/10 hover:shadow-orange-500/20'
                        }`}
                      >
                        {isSeedingFirebase ? (
                          <>
                            <span className="w-2.5 h-2.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                            SEEDING DATABASE...
                          </>
                        ) : (
                          'SEED MOCK DATABASE'
                        )}
                      </button>
                    </div>
                  </div>

                  {testResult && (
                    <div className={`p-4 border rounded-xl font-mono text-xs space-y-3 transition-all ${
                      testResult.success
                        ? 'bg-[#002B1D]/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-[#2D1600]/20 border-rose-500/30 text-rose-300'
                    }`}>
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0">
                          {testResult.success ? '🟢' : '🔴'}
                        </span>
                        <div className="space-y-1">
                          <p className="font-bold text-white uppercase tracking-wider text-[10px]">
                            {testResult.success ? 'CONNECTION DIAGNOSTIC PASSED' : 'CONNECTION DIAGNOSTIC FAILED'}
                          </p>
                          <p className="text-[11px] text-zinc-300 leading-relaxed">
                            {testResult.message}
                          </p>
                        </div>
                      </div>

                      {testResult.details && (
                        <div className="pt-2.5 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px]">{testResult.details.connectionOk ? '🟢' : '🔴'}</span>
                            <span>Firebase Client: {testResult.details.connectionOk ? 'CONNECTED' : 'OFFLINE'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px]">{testResult.details.adminSettingsOk ? '🟢' : '🔴'}</span>
                            <span>[admin_settings] Collection: {testResult.details.adminSettingsOk ? 'ONLINE' : 'MISSING'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px]">{testResult.details.usersAccountOk ? '🟢' : '🔴'}</span>
                            <span>[users_account] Collection: {testResult.details.usersAccountOk ? 'ONLINE' : 'MISSING'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px]">{testResult.details.paymentsOk ? '🟢' : '🔴'}</span>
                            <span>[payments] Collection: {testResult.details.paymentsOk ? 'ONLINE' : 'MISSING'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {seedResult && (
                    <div className={`p-4 border rounded-xl font-mono text-xs space-y-3 transition-all ${
                      seedResult.success
                        ? 'bg-[#002B1D]/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-[#2D1600]/20 border-rose-500/30 text-rose-300'
                    }`}>
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0">
                          {seedResult.success ? '🟢' : '🔴'}
                        </span>
                        <div className="space-y-1">
                          <p className="font-bold text-white uppercase tracking-wider text-[10px]">
                            {seedResult.success ? 'DATABASE SEEDING SUCCESSFUL' : 'DATABASE SEEDING FAILED'}
                          </p>
                          <p className="text-[11px] text-zinc-300 leading-relaxed">
                            {seedResult.message}
                          </p>
                        </div>
                      </div>

                      {seedResult.details && (
                        <div className="pt-2.5 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px]">{seedResult.details.seededSettings ? '🟢' : '⚪'}</span>
                            <span>Passcode Config: {seedResult.details.seededSettings ? 'SEEDED/UPDATED' : 'UP-TO-DATE'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px]">{seedResult.details.seededUsers ? '🟢' : '⚪'}</span>
                            <span>Test Participant Account: {seedResult.details.seededUsers ? 'SEEDED/UPDATED' : 'UP-TO-DATE'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                            <span className="text-[8px]">{seedResult.details.seededPayments ? '🟢' : '⚪'}</span>
                            <span>Test Payment Receipt: {seedResult.details.seededPayments ? 'SEEDED/UPDATED' : 'UP-TO-DATE'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Setup Instructions Card */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest mb-1">FIREBASE INITIALIZATION PATHWAY</h4>
                    <p className="text-xs text-zinc-500 font-mono">Follow these steps to ensure durable Firestore database and Cloudinary storage persistence:</p>
                  </div>

                  <div className="space-y-4 text-xs font-mono text-zinc-400">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">1</div>
                      <div className="space-y-1">
                        <strong className="text-zinc-200">Firebase Applet Provisioning</strong>
                        <p>Your Firebase applet with Firestore database ID <code className="bg-zinc-900 text-purple-400 px-1 py-0.5 rounded">remixed-firestore-database-id</code> is already provisioned and fully bound within our environment.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">2</div>
                      <div className="space-y-1">
                        <strong className="text-zinc-200">Apply Firestore Rules</strong>
                        <p>Verify that your Firestore Security Rules allow read/write requests to the database. Below is the recommended security ruleset for production persistence.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">3</div>
                      <div className="space-y-1">
                        <strong className="text-zinc-200">Configure Cloudinary / Fallback Receipts Storage</strong>
                        <p>All receipts are uploaded to Cloudinary unsigned upload configuration, or fallback cleanly to base64 Data URLs for local/offline testing seamlessly.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Firestore Rules Code block */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">FIRESTORE SECURITY RULES SCRIPT</span>
                    <button
                      onClick={() => {
                        const rulesText = `rules_version = '2';\nservice cloud::firestore {\n  match /databases/{database}/documents {\n    match /admin_settings/{settingKey} {\n      allow read, write: if true;\n    }\n    match /users_account/{userPhone} {\n      allow read, write: if true;\n    }\n    match /payments/{paymentId} {\n      allow read, write: if true;\n    }\n  }\n}`;
                        navigator.clipboard.writeText(rulesText);
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          COPIED RULES!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          COPY RULES CODE
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-xl font-mono text-[10px] text-zinc-400 overflow-x-auto max-h-72 leading-relaxed whitespace-pre select-all">
{`rules_version = '2';
service cloud::firestore {
  match /databases/{database}/documents {
    match /admin_settings/{settingKey} {
      allow read, write: if true;
    }
    match /users_account/{userPhone} {
      allow read, write: if true;
    }
    match /payments/{paymentId} {
      allow read, write: if true;
    }
  }
}`}
                  </pre>
                </div>
              </div>
            ) : (
              filteredPayments.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-900 rounded-xl">
                  <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No transactions found matching this state.</p>
                </div>
              ) : (
                filteredPayments.map((payment) => (
                  <div 
                    key={payment.id}
                    className="bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 rounded-xl p-4 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 shrink-0">
                        <User className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white">{payment.email}</span>
                          {payment.status === 'approved' && (
                            <span className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono tracking-wider rounded-md uppercase font-semibold">
                              {payment.ownershipId}
                            </span>
                          )}
                          {(payment.passType === 'multiple' || payment.amount === '₦100,000') ? (
                            <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono tracking-wider rounded-md uppercase font-bold">
                              Multiple Games Pass (₦100,000)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-mono tracking-wider rounded-md uppercase font-bold">
                              Single Game Pass (₦25,000)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 flex flex-col gap-0.5 font-mono">
                          <span>Phone: {payment.phone}</span>
                          <span>Date: {payment.submittedAt.replace('T', ' ').slice(0, 19)}</span>
                          <span>Tx ID: <span className="text-zinc-400">{payment.id}</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Proof */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                      {/* View Proof Button */}
                      {payment.receiptDataUrl && (
                        <button
                          onClick={() => setSelectedReceipt(payment.receiptDataUrl)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-mono tracking-wider transition-all border border-zinc-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          RECEIPT
                        </button>
                      )}

                      {payment.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onReject(payment.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-950/30 hover:bg-red-900/30 text-red-400 rounded-lg text-xs font-mono tracking-wider transition-all border border-red-500/20"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            REJECT
                          </button>
                          <button
                            onClick={() => onApprove(payment.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 rounded-lg text-xs font-mono tracking-wider transition-all border border-emerald-500/30"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            APPROVE
                          </button>
                        </div>
                      )}

                      {payment.status === 'approved' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedQRRecord(payment)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-purple-300 rounded-lg text-xs font-mono tracking-wider transition-all border border-zinc-800"
                            title="Generate Mobile Validation QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5 text-purple-400" />
                            QR CODE
                          </button>
                          <button
                            onClick={() => onViewCertificate(payment)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/30 text-purple-300 rounded-lg text-xs font-mono tracking-wider transition-all border border-purple-500/30"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            CERTIFICATE
                          </button>
                        </div>
                      )}

                      {payment.status === 'rejected' && (
                        <span className="text-xs font-mono text-red-500 px-3 py-1 bg-red-950/20 border border-red-950 rounded-lg">
                          REJECTED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Info & Settings Panel */}
        <div className="space-y-6">
          {/* Lock Console Action Card */}
          <div className="bg-zinc-950/80 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 blur-2xl rounded-full" />
            <h3 className="text-sm font-semibold tracking-wider text-red-400 uppercase mb-3 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              SYSTEM CONSOLE STATUS
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed font-mono">
              The admin workspace is currently unlocked. Keep your credentials private.
            </p>
            <button
              onClick={() => {
                onLockConsole();
                onClose();
              }}
              className="w-full py-2.5 bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-red-200 text-xs font-mono tracking-widest uppercase rounded-xl transition-all"
            >
              Lock Admin Panel & Exit
            </button>
          </div>

          {/* Edit Bank Details Card */}
          <form onSubmit={handleBankSave} className="bg-zinc-950/80 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
            <h3 className="text-sm font-semibold tracking-wider text-purple-400 uppercase flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              EDIT TREASURY BANK
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono">
              Update banking details displayed to visitors claiming ownership passes.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={editBankName}
                  onChange={(e) => setEditBankName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Account Name</label>
                <input
                  type="text"
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Account Number</label>
                <input
                  type="text"
                  value={editAccountNumber}
                  onChange={(e) => setEditAccountNumber(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {bankFeedback && (
              <p className="text-xs text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-950 px-2 py-1.5 rounded-lg text-center">
                {bankFeedback}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-mono tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-purple-500/10"
            >
              Save Bank Details
            </button>
          </form>

          {/* Edit Passcode Card */}
          <form onSubmit={handlePasscodeSave} className="bg-zinc-950/80 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
            <h3 className="text-sm font-semibold tracking-wider text-purple-400 uppercase flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" />
              CHANGE PIN PASSCODE
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono">
              Update the 4-digit security code used to bypass the administrator authentication lock.
            </p>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">New 4-Digit Passcode</label>
              <input
                type="password"
                maxLength={4}
                value={editPasscode}
                onChange={(e) => setEditPasscode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-center text-xl tracking-[0.3em] font-black text-zinc-200 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            {passcodeError && (
              <p className="text-xs text-red-400 font-mono text-center">
                {passcodeError}
              </p>
            )}

            {passcodeFeedback && (
              <p className="text-xs text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-950 px-2 py-1.5 rounded-lg text-center">
                {passcodeFeedback}
              </p>
            )}

            <button
              type="submit"
              disabled={editPasscode.length !== 4}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-mono tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-purple-500/10 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              Update Passcode
            </button>
          </form>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-hidden">
          <div className="relative max-w-lg w-full max-h-[calc(100vh-2rem)] bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all z-10"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-mono tracking-wider text-white uppercase mb-4 flex-shrink-0">Payment Receipt Preview</h3>
            <div className="flex-grow overflow-y-auto min-h-0 border border-zinc-800 rounded-xl bg-zinc-900/60 flex items-center justify-center p-2">
              {selectedReceipt.startsWith('data:') || selectedReceipt.startsWith('http') ? (
                <ImageWithLoader 
                  src={selectedReceipt} 
                  alt="Receipt upload proof" 
                  className="max-w-full max-h-[50vh] object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                  containerClassName="max-w-full max-h-[50vh] flex items-center justify-center"
                />
              ) : (
                <div className="text-center p-6 text-zinc-500 font-mono text-xs">
                  <FileText className="w-12 h-12 text-purple-500/30 mx-auto mb-3" />
                  <span>Generic Receipt Proof Received</span>
                  <div className="text-[10px] text-zinc-600 mt-1">Transaction ID: {selectedReceipt}</div>
                </div>
              )}
            </div>
            <div className="mt-4 text-right flex-shrink-0">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono tracking-wider rounded-lg transition-all"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Validation QR Code Modal */}
      {selectedQRRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-hidden animate-fade-in">
          <div className="relative max-w-md w-full bg-[#05070B] border border-purple-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(139,92,246,0.15)] flex flex-col overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <button
              onClick={() => setSelectedQRRecord(null)}
              className="absolute top-4 right-4 p-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all z-10 border border-zinc-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
            
            <div className="text-center space-y-1.5 mb-6 flex-shrink-0">
              <span className="text-[9px] font-mono tracking-[0.25em] text-purple-400 uppercase font-bold block">
                OWNERSHIP VALIDATION SYSTEM
              </span>
              <h3 className="text-lg font-sans font-black text-white tracking-tight">
                MOBILE VERIFICATION QR CODE
              </h3>
              <div className="w-12 h-[1px] bg-purple-500/20 mx-auto mt-2" />
            </div>

            {/* QR Code Canvas/Image Area */}
            <div className="flex flex-col items-center justify-center p-6 bg-zinc-950/60 border border-zinc-900 rounded-2xl relative mb-5">
              
              {/* Scan target corners */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-purple-500/50" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-purple-500/50" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-purple-500/50" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-purple-500/50" />

              {/* Real QR Code using api.qrserver.com */}
              <div className="p-3 bg-white rounded-xl shadow-lg shadow-purple-500/5 hover:scale-[1.02] transition-transform duration-300">
                <ImageWithLoader 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    JSON.stringify({
                      owner: selectedQRRecord.fullName || 'HELOLEX Owner',
                      id: selectedQRRecord.ownershipId,
                      email: selectedQRRecord.email,
                      phone: selectedQRRecord.phone,
                      tier: selectedQRRecord.passType === 'multiple' ? 'Multiple' : 'Single',
                      verified: true,
                      timestamp: selectedQRRecord.submittedAt
                    })
                  )}`}
                  alt={`QR Code for ${selectedQRRecord.ownershipId}`} 
                  className="w-44 h-44 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Status Indicator */}
              <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-mono tracking-wider font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                VERIFIED OWNERSHIP SIGNATURE
              </div>
            </div>

            {/* Detailed metadata */}
            <div className="bg-zinc-900/40 border border-zinc-900/80 rounded-xl p-4 space-y-2.5 font-mono text-xs text-left mb-6">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">OWNERSHIP ID</span>
                <span className="text-white font-bold tracking-wider">{selectedQRRecord.ownershipId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">HOLDER NAME</span>
                <span className="text-zinc-300 font-bold truncate max-w-[180px]">{selectedQRRecord.fullName || 'Not Provided'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">PHONE ACCOUNT</span>
                <span className="text-zinc-300">{selectedQRRecord.phone}</span>
              </div>
              <div className="flex justify-between items-center pb-0">
                <span className="text-zinc-500">TIER TYPE</span>
                <span className={`font-black ${selectedQRRecord.passType === 'multiple' ? 'text-amber-400' : 'text-purple-400'}`}>
                  {selectedQRRecord.passType === 'multiple' ? 'MULTIPLE PASS (VIP)' : 'SINGLE GAME PASS'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedQRRecord.ownershipId || '');
                }}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono tracking-wider border border-zinc-800 rounded-xl transition-all"
              >
                COPY ID
              </button>
              <button
                onClick={() => setSelectedQRRecord(null)}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-mono tracking-wider rounded-xl transition-all shadow-md shadow-purple-500/10"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
