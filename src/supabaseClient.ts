import { createClient } from '@supabase/supabase-js';
import { UserAccount, PaymentRecord, BankDetails, SocialLink } from './types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to upload a file to Supabase Storage
export const uploadReceipt = async (file: File, phone: string): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const cleanPhone = phone.replace(/[^a-zA-Z0-9]/g, '');
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop() || 'png';
  const filePath = `receipts/${cleanPhone}_${timestamp}.${fileExt}`;

  // Try uploading to 'Helolex Bucket', 'helolex-bucket', or fallback to 'receipts'
  const targetBuckets = ['Helolex Bucket', 'helolex-bucket', 'receipts'];
  let lastError: any = null;

  for (const bucket of targetBuckets) {
    try {
      console.log(`Attempting upload to Supabase storage bucket: "${bucket}"...`);
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        lastError = error;
        continue; // Try next bucket
      }

      // If upload succeeded, get the public URL
      const { data: publicUrlData } = supabase.storage
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
  if (!supabase || !url) return false;

  try {
    // Check if URL is indeed a Supabase Storage URL
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
    const { error } = await supabase.storage
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

// Database Sync helpers
export const fetchUsersFromSupabase = async (): Promise<UserAccount[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('users_account')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Note: fetchUsersFromSupabase returned an error. This is normal if tables are not initialized yet:', error.message || error);
    return null;
  }

  return (data || []).map(row => ({
    phone: row.phone,
    fullName: row.full_name || undefined,
    email: row.email || undefined,
    createdAt: row.created_at,
    referredBy: row.referred_by || undefined,
    clicksCount: row.clicks_count,
    registrationsCount: row.registrations_count,
    purchasesCount: row.purchases_count,
    points: row.points,
    passType: row.pass_type || undefined,
  }));
};

export const upsertUserToSupabase = async (user: UserAccount): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase
    .from('users_account')
    .upsert({
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
    });

  if (error) {
    console.warn('Note: upsertUserToSupabase returned an error. This is normal if tables are not initialized yet:', error.message || error);
    return false;
  }
  return true;
};

export const fetchPaymentsFromSupabase = async (): Promise<PaymentRecord[] | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.warn('Note: fetchPaymentsFromSupabase returned an error. This is normal if tables are not initialized yet:', error.message || error);
    return null;
  }

  return (data || []).map(row => ({
    id: row.id,
    email: row.email,
    phone: row.phone,
    receiptName: row.receipt_name,
    receiptDataUrl: row.receipt_data_url,
    status: row.status as 'pending' | 'approved' | 'rejected',
    submittedAt: row.submitted_at,
    amount: row.amount,
    ownershipId: row.ownership_id || undefined,
    issueDate: row.issue_date || undefined,
    passType: row.pass_type as 'single' | 'multiple' | undefined,
    fullName: row.full_name || undefined,
  }));
};

export const upsertPaymentToSupabase = async (payment: PaymentRecord): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase
    .from('payments')
    .upsert({
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
    });

  if (error) {
    console.warn('Note: upsertPaymentToSupabase returned an error. This is normal if tables are not initialized yet:', error.message || error);
    return false;
  }
  return true;
};

export const fetchAdminSettingsFromSupabase = async (): Promise<{
  bankDetails?: BankDetails;
  adminPasscode?: string;
  socialLinks?: SocialLink[];
} | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('admin_settings')
    .select('*');

  if (error) {
    console.warn('Note: fetchAdminSettingsFromSupabase returned an error. This is normal if tables are not initialized yet:', error.message || error);
    return null;
  }

  const result: {
    bankDetails?: BankDetails;
    adminPasscode?: string;
    socialLinks?: SocialLink[];
  } = {};

  for (const row of (data || [])) {
    try {
      if (row.key === 'bank_details') {
        result.bankDetails = JSON.parse(row.value);
      } else if (row.key === 'admin_passcode') {
        result.adminPasscode = row.value; // Store passcode as plain string or string value
      } else if (row.key === 'social_links') {
        result.socialLinks = JSON.parse(row.value);
      }
    } catch (e) {
      console.warn(`Note: Error parsing admin setting for key ${row.key}:`, e);
    }
  }

  return result;
};

