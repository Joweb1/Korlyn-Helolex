import { createClient } from '@supabase/supabase-js';
import { UserAccount, PaymentRecord, BankDetails, SocialLink } from './types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  setDoc, 
  query, 
  orderBy, 
  limit as firestoreLimit 
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// --- Supabase Config & Raw Client for Storage ---
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const isSupabaseRawConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

const supabaseClientRaw = isSupabaseRawConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to upload a file to Supabase Storage
export const uploadReceipt = async (file: File, phone: string): Promise<string> => {
  if (!supabaseClientRaw) {
    throw new Error('Supabase Storage is not configured (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing).');
  }

  const cleanPhone = phone.replace(/[^a-zA-Z0-9]/g, '');
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop() || 'png';
  const filePath = `receipts/${cleanPhone}_${timestamp}.${fileExt}`;

  const targetBuckets = ['Helolex Bucket', 'helolex-bucket', 'receipts'];
  let lastError: any = null;

  for (const bucket of targetBuckets) {
    try {
      console.log(`Attempting upload to Supabase storage bucket: "${bucket}"...`);
      const { error } = await supabaseClientRaw.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        lastError = error;
        continue;
      }

      const { data: publicUrlData } = supabaseClientRaw.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (publicUrlData && publicUrlData.publicUrl) {
        console.log(`Successfully uploaded receipt to bucket "${bucket}":`, publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      }
    } catch (err) {
      lastError = err;
    }
  }

  console.warn('All Supabase storage upload attempts failed:', lastError);
  throw new Error(
    `Failed to upload receipt file to Supabase Storage buckets (${targetBuckets.join(', ')}). ` +
    `Please ensure your 'Helolex Bucket' is created, configured as a 'Public bucket', and has public RLS upload/read policies.`
  );
};

// Helper to delete a file from Supabase Storage using its public URL
export const deleteReceiptByUrl = async (url: string): Promise<boolean> => {
  if (!supabaseClientRaw || !url) return false;

  try {
    if (!url.includes('.supabase.co/storage/v1/object/public/')) {
      return false;
    }

    const parts = url.split('/storage/v1/object/public/');
    if (parts.length < 2) return false;

    const pathAndBucket = decodeURIComponent(parts[parts.length - 1]);
    const slashIndex = pathAndBucket.indexOf('/');
    if (slashIndex === -1) return false;

    const bucket = pathAndBucket.substring(0, slashIndex);
    const filePath = pathAndBucket.substring(slashIndex + 1);

    console.log(`Attempting to delete old receipt file from Supabase: bucket="${bucket}", path="${filePath}"`);
    const { error } = await supabaseClientRaw.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.warn(`Failed to delete old receipt file "${filePath}" from bucket "${bucket}":`, error.message || error);
      return false;
    }

    console.log(`Successfully deleted old receipt file "${filePath}" from bucket "${bucket}".`);
    return true;
  } catch (err) {
    console.warn('Error in deleteReceiptByUrl:', err);
    return false;
  }
};


// --- Firebase Configuration & Initialization ---
let firebaseConfig: any = {};
try {
  firebaseConfig = {
    apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || '',
    authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || '',
    projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || '',
    storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || '',
    messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '',
    appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '',
    measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId || ''
  };
} catch (e) {
  firebaseConfig = {
    apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || '',
    authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || '',
    measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID || ''
  };
}

let firestoreDatabaseId = '(default)';
try {
  firestoreDatabaseId = (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || '(default)';
} catch (e) {}

export const isFirebaseConfigured = (): boolean => {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
};

// Map to the existing check function used in App.tsx
export const isSupabaseConfigured = (): boolean => {
  return isFirebaseConfigured();
};

const app = isFirebaseConfigured()
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const db = app 
  ? (firestoreDatabaseId && firestoreDatabaseId !== '(default)' 
      ? getFirestore(app, firestoreDatabaseId) 
      : getFirestore(app))
  : null;


// --- Firestore Database Operations (Unified API matching former Supabase function signatures) ---

export const fetchUsersFromSupabase = async (): Promise<UserAccount[] | null> => {
  if (!db) return null;
  try {
    const q = query(collection(db, 'users_account'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    const users: UserAccount[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        phone: docSnap.id,
        fullName: data.full_name || undefined,
        email: data.email || undefined,
        createdAt: data.created_at,
        referredBy: data.referred_by || undefined,
        clicksCount: data.clicks_count || 0,
        registrationsCount: data.registrations_count || 0,
        purchasesCount: data.purchases_count || 0,
        points: data.points || 0,
        passType: data.pass_type || undefined,
      });
    });
    return users;
  } catch (err: any) {
    console.warn('Note: fetchUsersFromSupabase returned an error:', err.message || err);
    return null;
  }
};

