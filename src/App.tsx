/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PaymentRecord, BankDetails, UserAccount, SocialLink } from './types';
import KorlynPage from './components/KorlynPage';
import HelolexPage from './components/HelolexPage';
import AdminPanel from './components/AdminPanel';
import CertificateView from './components/CertificateView';
import UserDashboard from './components/UserDashboard';
import PrintCertificatePage from './components/PrintCertificatePage';
import SEOManager from './components/SEOManager';
import { Lock, ShieldAlert, AlertCircle, X, Check, Cpu } from 'lucide-react';
import {
  isSupabaseConfigured,
  supabase,
  fetchUsersFromSupabase,
  upsertUserToSupabase,
  fetchPaymentsFromSupabase,
  upsertPaymentToSupabase,
  fetchAdminSettingsFromSupabase,
  upsertAdminSettingToSupabase
} from './supabaseClient';
import { Toast } from './components/ToastAndConfetti';
import { NetworkStatusToast } from './components/NetworkStatusToast';



// Robust patch to prevent localStorage QuotaExceededError from heavy base64 images
try {
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key: string, value: string) => {
    try {
      let processedValue = value;
      if (key === 'korlyn_helolex_payments') {
        try {
          const payments = JSON.parse(value);
          if (Array.isArray(payments)) {
            const pruned = payments.map((p: any) => {
              if (p.receiptDataUrl && p.receiptDataUrl.startsWith('data:image/') && p.receiptDataUrl.length > 2000) {
                return {
                  ...p,
                  receiptDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%2318181b"/><text x="50%" y="55%" fill="%23a1a1aa" font-size="10" font-family="monospace" text-anchor="middle">Local Offline Cache</text></svg>'
                };
              }
              return p;
            });
            processedValue = JSON.stringify(pruned);
          }
        } catch (e) {
          console.warn('Error pruning payments for local storage:', e);
        }
      }
      originalSetItem(key, processedValue);
    } catch (error: any) {
      console.error(`Failed to write to localStorage for key "${key}":`, error);
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota') || error.code === 22) {
        try {
          // Attempt recovery: Clear cached payments to free space
          localStorage.removeItem('korlyn_helolex_payments');
        } catch (innerEx) {}
      }
    }
  };
} catch (e) {
  console.error('Failed to patch localStorage.setItem:', e);
}

const LOCAL_STORAGE_KEY = 'korlyn_helolex_payments';
const USERS_STORAGE_KEY = 'korlyn_helolex_users';

const getStoredReferrer24h = (): string | null => {
  try {
    const dataStr = localStorage.getItem('korlyn_active_referrer_24h');
    if (!dataStr) return null;
    const data = JSON.parse(dataStr);
    if (data && data.phone && data.expiresAt && Date.now() < data.expiresAt) {
      return data.phone;
    }
    localStorage.removeItem('korlyn_active_referrer_24h');
  } catch (e) {
    console.error('Error reading referral cache:', e);
  }
  return null;
};

const setStoredReferrer24h = (phone: string) => {
  try {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('korlyn_active_referrer_24h', JSON.stringify({ phone, expiresAt }));
  } catch (e) {
    console.error('Error writing referral cache:', e);
  }
};

export const normalizePhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('234')) {
    return '+' + clean;
  }
  if (clean.length === 10) {
    return '+234' + clean;
  }
  if (clean.length === 11 && clean.startsWith('0')) {
    return '+234' + clean.slice(1);
  }
  return '+' + clean;
};

const INITIAL_SEED_DATA: PaymentRecord[] = [
  {
    id: 'TXN-9021-X',
    email: 'marcus.vance@gamingminds.io',
    phone: '+2348031124589',
    receiptName: 'korlyn_treasury_wire_pass.jpg',
    receiptDataUrl: 'transaction_7482',
    status: 'approved',
    submittedAt: '2026-06-25T14:22:10-07:00',
    amount: '₦25,000',
    ownershipId: 'HLX-83921',
    issueDate: '2026-06-25'
  },
  {
    id: 'TXN-4109-M',
    email: 'elizabeth.monolith@creators.net',
    phone: '+2349058832911',
    receiptName: 'elizabeth_screenshot.png',
    receiptDataUrl: 'transaction_9281',
    status: 'pending',
    submittedAt: '2026-06-29T09:12:35-07:00',
    amount: '₦25,000'
  },
  {
    id: 'TXN-0129-Z',
    email: 'test.spambot@unverified.org',
    phone: '+15550192831',
    receiptName: 'forged_receipt.png',
    receiptDataUrl: 'transaction_0129',
    status: 'rejected',
    submittedAt: '2026-06-28T18:05:01-07:00',
    amount: '₦25,000'
  }
];

const INITIAL_USERS: UserAccount[] = [
  {
    phone: '+2348031124589',
    fullName: 'Marcus Vance',
    email: 'marcus.vance@gamingminds.io',
    createdAt: '2026-06-25T14:22:10-07:00',
    clicksCount: 42,
    registrationsCount: 8,
    purchasesCount: 3,
    points: 73,
  },
  {
    phone: '+2349058832911',
    fullName: 'Elizabeth Monolith',
    email: 'elizabeth.monolith@creators.net',
    createdAt: '2026-06-29T09:12:35-07:00',
    clicksCount: 12,
    registrationsCount: 2,
    purchasesCount: 0,
    points: 16,
  },
  {
    phone: '+15550192831',
    fullName: 'Test Spambot',
    email: 'test.spambot@unverified.org',
    createdAt: '2026-06-28T18:05:01-07:00',
    clicksCount: 0,
    registrationsCount: 0,
    purchasesCount: 0,
    points: 0,
  }
];

const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: 'HELOLEX Treasury Bank',
  accountName: 'KORLYN INFRASTRUCTURE LIMITED',
  accountNumber: '0124859302',
};

const DEFAULT_PASSCODE = '1234';

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { id: 'whatsapp', name: 'WhatsApp Community', url: 'https://chat.whatsapp.com/example', enabled: true },
  { id: 'instagram', name: 'Instagram', url: 'https://instagram.com/helolex', enabled: true },
  { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com/company/helolex', enabled: true },
  { id: 'telegram', name: 'Telegram', url: 'https://t.me/helolex', enabled: true },
  { id: 'twitter', name: 'X Twitter', url: 'https://x.com/helolex', enabled: true },
  { id: 'discord', name: 'Discord', url: 'https://discord.gg/helolex', enabled: true },
  { id: 'slack', name: 'Slack', url: 'https://helolex.slack.com', enabled: true },
  { id: 'facebook', name: 'Facebook', url: 'https://facebook.com/helolex', enabled: true }
];