export const upsertAdminSettingToSupabase = async (key: string, value: string): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase
    .from('admin_settings')
    .upsert({
      key,
      value
    });

  if (error) {
    console.warn(`Note: Error upserting admin setting ${key} to Supabase:`, error.message || error);
    return false;
  }
  return true;
};

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
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      message: 'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.',
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
    // 1. Test basic connection / settings table
    const { error: settingsError } = await supabase.from('admin_settings').select('key').limit(1);
    if (settingsError) {
      if (settingsError.code === 'PGRST116' || settingsError.message?.includes('does not exist')) {
        return {
          success: false,
          message: 'Connected to Supabase, but "admin_settings" table does not exist. Please run the SQL schema script below in your Supabase SQL Editor.',
          details: status,
        };
      }
      throw settingsError;
    }
    status.connectionOk = true;
    status.adminSettingsOk = true;

    // 2. Test users_account table
    const { error: usersError } = await supabase.from('users_account').select('phone').limit(1);
    if (usersError) {
      return {
        success: false,
        message: 'Connected to Supabase, but "users_account" table does not exist. Please run the SQL schema script below in your Supabase SQL Editor.',
        details: status,
      };
    }
    status.usersAccountOk = true;

    // 3. Test payments table
    const { error: paymentsError } = await supabase.from('payments').select('id').limit(1);
    if (paymentsError) {
      return {
        success: false,
        message: 'Connected to Supabase, but "payments" table does not exist. Please run the SQL schema script below in your Supabase SQL Editor.',
        details: status,
      };
    }
    status.paymentsOk = true;

    // 4. Seed default admin passcode setting if not present
    const { data: existingPasscode } = await supabase.from('admin_settings').select('*').eq('key', 'admin_passcode').single();
    if (!existingPasscode) {
      const { error: seedSettingsErr } = await supabase.from('admin_settings').upsert({
        key: 'admin_passcode',
        value: '1907',
      });
      if (!seedSettingsErr) {
        status.seededSettings = true;
      }
    }

    // 5. Seed a test User
    const testPhone = '+2348012345678';
    const { error: seedUserErr } = await supabase.from('users_account').upsert({
      phone: testPhone,
      full_name: 'Supabase Test Admin',
      email: 'test-admin@helolex.com',
      pass_type: 'multiple',
      clicks_count: 5,
      registrations_count: 1,
      purchases_count: 1,
      points: 15,
      created_at: new Date().toISOString(),
    });

    if (!seedUserErr) {
      status.seededUsers = true;

      // 6. Seed a test Payment attached to this user
      const { error: seedPaymentErr } = await supabase.from('payments').upsert({
        id: 'PAY-TEST-SUPABASE',
        phone: testPhone,
        email: 'test-admin@helolex.com',
        receipt_name: 'test_receipt.png',
        receipt_data_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=60',
        full_name: 'Supabase Test Admin',
        amount: '₦100,000',
        pass_type: 'multiple',
        status: 'approved',
        submitted_at: new Date().toLocaleString(),
        ownership_id: 'OWN-TEST-999',
        issue_date: new Date().toLocaleDateString(),
      });

      if (!seedPaymentErr) {
        status.seededPayments = true;
      }
    }

    return {
      success: true,
      message: 'Supabase Database is fully connected and tables have been verified! Test seed records were successfully registered.',
      details: status,
    };

  } catch (err: any) {
    console.error('Test Supabase Error:', err);
    return {
      success: false,
      message: `Failed to connect or seed database. Error: ${err?.message || JSON.stringify(err)}`,
      details: status,
    };
  }
};

