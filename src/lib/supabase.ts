import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'worker';
  password_hash: string;
  two_fa_enabled: boolean;
  two_fa_method?: 'email' | 'sms' | 'authenticator';
  two_fa_secret?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  account_number: string;
  currency: 'EUR' | 'GBP' | 'USD';
  balance: number;
  account_type: 'checking' | 'savings';
  created_at: string;
}

export interface Card {
  id: string;
  account_id: string;
  card_number: string;
  card_type: 'debit' | 'credit' | 'disposable';
  cvv: string;
  expiry_date: string;
  credit_limit?: number;
  current_debt: number;
  points_multiplier: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  transaction_type: 'transfer' | 'withdrawal' | 'deposit' | 'payment' | 'salary';
  amount: number;
  currency: string;
  description: string;
  recipient_account?: string;
  is_suspicious: boolean;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  loan_type: 'personal' | 'mortgage';
  amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  remaining_balance: number;
  status: 'pending' | 'approved' | 'active' | 'paid' | 'defaulted';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  investment_type: 'stocks' | 'funds' | 'savings_account';
  name: string;
  amount_invested: number;
  current_value: number;
  interest_rate?: number;
  purchase_date: string;
}