export default function App() {
  const [currentView, setCurrentView] = useState<'korlyn' | 'helolex' | 'admin' | 'print-certificate'>('korlyn');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loggedInUserPhone, setLoggedInUserPhone] = useState<string | null>(() => {
    return localStorage.getItem('korlyn_logged_in_phone') || null;
  });
  const [viewingCertificatePayment, setViewingCertificatePayment] = useState<PaymentRecord | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('korlyn_theme') as 'light' | 'dark' | 'system') || 'system';
  });

  // Network connection status
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'unstable'>('online');

  // Monitor network status with listeners and a custom ping rate check
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
    };
    const handleOffline = () => {
      setNetworkStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setNetworkStatus('offline');
    }

    // Monitor Network Information API for "unstable"
    let connection: any = null;
    if ('connection' in navigator) {
      connection = (navigator as any).connection;
      const handleConnectionChange = () => {
        if (connection) {
          const isSlow = connection.saveData || 
                         connection.rtt > 500 || 
                         ['slow-2g', '2g', '3g'].includes(connection.effectiveType);
          if (isSlow && navigator.onLine) {
            setNetworkStatus('unstable');
          } else if (navigator.onLine) {
            setNetworkStatus('online');
          }
        }
      };
      connection.addEventListener('change', handleConnectionChange);
      handleConnectionChange();
    }

    // Active connection roundtrip ping check (self-hosted ping to bypass CORS)
    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        setNetworkStatus('offline');
        return;
      }
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        
        // Fetch index.html with a timestamp to ensure fresh connection speed assessment
        await fetch(`/index.html?t=${Date.now()}`, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        
        const latency = Date.now() - startTime;
        if (latency > 650) {
          setNetworkStatus('unstable');
        } else {
          setNetworkStatus('online');
        }
      } catch (err) {
        if (navigator.onLine) {
          setNetworkStatus('unstable');
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', () => {});
      }
      clearInterval(interval);
    };
  }, []);

  // Database loading overlay states
  const [dbLoading, setDbLoading] = useState(false);
  const [dbLoadingText, setDbLoadingText] = useState('Syncing records...');

  const withDbLoading = async <T,>(
    text: string, 
    fn: () => Promise<T>,
    fallbackAction?: () => T,
    background: boolean = false
  ): Promise<T | undefined> => {
    const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';
    // If offline connection to database stops immediately, unless local storage is disabled (database only mode)
    if (!isLSDisabled && (!navigator.onLine || networkStatus === 'offline')) {
      if (!background) {
        setToast({
          message: 'No internet connection. Operating offline with local cached data.',
          type: 'info'
        });
      }
      if (fallbackAction) {
        return fallbackAction();
      }
      return undefined;
    }

    if (!background) {
      setDbLoadingText(text);
      setDbLoading(true);
    }

    // Determine timeout: extend the timeout if network unstable (45s vs 20s), or if in database-only mode (90s for cold start)
    const isUnstable = networkStatus === 'unstable';
    const timeoutMs = isLSDisabled ? 90000 : (isUnstable ? 45000 : 30000);

    let timeoutId: any;
    let wakeUpWarningId: any;

    if (!background) {
      wakeUpWarningId = setTimeout(() => {
        setDbLoadingText('Supabase database is waking up from sleep mode (Free tier)... please stand by...');
        setToast({
          message: 'Database is waking up from sleep mode (this can take up to 30 seconds on the free tier). Please wait...',
          type: 'info'
        });
      }, 7000);
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, timeoutMs);
    });

    try {
      // Race our operation against the dynamic timeout
      const result = await Promise.race([
        fn(),
        timeoutPromise
      ]);
      return result;
    } catch (err: any) {
      // Trigger database functional health check immediately on query failure
      checkDatabaseFunctional();
      if (err.message === 'TIMEOUT') {
        console.warn(`Database connection timed out after ${timeoutMs / 1000}s.`);
        if (!background) {
          setToast({
            message: isLSDisabled
              ? 'Database took too long to wake up. Please refresh again shortly or check if your Supabase project is active.'
              : (isUnstable 
                  ? 'Connection is unstable and timed out. Synced to local cache.' 
                  : 'Database sync took too long. Operating in offline/hybrid mode.'),
            type: 'info'
          });
        }
        if (fallbackAction) {
          return fallbackAction();
        }
      } else {
        console.error('Database query failed:', err);
        if (!background) {
          setToast({
            message: isLSDisabled
              ? `Database query failed: ${err.message || 'unreachable'}. Please check if your Supabase project is paused.`
              : `Operation notice: ${err.message || 'database status unreachable. Saving locally.'}`,
            type: 'info'
          });
        }
      }
      return undefined;
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(wakeUpWarningId);
      if (!background) {
        setDbLoading(false);
      }
    }
  };

  // Database connection check state
  const [isDbFunctional, setIsDbFunctional] = useState<boolean | null>(null);
  const isDbFunctionalRef = useRef<boolean | null>(null);

  const checkDatabaseFunctional = async (): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
      if (isDbFunctionalRef.current !== false) {
        isDbFunctionalRef.current = false;
        setIsDbFunctional(false);
        setToast({
          message: 'Database disconnected',
          type: 'error'
        });
      }
      return false;
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 6000);
    });

    try {
      const dbQueryPromise = supabase.from('admin_settings').select('key').limit(1);
      const result = await Promise.race([dbQueryPromise, timeoutPromise]) as any;
      
      const error = result?.error;
      if (error) {
        const errorMsg = error.message?.toLowerCase() || '';
        const isNetworkErr = errorMsg.includes('fetch') ||
                            errorMsg.includes('network') ||
                            errorMsg.includes('timeout') ||
                            errorMsg.includes('aborted') ||
                            errorMsg.includes('failed to connect') ||
                            error.status === 0 ||
                            error.status === 502 ||
                            error.status === 503 ||
                            error.status === 504 ||
                            error.code === 'TypeError';
        if (isNetworkErr) {
          if (isDbFunctionalRef.current !== false) {
            isDbFunctionalRef.current = false;
            setIsDbFunctional(false);
            setToast({
              message: 'Database disconnected',
              type: 'error'
            });
          }
          return false;
        }
      }

      if (isDbFunctionalRef.current === false) {
        isDbFunctionalRef.current = true;
        setIsDbFunctional(true);
        setToast({
          message: 'Database reconnected successfully.',
          type: 'success'
        });
      } else if (isDbFunctionalRef.current === null) {
        isDbFunctionalRef.current = true;
        setIsDbFunctional(true);
      }
      return true;
    } catch (err: any) {
      if (isDbFunctionalRef.current !== false) {
        isDbFunctionalRef.current = false;
        setIsDbFunctional(false);
        setToast({
          message: 'Database disconnected',
          type: 'error'
        });
      }
      return false;
    }
  };

  // Periodic database connection check (every 15 seconds)
  useEffect(() => {
    checkDatabaseFunctional();
    const intervalId = setInterval(() => {
      checkDatabaseFunctional();
    }, 15000);
    return () => clearInterval(intervalId);
  }, []);

  // Local storage disabled state
  const [disableLocalStorage, setDisableLocalStorage] = useState<boolean>(() => {
    return localStorage.getItem('korlyn_disable_local_storage') === 'true';
  });

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Admin and Bank Details states
  const [bankDetails, setBankDetails] = useState<BankDetails>(() => {
    const saved = localStorage.getItem('korlyn_bank_details');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_BANK_DETAILS;
      }
    }
    return DEFAULT_BANK_DETAILS;
  });

  const [adminPasscode, setAdminPasscode] = useState<string>(() => {
    return localStorage.getItem('korlyn_admin_passcode') || DEFAULT_PASSCODE;
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('korlyn_admin_unlocked') === 'true';
  });

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => {
    const saved = localStorage.getItem('korlyn_social_links');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_SOCIAL_LINKS;
      }
    }
    return DEFAULT_SOCIAL_LINKS;
  });

  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeValidationFeedback, setPasscodeValidationFeedback] = useState<'none' | 'success' | 'error'>('none');

  // Client-Side Router handling paths (/helolex, /admin, /) and hashes (#/helolex)
  const navigateTo = (view: 'korlyn' | 'helolex' | 'admin') => {
    setCurrentView(view);
    const newPath = view === 'korlyn' ? '/' : `/${view}`;
    window.history.pushState(null, '', newPath);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/print-certificate' || hash.startsWith('#/print-certificate') || path.startsWith('/print-certificate')) {
        setCurrentView('print-certificate');
      } else if (path === '/helolex' || hash === '#/helolex' || hash === '#helolex') {
        setCurrentView('helolex');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
        setCurrentView('admin');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        setCurrentView('korlyn');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    // Run on initial mount
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Handle HTML document theme classes
  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('korlyn_theme', theme);

    const applyTheme = (t: 'light' | 'dark' | 'system') => {
      root.classList.remove('light', 'dark');
      if (t === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(t);
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Initialize and load state
  useEffect(() => {
    const initData = async () => {
      const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';
      
      let loadedPayments = INITIAL_SEED_DATA;
      let loadedUsers = INITIAL_USERS;
      let loadedBankDetails = DEFAULT_BANK_DETAILS;
      let loadedPasscode = DEFAULT_PASSCODE;
      let loadedSocialLinks = DEFAULT_SOCIAL_LINKS;

      if (!isLSDisabled) {
        const savedPayments = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedPayments) {
          try { loadedPayments = JSON.parse(savedPayments); } catch (e) {}
        }
        const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (savedUsers) {
          try { loadedUsers = JSON.parse(savedUsers); } catch (e) {}
        }
        const savedBank = localStorage.getItem('korlyn_bank_details');
        if (savedBank) {
          try { loadedBankDetails = JSON.parse(savedBank); } catch (e) {}
        }
        const savedPass = localStorage.getItem('korlyn_admin_passcode');
        if (savedPass) { loadedPasscode = savedPass; }
        const savedLinks = localStorage.getItem('korlyn_social_links');
        if (savedLinks) {
          try { loadedSocialLinks = JSON.parse(savedLinks); } catch (e) {}
        }
      } else {
        loadedPayments = [];
        loadedUsers = [];
      }

      setPayments(loadedPayments);
      setUsers(loadedUsers);
      setBankDetails(loadedBankDetails);
      setAdminPasscode(loadedPasscode);
      setSocialLinks(loadedSocialLinks);

      if (isSupabaseConfigured()) {
        await withDbLoading('Fetching and synchronizing live registry databases...', async () => {
          console.log('Synchronizing state with live Supabase database...');
          let dbErrorOccurred = false;
          
          // Fetch Admin Settings
          const settings = await fetchAdminSettingsFromSupabase();
          if (settings !== null) {
            if (settings.bankDetails) setBankDetails(settings.bankDetails);
            if (settings.adminPasscode) setAdminPasscode(settings.adminPasscode);
            if (settings.socialLinks) setSocialLinks(settings.socialLinks);

            // Sync disable_local_storage setting from database
            try {
              const { data: lsSettingData, error: lsSettingError } = await supabase!
                .from('admin_settings')
                .select('value')
                .eq('key', 'disable_local_storage')
                .maybeSingle();
                
              if (!lsSettingError && lsSettingData) {
                const isDbLSDisabled = lsSettingData.value === 'true';
                setDisableLocalStorage(isDbLSDisabled);
                localStorage.setItem('korlyn_disable_local_storage', isDbLSDisabled ? 'true' : 'false');
              }
            } catch (e) {
              console.error('Error fetching disable_local_storage setting:', e);
            }
          } else {
            dbErrorOccurred = true;
          }

          // Fetch Users
          const dbUsers = await fetchUsersFromSupabase();
          if (dbUsers !== null) {
            setUsers(dbUsers);
          } else {
            dbErrorOccurred = true;
          }

          // Fetch Payments
          const dbPayments = await fetchPaymentsFromSupabase();
          if (dbPayments !== null) {
            setPayments(dbPayments);
          } else {
            dbErrorOccurred = true;
          }

          if (dbErrorOccurred) {
            console.warn('Database connection or schema warning: some live tables are not initialized yet. Operating in hybrid/local cache mode.');
            setToast({
              message: 'Operating in local cache/offline mode. Admin can verify and seed live tables via database diagnostics.',
              type: 'info'
            });
          } else {
            const isCurrentlyLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';
            if (!isCurrentlyLSDisabled) {
              if (settings) {
                if (settings.bankDetails) localStorage.setItem('korlyn_bank_details', JSON.stringify(settings.bankDetails));
                if (settings.adminPasscode) localStorage.setItem('korlyn_admin_passcode', settings.adminPasscode);
                if (settings.socialLinks) localStorage.setItem('korlyn_social_links', JSON.stringify(settings.socialLinks));
              }
              if (dbUsers) localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(dbUsers));
              if (dbPayments) localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbPayments));
            }
          }
        }, undefined, !isLSDisabled);
      } else {
        if (isLSDisabled) {
          setToast({
            message: 'Local storage is disabled, but Supabase is not configured! Data will not persist across reloads.',
            type: 'error'
          });
        }
      }
    };

    initData();
  }, []);

  // 30-second background sync system for hybrid cache
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const performBackgroundSync = async () => {
      await withDbLoading('Syncing data in background...', async () => {
        const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';

        // 1. Fetch and update Admin Settings
        const settings = await fetchAdminSettingsFromSupabase();
        if (settings !== null) {
          if (settings.bankDetails) {
            setBankDetails(settings.bankDetails);
            if (!isLSDisabled) localStorage.setItem('korlyn_bank_details', JSON.stringify(settings.bankDetails));
          }
          if (settings.adminPasscode) {
            setAdminPasscode(settings.adminPasscode);
            if (!isLSDisabled) localStorage.setItem('korlyn_admin_passcode', settings.adminPasscode);
          }
          if (settings.socialLinks) {
            setSocialLinks(settings.socialLinks);
            if (!isLSDisabled) localStorage.setItem('korlyn_social_links', JSON.stringify(settings.socialLinks));
          }
        }

        // 2. Fetch and update Users
        const dbUsers = await fetchUsersFromSupabase();
        if (dbUsers !== null) {
          setUsers(dbUsers);
          if (!isLSDisabled) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(dbUsers));
          }
        }

        // 3. Fetch and update Payments
        const dbPayments = await fetchPaymentsFromSupabase();
        if (dbPayments !== null) {
          setPayments(dbPayments);
          if (!isLSDisabled) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbPayments));
          }
        }
      }, undefined, true); // true for background execution
    };

    const intervalId = setInterval(performBackgroundSync, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Referral link tracking on initial load with 24-hour expiration
  useEffect(() => {
    const trackReferralClick = async () => {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      if (refParam) {
        const normalizedRef = normalizePhone(refParam);
        
        // 24h cache lookup (bypassing local/session storage settings)
        const cachedReferrer = getStoredReferrer24h();
        
        if (!cachedReferrer) {
          // No phone number found in browser storage, tracking a new click!
          console.log(`Tracking fresh referral click for referrer: ${normalizedRef}`);
          
          await withDbLoading('Registering referral link entry...', async () => {
            // Update database if Supabase is configured
            if (isSupabaseConfigured() && supabase) {
              try {
                // Fetch the referrer user
                const { data: refUserRow, error: fetchErr } = await supabase
                  .from('users_account')
                  .select('*')
                  .eq('phone', normalizedRef)
                  .maybeSingle();
                
                if (!fetchErr && refUserRow) {
                  // Reference user exists, update their click details
                  const { error: updateErr } = await supabase
                    .from('users_account')
                    .update({
                      clicks_count: (refUserRow.clicks_count || 0) + 1,
                      points: (refUserRow.points || 0) + 1
                    })
                    .eq('phone', normalizedRef);
                    
                  if (updateErr) {
                    console.error('Error incrementing click count in Supabase:', updateErr);
                  }
                } else if (!refUserRow) {
                  // Referrer doesn't exist yet, register them as a placeholder
                  const { error: insertErr } = await supabase
                    .from('users_account')
                    .insert({
                      phone: normalizedRef,
                      clicks_count: 1,
                      points: 1,
                      registrations_count: 0,
                      purchases_count: 0,
                      created_at: new Date().toISOString()
                    });
                  if (insertErr) {
                    console.error('Error creating referrer placeholder in Supabase:', insertErr);
                  }
                }
              } catch (dbEx) {
                console.error('Supabase error tracking referral click:', dbEx);
              }
            }
            
            // Sync React State
            setUsers((prevUsers) => {
              const userExists = prevUsers.some(u => normalizePhone(u.phone) === normalizedRef);
              let updated: UserAccount[];
              if (userExists) {
                updated = prevUsers.map((u) => {
                  if (normalizePhone(u.phone) === normalizedRef) {
                    return {
                      ...u,
                      clicksCount: u.clicksCount + 1,
                      points: u.points + 1
                    };
                  }
                  return u;
                });
              } else {
                updated = [
                  ...prevUsers,
                  {
                    phone: normalizedRef,
                    clicksCount: 1,
                    registrationsCount: 0,
                    purchasesCount: 0,
                    points: 1,
                    createdAt: new Date().toISOString()
                  }
                ];
              }
              // Save to localStorage if allowed
              const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';
              if (!isLSDisabled) {
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
              }
              return updated;
            });
            
            // Save referral reference in browser for 24 hours only
            setStoredReferrer24h(normalizedRef);
            // Also store in sessionStorage for backward-compatibility
            sessionStorage.setItem('korlyn_active_referrer', normalizedRef);
          }, undefined, true);
        } else {
          console.log(`Referral link active. Already cached in browser: ${cachedReferrer}`);
          sessionStorage.setItem('korlyn_active_referrer', cachedReferrer);
        }
      }
    };

    trackReferralClick();
  }, []);

  // Manual refresh system to pull the freshest state from Supabase and sync with localStorage cache
  const handleRefreshData = async () => {
    if (!isSupabaseConfigured()) return;

    // Use withDbLoading with background execution so we don't display a modal overlay,
    // keeping the refresh process extremely smooth and seamless.
    await withDbLoading('Fetching live update from database...', async () => {
      const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';

      // 1. Fetch latest admin settings
      const settings = await fetchAdminSettingsFromSupabase();
      if (settings !== null) {
        if (settings.bankDetails) {
          setBankDetails(settings.bankDetails);
          if (!isLSDisabled) localStorage.setItem('korlyn_bank_details', JSON.stringify(settings.bankDetails));
        }
        if (settings.adminPasscode) {
          setAdminPasscode(settings.adminPasscode);
          if (!isLSDisabled) localStorage.setItem('korlyn_admin_passcode', settings.adminPasscode);
        }
        if (settings.socialLinks) {
          setSocialLinks(settings.socialLinks);
          if (!isLSDisabled) localStorage.setItem('korlyn_social_links', JSON.stringify(settings.socialLinks));
        }
      }

      // 2. Fetch latest users
      const dbUsers = await fetchUsersFromSupabase();
      if (dbUsers !== null) {
        setUsers(dbUsers);
        if (!isLSDisabled) {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(dbUsers));
        }
      }

      // 3. Fetch latest payments
      const dbPayments = await fetchPaymentsFromSupabase();
      if (dbPayments !== null) {
        setPayments(dbPayments);
        if (!isLSDisabled) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbPayments));
        }
      }
    }, undefined, true); // true for background execution
  };

  // Update helpers
  const updateAndSavePayments = async (newPayments: PaymentRecord[]) => {
    setPayments(newPayments);
    const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';
    if (!isLSDisabled) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPayments));
    }
    if (isSupabaseConfigured()) {
      await withDbLoading('Saving payment records to live cloud database...', async () => {
        let success = true;
        for (const p of newPayments) {
          const ok = await upsertPaymentToSupabase(p);
          if (!ok) success = false;
        }
        if (!success) {
          setToast({
            message: 'Failed to save payments to the database.',
            type: 'error'
          });
        }
      });
    } else if (isLSDisabled) {
      setToast({
        message: 'Database not accessible. Cannot save payments.',
        type: 'error'
      });
    }
  };

  const updateAndSaveUsers = async (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';
    if (!isLSDisabled) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));
    }
    if (isSupabaseConfigured()) {
      await withDbLoading('Saving user profiles to live cloud database...', async () => {
        let success = true;
        for (const u of newUsers) {
          const ok = await upsertUserToSupabase(u);
          if (!ok) success = false;
        }
        if (!success) {
          setToast({
            message: 'Failed to save users to the database.',
            type: 'error'
          });
        }
      });
    } else if (isLSDisabled) {
      setToast({
        message: 'Database not accessible. Cannot save users.',
        type: 'error'
      });
    }
  };

  // Submit payment handler
  const handleSubmitPayment = async (
    email: string,
    phone: string,
    receiptDataUrl: string,
    receiptName: string,
    fullName: string,
    amount: string = '₦25,000',
    passType?: 'single' | 'multiple'
  ) => {
    const normalizedPhoneVal = normalizePhone(phone);
    const newRecord: PaymentRecord = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      email,
      phone: normalizedPhoneVal,
      receiptName,
      receiptDataUrl,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      amount,
      passType: passType || (amount === '₦100,000' ? 'multiple' : 'single'),
      fullName
    };
    
    await withDbLoading('Uploading wire dispatch proof & synchronizing database...', async () => {
      const updated = [newRecord, ...payments];
      setPayments(updated);
      const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';
      if (!isLSDisabled) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      if (isSupabaseConfigured()) {
        const ok = await upsertPaymentToSupabase(newRecord);
        if (!ok) {
          setToast({
            message: 'Failed to save payment to the database.',
            type: 'error'
          });
        }
      }

      // Sync info into user's account from the freshest state
      let currentUsers = [...users];
      if (!isLSDisabled) {
        const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (savedUsers) {
          try {
            currentUsers = JSON.parse(savedUsers);
          } catch (e) {}
        }
      }

      const updatedUsers = currentUsers.map((u) => {
        if (normalizePhone(u.phone) === normalizedPhoneVal) {
          return {
            ...u,
            fullName: fullName || u.fullName,
            email: email || u.email,
            passType: passType || u.passType || (amount === '₦100,000' ? 'multiple' : 'single')
          };
        }
        return u;
      });
      setUsers(updatedUsers);
      if (!isLSDisabled) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      }
      if (isSupabaseConfigured()) {
        const matched = updatedUsers.find(u => normalizePhone(u.phone) === normalizedPhoneVal);
        if (matched) {
          await upsertUserToSupabase(matched);
        }
      }

      // Fetch fresh data for the user's dashboard before closing the overlay
      if (isSupabaseConfigured()) {
        const freshPayments = await fetchPaymentsFromSupabase();
        if (freshPayments) {
          setPayments(freshPayments);
          if (!isLSDisabled) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(freshPayments));
          }
        }
        const freshUsers = await fetchUsersFromSupabase();
        if (freshUsers) {
          setUsers(freshUsers);
          if (!isLSDisabled) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(freshUsers));
          }
        }
      }
      // Brief visual holding period to complete the presentation transition
      await new Promise((resolve) => setTimeout(resolve, 800));
    });
  };

  // Approve payment handler
  const handleApprovePayment = async (id: string) => {
    await withDbLoading('Processing license approval & crediting referral points...', async () => {
      let approvedPhone: string | undefined;
      let approvedRecord: PaymentRecord | undefined;
      
      const updated = payments.map((p) => {
        if (p.id === id) {
          approvedPhone = p.phone;
          const randomPassNum = Math.floor(10000 + Math.random() * 90000);
          const rec = {
            ...p,
            status: 'approved' as const,
            ownershipId: `HLX-${randomPassNum}`,
            issueDate: new Date().toISOString().split('T')[0]
          };
          approvedRecord = rec;
          return rec;
        }
        return p;
      });
      
      setPayments(updated);
      const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';
      if (!isLSDisabled) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      
      if (isSupabaseConfigured() && approvedRecord) {
        await upsertPaymentToSupabase(approvedRecord);
      }

      // Credit referrer with +5 points if the approved user has a referrer
      if (approvedPhone) {
        const normalizedUserPhone = normalizePhone(approvedPhone);
        let currentUsers = [...users];
        if (!isLSDisabled) {
          const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
          if (savedUsers) {
            try {
              currentUsers = JSON.parse(savedUsers);
            } catch (e) {}
          }
        }
        const userObj = currentUsers.find(u => normalizePhone(u.phone) === normalizedUserPhone);
        if (userObj && userObj.referredBy) {
          const refPhone = normalizePhone(userObj.referredBy);
          let updatedReferrerObj: UserAccount | undefined;
          
          const updatedUsers = currentUsers.map((u) => {
            if (normalizePhone(u.phone) === refPhone) {
              const updatedU = {
                ...u,
                purchasesCount: (u.purchasesCount || 0) + 1,
                points: (u.points || 0) + 5
              };
              updatedReferrerObj = updatedU;
              return updatedU;
            }
            return u;
          });
          
          setUsers(updatedUsers);
          if (!isLSDisabled) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
          }
          if (isSupabaseConfigured() && updatedReferrerObj) {
            await upsertUserToSupabase(updatedReferrerObj);
          }
        }
      }
    });
  };

  // Reject payment handler
  const handleRejectPayment = async (id: string) => {
    await withDbLoading('Processing transaction decline...', async () => {
      let rejectedRecord: PaymentRecord | undefined;
      const updated = payments.map((p) => {
        if (p.id === id) {
          const rec = {
            ...p,
            status: 'rejected' as const
          };
          rejectedRecord = rec;
          return rec;
        }
        return p;
      });
      
      setPayments(updated);
      const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';
      if (!isLSDisabled) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      if (isSupabaseConfigured() && rejectedRecord) {
        await upsertPaymentToSupabase(rejectedRecord);
      }
    });
  };

  // Update profile details
  const handleUpdateProfile = (fullName: string, email: string) => {
    if (!loggedInUserPhone) return;
    const normalized = normalizePhone(loggedInUserPhone);
    const updatedUsers = users.map((u) => {
      if (normalizePhone(u.phone) === normalized) {
        return {
          ...u,
          fullName,
          email
        };
      }
      return u;
    });
    updateAndSaveUsers(updatedUsers);
  };

  const handleUpdateBankDetails = (newDetails: BankDetails) => {
    setBankDetails(newDetails);
    if (!disableLocalStorage) {
      localStorage.setItem('korlyn_bank_details', JSON.stringify(newDetails));
    }
    if (isSupabaseConfigured()) {
      upsertAdminSettingToSupabase('bank_details', JSON.stringify(newDetails)).then((ok) => {
        if (!ok) setToast({ message: 'Failed to save bank details to the database.', type: 'error' });
      });
    } else if (disableLocalStorage) {
      setToast({ message: 'Database not accessible. Cannot save bank details.', type: 'error' });
    }
  };

  const handleUpdatePasscode = (newPasscode: string) => {
    setAdminPasscode(newPasscode);
    if (!disableLocalStorage) {
      localStorage.setItem('korlyn_admin_passcode', newPasscode);
    }
    if (isSupabaseConfigured()) {
      upsertAdminSettingToSupabase('admin_passcode', newPasscode).then((ok) => {
        if (!ok) setToast({ message: 'Failed to save passcode to the database.', type: 'error' });
      });
    } else if (disableLocalStorage) {
      setToast({ message: 'Database not accessible. Cannot save passcode.', type: 'error' });
    }
  };

  const handleUpdateSocialLinks = (newLinks: SocialLink[]) => {
    setSocialLinks(newLinks);
    if (!disableLocalStorage) {
      localStorage.setItem('korlyn_social_links', JSON.stringify(newLinks));
    }
    if (isSupabaseConfigured()) {
      upsertAdminSettingToSupabase('social_links', JSON.stringify(newLinks)).then((ok) => {
        if (!ok) setToast({ message: 'Failed to save social links to the database.', type: 'error' });
      });
    } else if (disableLocalStorage) {
      setToast({ message: 'Database not accessible. Cannot save social links.', type: 'error' });
    }
  };

  const handleToggleDisableLocalStorage = async (disabled: boolean) => {
    setDisableLocalStorage(disabled);
    localStorage.setItem('korlyn_disable_local_storage', disabled ? 'true' : 'false');
    
    if (disabled) {
      // Clear cache from local storage when disabled
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(USERS_STORAGE_KEY);
      localStorage.removeItem('korlyn_bank_details');
      localStorage.removeItem('korlyn_admin_passcode');
      localStorage.removeItem('korlyn_social_links');
    } else {
      // Sync React state to local storage when re-enabled
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payments));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      localStorage.setItem('korlyn_bank_details', JSON.stringify(bankDetails));
      localStorage.setItem('korlyn_admin_passcode', adminPasscode);
      localStorage.setItem('korlyn_social_links', JSON.stringify(socialLinks));
    }

    if (isSupabaseConfigured()) {
      const ok = await upsertAdminSettingToSupabase('disable_local_storage', disabled ? 'true' : 'false');
      if (!ok) {
        setToast({
          message: 'Failed to sync local storage configuration to the database.',
          type: 'error'
        });
      } else {
        setToast({
          message: disabled 
            ? 'Local storage disabled. App is running purely on live database storage.' 
            : 'Local storage re-enabled successfully.',
          type: 'success'
        });
      }
    } else {
      if (disabled) {
        setToast({
          message: 'Warning: Local storage disabled, but Supabase is not configured! Data will not persist across reloads.',
          type: 'error'
        });
      } else {
        setToast({
          message: 'Local storage re-enabled successfully.',
          type: 'success'
        });
      }
    }
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPasscode === adminPasscode) {
      setIsAdminUnlocked(true);
      localStorage.setItem('korlyn_admin_unlocked', 'true');
      setIsPasscodeModalOpen(false);
      setEnteredPasscode('');
      setPasscodeValidationFeedback('none');
      navigateTo('admin');
    } else {
      setPasscodeValidationFeedback('error');
      setTimeout(() => {
        setEnteredPasscode('');
        setPasscodeValidationFeedback('none');
      }, 1200);
    }
  };

  const handleTriggerLock = () => {
    setIsAdminUnlocked(false);
    localStorage.removeItem('korlyn_admin_unlocked');
  };

  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  return (
    <main className="min-h-screen dark:bg-[#05070B] bg-slate-50 dark:text-zinc-300 text-zinc-700 relative select-none transition-colors duration-300">
      <SEOManager currentView={currentView} />
      {/* View Switcher Router */}
      {currentView === 'korlyn' && (
        <KorlynPage 
          onExploreHelolex={() => navigateTo('helolex')} 
          onOpenAdmin={() => navigateTo('admin')}
          pendingCount={pendingCount}
          theme={theme}
          setTheme={setTheme}
          isAdminUnlocked={isAdminUnlocked}
          onHoldTrigger={() => setIsPasscodeModalOpen(true)}
        />
      )}

      {currentView === 'helolex' && (
        loggedInUserPhone ? (
          <UserDashboard
            user={users.find(u => normalizePhone(u.phone) === normalizePhone(loggedInUserPhone)) || {
              phone: loggedInUserPhone,
              fullName: '',
              email: '',
              createdAt: new Date().toISOString(),
              clicksCount: 0,
              registrationsCount: 0,
              purchasesCount: 0,
              points: 0,
            }}
            allUsers={users}
            allPayments={payments}
            payment={payments.find(p => normalizePhone(p.phone) === normalizePhone(loggedInUserPhone))}
            onLogout={() => {
              setLoggedInUserPhone(null);
              localStorage.removeItem('korlyn_logged_in_phone');
            }}
            onSubmitPayment={handleSubmitPayment}
            theme={theme}
            setTheme={setTheme}
            bankDetails={bankDetails}
            onUpdateProfile={handleUpdateProfile}
            socialLinks={socialLinks}
            onRefresh={handleRefreshData}
          />
        ) : (
          <HelolexPage 
            onBackToKorlyn={() => navigateTo('korlyn')} 
            onOpenAdmin={() => navigateTo('admin')}
            onSubmitPayment={handleSubmitPayment}
            payments={payments}
            onViewCertificate={setViewingCertificatePayment}
            pendingCount={pendingCount}
            theme={theme}
            setTheme={setTheme}
            bankDetails={bankDetails}
            isAdminUnlocked={isAdminUnlocked}
            users={users}
            onLogin={(phoneVal) => {
              const normalized = normalizePhone(phoneVal);
              setLoggedInUserPhone(normalized);
              localStorage.setItem('korlyn_logged_in_phone', normalized);
            }}
            onRegisterNewUser={async (phoneVal, refPhoneVal, fullNameVal = '', emailVal = '', passTypeVal) => {
              const normalized = normalizePhone(phoneVal);
              const activeRef = refPhoneVal || getStoredReferrer24h() || undefined;
              const normalizedRef = activeRef ? normalizePhone(activeRef) : undefined;
              
              await withDbLoading('Securing ownership registry & mapping referral network...', async () => {
                let currentUsers = [...users];
                
                // Fetch freshest list from DB
                if (isSupabaseConfigured() && supabase) {
                  const dbUsers = await fetchUsersFromSupabase();
                  if (dbUsers) {
                    currentUsers = dbUsers;
                  }
                }
                
                const userExists = currentUsers.some(u => normalizePhone(u.phone) === normalized);
                let updatedUsers: UserAccount[] = [];
                let referrersToUpsert: UserAccount[] = [];
                
                if (!userExists) {
                  // New registration
                  const newUser: UserAccount = {
                    phone: normalized,
                    fullName: fullNameVal,
                    email: emailVal,
                    createdAt: new Date().toISOString(),
                    referredBy: normalizedRef,
                    clicksCount: 0,
                    registrationsCount: 0,
                    purchasesCount: 0,
                    points: 0,
                    passType: passTypeVal
                  };
                  
                  if (normalizedRef) {
                    currentUsers = currentUsers.map((u) => {
                      if (normalizePhone(u.phone) === normalizedRef) {
                        const updatedU = {
                          ...u,
                          registrationsCount: (u.registrationsCount || 0) + 1,
                          points: (u.points || 0) + 2
                        };
                        referrersToUpsert.push(updatedU);
                        return updatedU;
                      }
                      return u;
                    });
                    
                    // Fallback to fetch referrer directly from DB if not in local list
                    if (referrersToUpsert.length === 0 && isSupabaseConfigured() && supabase) {
                      const { data: extRefRow } = await supabase
                        .from('users_account')
                        .select('*')
                        .eq('phone', normalizedRef)
                        .maybeSingle();
                        
                      if (extRefRow) {
                        const updatedExtRef = {
                          phone: extRefRow.phone,
                          fullName: extRefRow.full_name || undefined,
                          email: extRefRow.email || undefined,
                          createdAt: extRefRow.created_at,
                          referredBy: extRefRow.referred_by || undefined,
                          clicksCount: extRefRow.clicks_count || 0,
                          registrationsCount: (extRefRow.registrations_count || 0) + 1,
                          purchasesCount: extRefRow.purchases_count || 0,
                          points: (extRefRow.points || 0) + 2,
                          passType: extRefRow.pass_type || undefined
                        };
                        referrersToUpsert.push(updatedExtRef);
                      }
                    }
                  }
                  
                  currentUsers.push(newUser);
                  updatedUsers = currentUsers;
                  
                  if (isSupabaseConfigured() && supabase) {
                    await upsertUserToSupabase(newUser);
                    for (const r of referrersToUpsert) {
                      await upsertUserToSupabase(r);
                    }
                  }
                } else {
                  // Existing update
                  currentUsers = currentUsers.map((u) => {
                    if (normalizePhone(u.phone) === normalized) {
                      return {
                        ...u,
                        fullName: fullNameVal || u.fullName,
                        email: emailVal || u.email,
                        passType: passTypeVal || u.passType
                      };
                    }
                    return u;
                  });
                  updatedUsers = currentUsers;
                  
                  if (isSupabaseConfigured() && supabase) {
                    const matched = updatedUsers.find(u => normalizePhone(u.phone) === normalized);
                    if (matched) {
                      await upsertUserToSupabase(matched);
                    }
                  }
                }
                
                setUsers(updatedUsers);
                const isLSDisabled = localStorage.getItem('korlyn_disable_local_storage') === 'true';
                if (!isLSDisabled) {
                  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
                }

                // Log the user in to reveal their dashboard state in the background
                setLoggedInUserPhone(normalized);
                localStorage.setItem('korlyn_logged_in_phone', normalized);

                // Fetch latest payments and users list to ensure dashboard is 100% updated with freshest records
                if (isSupabaseConfigured()) {
                  const freshPayments = await fetchPaymentsFromSupabase();
                  if (freshPayments) {
                    setPayments(freshPayments);
                    if (!isLSDisabled) {
                      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(freshPayments));
                    }
                  }
                  const freshUsers = await fetchUsersFromSupabase();
                  if (freshUsers) {
                    setUsers(freshUsers);
                    if (!isLSDisabled) {
                      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(freshUsers));
                    }
                  }
                }
                
                // Keep the loader open for a tiny bit for a flawless screen transition
                await new Promise((resolve) => setTimeout(resolve, 800));
              });
            }}
          />
        )
      )}

      {currentView === 'admin' && (
        <AdminPanel 
          payments={payments}
          users={users}
          onApprove={handleApprovePayment}
          onReject={handleRejectPayment}
          onViewCertificate={setViewingCertificatePayment}
          onClose={() => navigateTo('korlyn')}
          theme={theme}
          setTheme={setTheme}
          bankDetails={bankDetails}
          onUpdateBankDetails={handleUpdateBankDetails}
          adminPasscode={adminPasscode}
          onUpdatePasscode={handleUpdatePasscode}
          onLockConsole={handleTriggerLock}
          socialLinks={socialLinks}
          onUpdateSocialLinks={handleUpdateSocialLinks}
          disableLocalStorage={disableLocalStorage}
          onToggleDisableLocalStorage={handleToggleDisableLocalStorage}
          onRefresh={handleRefreshData}
        />
      )}

      {currentView === 'print-certificate' && (() => {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const phoneParam = params.get('phone') || hashParams.get('phone') || '';
        const paymentIdParam = params.get('paymentId') || hashParams.get('paymentId') || '';
        
        const printPayment = payments.find(p => p.id === paymentIdParam || (phoneParam && normalizePhone(p.phone) === normalizePhone(phoneParam)));
        const printUser = users.find(u => (printPayment && normalizePhone(u.phone) === normalizePhone(printPayment.phone)) || (phoneParam && normalizePhone(u.phone) === normalizePhone(phoneParam)));
        
        return (
          <PrintCertificatePage 
            payment={printPayment} 
            user={printUser} 
          />
        );
      })()}

      {/* Floating Developer/Evaluator Assist Dock at bottom right - hidden when admin panel is locked */}
      {isAdminUnlocked && (
        <div className="fixed bottom-4 left-4 z-30 no-print flex gap-2">
          <button
            onClick={() => navigateTo('admin')}
            id="btn-quick-admin-dock"
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-950/90 hover:bg-purple-900 border border-purple-500/30 text-white font-mono text-[10px] tracking-wider rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            ADMIN SYSTEM PANEL ({pendingCount} pending)
          </button>
          {currentView !== 'korlyn' && (
            <button
              onClick={() => navigateTo('korlyn')}
              className="px-3 py-2 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[10px] tracking-wider rounded-full shadow-lg transition-all"
            >
              ← KORLYN HOME
            </button>
          )}
          {currentView !== 'helolex' && (
            <button
              onClick={() => navigateTo('helolex')}
              className="px-3 py-2 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[10px] tracking-wider rounded-full shadow-lg transition-all"
            >
              🎮 HELOLEX HOME
            </button>
          )}
        </div>
      )}

      {/* PIN Passcode Unlock Popup Modal */}
      {isPasscodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className={`w-full max-w-sm bg-zinc-950 border ${
            passcodeValidationFeedback === 'success' 
              ? 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]' 
              : passcodeValidationFeedback === 'error'
              ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)] animate-shake'
              : 'border-purple-500/20 shadow-[0_0_40px_rgba(139,92,246,0.15)]'
          } rounded-2xl p-6 relative overflow-hidden transition-all duration-300`}>
            {/* Design accents */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
            
            <button 
              onClick={() => {
                setIsPasscodeModalOpen(false);
                setEnteredPasscode('');
              }}
              className="absolute top-4 right-4 p-1.5 dark:text-zinc-500 text-zinc-400 dark:hover:text-white hover:text-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full dark:bg-purple-950/40 bg-purple-50 border dark:border-purple-500/30 border-purple-200 flex items-center justify-center text-purple-500">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-wider text-white uppercase">Admin Security Bypass</h3>
                <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                  Enter the 4-digit corporate PIN to unlock administrative features.
                </p>
              </div>

              <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  autoFocus
                  placeholder="••••"
                  value={enteredPasscode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setEnteredPasscode(val);
                    // Automatically submit when 4 digits are entered
                    if (val.length === 4) {
                      if (val === adminPasscode) {
                        setIsAdminUnlocked(true);
                        localStorage.setItem('korlyn_admin_unlocked', 'true');
                        setIsPasscodeModalOpen(false);
                        setEnteredPasscode('');
                        setPasscodeValidationFeedback('none');
                        navigateTo('admin');
                      } else {
                        setPasscodeValidationFeedback('error');
                        setTimeout(() => {
                          setEnteredPasscode('');
                          setPasscodeValidationFeedback('none');
                        }, 1200);
                      }
                    }
                  }}
                  className="w-32 bg-zinc-900/80 border border-zinc-800 text-center text-2xl font-mono tracking-[0.4em] font-bold py-2.5 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all placeholder-zinc-700"
                />

                {passcodeValidationFeedback === 'success' && (
                  <p className="text-xs text-emerald-400 font-mono flex items-center justify-center gap-1.5 animate-bounce">
                    <Check className="w-3.5 h-3.5" /> SECURITY ACCESS GRANTED
                  </p>
                )}

                {passcodeValidationFeedback === 'error' && (
                  <p className="text-xs text-red-400 font-mono flex items-center justify-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> ACCESS DENIED - INVALID PIN
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={enteredPasscode.length !== 4}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-mono text-xs tracking-widest uppercase rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Authenticate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer Overlay Modal */}
      {viewingCertificatePayment && (
        <CertificateView 
          payment={viewingCertificatePayment} 
          onClose={() => setViewingCertificatePayment(null)}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Network Status Toast */}
      <NetworkStatusToast status={networkStatus} />

      {/* Database Secure Loading Animation Overlay */}
      {dbLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md select-none pointer-events-auto animate-fade-in">
          <div className="relative p-[2px] rounded-2xl overflow-hidden w-72 sm:w-80 shadow-[0_0_50px_rgba(139,92,246,0.15)]">
            {/* Edge gradient moving border line */}
            <div className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,#8b5cf6,#f59e0b,#3b82f6,#8b5cf6)] animate-[spin_4s_linear_infinite]" />
            
            {/* Inner dark card mask */}
            <div className="relative z-10 bg-zinc-950 rounded-[14px] p-6 flex flex-col items-center justify-center text-center space-y-4">
              {/* Core tech icon */}
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 animate-pulse">
                <Cpu className="w-6 h-6" />
              </div>
              
              {/* Status text */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono tracking-[0.25em] text-purple-400 font-bold uppercase block">
                  DATABASE SECURE LINK
                </span>
                <p className="text-xs font-mono text-zinc-300 uppercase leading-relaxed max-w-[240px] mx-auto min-h-[32px] flex items-center justify-center">
                  {dbLoadingText}
                </p>
              </div>
              
              {/* Animated loader dashes */}
              <div className="flex gap-1.5 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[bounce_1s_infinite_100ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-[bounce_1s_infinite_300ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-[bounce_1s_infinite_500ms]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
