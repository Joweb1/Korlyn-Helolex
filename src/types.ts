export interface ProductCard {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  exploreUrl?: string;
  comingSoon?: boolean;
}

export interface GamePoster {
  id: string;
  title: string;
  genre: string;
  rating: string;
  description: string;
  image: string;
  accentColor: string;
  comingSoon?: boolean;
}

export interface PaymentRecord {
  id: string;
  email: string;
  phone: string;
  receiptName: string;
  receiptDataUrl: string; // Base64 or local ObjectURL
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  amount: string; // ₦25,000
  ownershipId?: string; // generated upon approval (e.g., HLX-XXXXX)
  issueDate?: string;
  passType?: 'single' | 'multiple';
  fullName?: string;
}

export interface CreatorStats {
  totalCreators: number;
  totalProducts: number;
  countriesCount: number;
  potentialEarnings: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface UserAccount {
  phone: string; // e.g. +2348031124589
  fullName?: string;
  email?: string;
  createdAt: string;
  referredBy?: string; // phone number of referrer
  clicksCount: number; // total clicks on their referral link
  registrationsCount: number; // total number of people who registered with their link
  purchasesCount: number; // total number of people who purchased their pass with their link
  points: number; // calculated promo reward points
  passType?: 'single' | 'multiple';
}

export interface SocialLink {
  id: string; // 'whatsapp' | 'instagram' | 'linkedin' | 'telegram' | 'twitter' | 'discord' | 'slack' | 'facebook'
  name: string;
  url: string;
  enabled: boolean;
}