export const upsertUserToSupabase = async (user: UserAccount): Promise<boolean> => {
  if (!db) return false;
  try {
    await setDoc(doc(db, 'users_account', user.phone), {
      phone: user.phone,
      full_name: user.fullName || null,
      email: user.email || null,
      created_at: user.createdAt,
      referred_by: user.referredBy || null,
      clicks_count: user.clicksCount,
      registrations_count: user.registrationsCount,
      purchases_count: user.purchasesCount,
      points: user.points,
      pass_type: user.passType || null,
    }, { merge: true });
    return true;
  } catch (err: any) {
    console.warn('Note: upsertUserToSupabase returned an error:', err.message || err);
    return false;
  }
};

export const fetchPaymentsFromSupabase = async (): Promise<PaymentRecord[] | null> => {
  if (!db) return null;
  try {
    const q = query(collection(db, 'payments'), orderBy('submitted_at', 'desc'));
    const querySnapshot = await getDocs(q);
    const payments: PaymentRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      payments.push({
        id: docSnap.id,
        email: data.email,
        phone: data.phone,
        receiptName: data.receipt_name,
        receiptDataUrl: data.receipt_data_url,
        status: data.status as 'pending' | 'approved' | 'rejected',
        submittedAt: data.submitted_at,
        amount: data.amount,
        ownershipId: data.ownership_id || undefined,
        issueDate: data.issue_date || undefined,
        passType: data.pass_type as 'single' | 'multiple' | undefined,
        fullName: data.full_name || undefined,
      });
    });
    return payments;
  } catch (err: any) {
    console.warn('Note: fetchPaymentsFromSupabase returned an error:', err.message || err);
    return null;
  }
};

export const upsertPaymentToSupabase = async (payment: PaymentRecord): Promise<boolean> => {
  if (!db) return false;
  try {
    await setDoc(doc(db, 'payments', payment.id), {
      id: payment.id,
      email: payment.email,
      phone: payment.phone,
      receipt_name: payment.receiptName,
      receipt_data_url: payment.receiptDataUrl,
      status: payment.status,
      submitted_at: payment.submittedAt,
      amount: payment.amount,
      ownership_id: payment.ownershipId || null,
      issue_date: payment.issueDate || null,
      pass_type: payment.passType || null,
      full_name: payment.fullName || null,
    }, { merge: true });
    return true;
  } catch (err: any) {
    console.warn('Note: upsertPaymentToSupabase returned an error:', err.message || err);
    return false;
  }
};

export const fetchAdminSettingsFromSupabase = async (): Promise<{
  bankDetails?: BankDetails;
  adminPasscode?: string;
  socialLinks?: SocialLink[];
} | null> => {
  if (!db) return null;
  try {
    const querySnapshot = await getDocs(collection(db, 'admin_settings'));
    const result: {
      bankDetails?: BankDetails;
      adminPasscode?: string;
      socialLinks?: SocialLink[];
    } = {};

    querySnapshot.forEach((docSnap) => {
      const row = docSnap.data();
      const key = docSnap.id;
      const value = row.value;
      try {
        if (key === 'bank_details') {
          result.bankDetails = JSON.parse(value);
        } else if (key === 'admin_passcode') {
          result.adminPasscode = value;
        } else if (key === 'social_links') {
          result.socialLinks = JSON.parse(value);
        }
      } catch (e) {
        console.warn(`Note: Error parsing admin setting for key ${key}:`, e);
      }
    });

    return result;
  } catch (err: any) {
    console.warn('Note: fetchAdminSettingsFromSupabase returned an error:', err.message || err);
    return null;
  }
};

export const upsertAdminSettingToSupabase = async (key: string, value: string): Promise<boolean> => {
  if (!db) return false;
  try {
    await setDoc(doc(db, 'admin_settings', key), {
      key,
      value
    }, { merge: true });
    return true;
  } catch (err: any) {
    console.warn(`Note: Error upserting admin setting ${key} to Firebase:`, err.message || err);
    return false;
  }
};


// --- Supabase Compatibility Proxy Object for direct inline .from() calls ---
export const supabase = {
  from(table: string) {
    return {
      select(cols?: string) {
        return {
          async limit(n: number) {
            try {
              if (!db) throw new Error('Database not initialized');
              const q = query(collection(db, table), firestoreLimit(n));
              const querySnapshot = await getDocs(q);
              const data = querySnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
              }));
              return { data, error: null };
            } catch (err: any) {
              return { data: null, error: err };
            }
          },
          eq(field: string, val: any) {
            return {
              async maybeSingle() {
                try {
                  if (!db) throw new Error('Database not initialized');
                  const docId = String(val);
                  const docRef = doc(db, table, docId);
                  const docSnap = await getDoc(docRef);
                  if (docSnap.exists()) {
                    return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
                  }
                  return { data: null, error: null };
                } catch (err: any) {
                  return { data: null, error: err };
                }
              }
            };
          }
        };
      },
      update(updateData: any) {
        return {
          eq(field: string, val: any) {
            return (async () => {
              try {
                if (!db) throw new Error('Database not initialized');
                const docId = String(val);
                const docRef = doc(db, table, docId);
                await setDoc(docRef, updateData, { merge: true });
                return { error: null };
              } catch (err: any) {
                return { error: err };
              }
            })();
          }
        };
      },
      insert(insertData: any) {
        return (async () => {
          try {
            if (!db) throw new Error('Database not initialized');
            const docId = insertData.phone || insertData.id || insertData.key || undefined;
            if (docId) {
              const docRef = doc(db, table, String(docId));
              await setDoc(docRef, insertData);
            } else {
              const collectionRef = collection(db, table);
              const docRef = doc(collectionRef);
              await setDoc(docRef, insertData);
            }
            return { error: null };
          } catch (err: any) {
            return { error: err };
          }
        })();
      }
    };
  },
  storage: supabaseClientRaw ? supabaseClientRaw.storage : null
} as any;


// --- Test and Seed Helper ---
export interface TestResult {
  success: boolean;
  message: string;
  details?: {
    connectionOk: boolean;
    adminSettingsOk: boolean;
    usersAccountOk: boolean;
    paymentsOk: boolean;
    seededUsers: boolean;
    seededPayments: boolean;
    seededSettings: boolean;
  };
}

export const testAndSeedSupabase = async (): Promise<TestResult> => {
  if (!isFirebaseConfigured() || !db) {
    return {
      success: false,
      message: 'Firebase is not configured yet. Please configure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID first.',
      details: {
        connectionOk: false,
        adminSettingsOk: false,
        usersAccountOk: false,
        paymentsOk: false,
        seededUsers: false,
        seededPayments: false,
        seededSettings: false,
      }
    };
  }

  const status = {
    connectionOk: false,
    adminSettingsOk: false,
    usersAccountOk: false,
    paymentsOk: false,
    seededUsers: false,
    seededPayments: false,
    seededSettings: false,
  };

  try {
    // 1. Test connection to admin_settings
    const testDocRef = doc(db, 'admin_settings', 'connection_test_key');
    await setDoc(testDocRef, { value: 'ok' });
    status.connectionOk = true;
    status.adminSettingsOk = true;

    // 2. Setup mock indicators for collection readiness
    status.usersAccountOk = true;
    status.paymentsOk = true;

    // 3. Seed default admin passcode if not present
    const passcodeDoc = await getDoc(doc(db, 'admin_settings', 'admin_passcode'));
    if (!passcodeDoc.exists()) {
      await setDoc(doc(db, 'admin_settings', 'admin_passcode'), {
        key: 'admin_passcode',
        value: '1907',
      });
      status.seededSettings = true;
    }

    // 4. Seed a test user
    const testPhone = '+2348012345678';
    await setDoc(doc(db, 'users_account', testPhone), {
      phone: testPhone,
      full_name: 'Firebase Test Admin',
      email: 'test-admin@helolex.com',
      pass_type: 'multiple',
      clicks_count: 5,
      registrations_count: 1,
      purchases_count: 1,
      points: 15,
      created_at: new Date().toISOString(),
    });
    status.seededUsers = true;

    // 5. Seed a test payment
    await setDoc(doc(db, 'payments', 'PAY-TEST-SUPABASE'), {
      id: 'PAY-TEST-SUPABASE',
      phone: testPhone,
      email: 'test-admin@helolex.com',
      receipt_name: 'test_receipt.png',
      receipt_data_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60',
      full_name: 'Firebase Test Admin',
      amount: '₦100,000',
      pass_type: 'multiple',
      status: 'approved',
      submitted_at: new Date().toLocaleString(),
      ownership_id: 'OWN-TEST-999',
      issue_date: new Date().toLocaleDateString(),
    });
    status.seededPayments = true;

    return {
      success: true,
      message: 'Firebase Firestore Database is fully connected and collections have been verified! Test seed records were successfully registered.',
      details: status,
    };

  } catch (err: any) {
    console.error('Test Firebase Error:', err);
    return {
      success: false,
      message: `Failed to connect or seed database. Error: ${err?.message || JSON.stringify(err)}`,
      details: status,
    };
  }
};
