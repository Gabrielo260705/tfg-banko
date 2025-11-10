/*
  # Banko Banking Application Database Schema

  ## Overview
  Complete banking system with users, accounts, cards, loans, investments, and security features.

  ## New Tables

  ### 1. users_profile
    - `id` (uuid, primary key, references auth.users)
    - `full_name` (text)
    - `email` (text, unique)
    - `role` (text: 'user' or 'worker')
    - `password_hash` (text, MD5 hashed)
    - `two_fa_enabled` (boolean)
    - `two_fa_method` (text: 'email', 'sms', 'authenticator')
    - `two_fa_secret` (text, nullable)
    - `phone_number` (text, nullable)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 2. accounts
    - `id` (uuid, primary key)
    - `user_id` (uuid, references users_profile)
    - `account_number` (text, unique)
    - `currency` (text: 'EUR', 'GBP', 'USD')
    - `balance` (numeric)
    - `account_type` (text: 'checking', 'savings')
    - `created_at` (timestamptz)

  ### 3. cards
    - `id` (uuid, primary key)
    - `account_id` (uuid, references accounts)
    - `card_number` (text, unique)
    - `card_type` (text: 'debit', 'credit', 'disposable')
    - `cvv` (text)
    - `expiry_date` (date)
    - `credit_limit` (numeric, nullable)
    - `current_debt` (numeric, default 0)
    - `points_multiplier` (numeric)
    - `is_active` (boolean, default true)
    - `expires_at` (timestamptz, nullable for disposable)
    - `created_at` (timestamptz)

  ### 4. transactions
    - `id` (uuid, primary key)
    - `account_id` (uuid, references accounts)
    - `transaction_type` (text: 'transfer', 'withdrawal', 'deposit', 'payment', 'salary')
    - `amount` (numeric)
    - `currency` (text)
    - `description` (text)
    - `recipient_account` (text, nullable)
    - `is_suspicious` (boolean, default false)
    - `created_at` (timestamptz)

  ### 5. loans
    - `id` (uuid, primary key)
    - `user_id` (uuid, references users_profile)
    - `loan_type` (text: 'personal', 'mortgage')
    - `amount` (numeric)
    - `interest_rate` (numeric)
    - `term_months` (integer)
    - `monthly_payment` (numeric)
    - `remaining_balance` (numeric)
    - `status` (text: 'pending', 'approved', 'active', 'paid', 'defaulted')
    - `approved_by` (uuid, nullable, references users_profile)
    - `approved_at` (timestamptz, nullable)
    - `created_at` (timestamptz)

  ### 6. investments
    - `id` (uuid, primary key)
    - `user_id` (uuid, references users_profile)
    - `investment_type` (text: 'stocks', 'funds', 'savings_account')
    - `name` (text)
    - `amount_invested` (numeric)
    - `current_value` (numeric)
    - `interest_rate` (numeric, nullable)
    - `purchase_date` (timestamptz)

  ### 7. insurances
    - `id` (uuid, primary key)
    - `user_id` (uuid, references users_profile)
    - `insurance_type` (text: 'home', 'life', 'health', 'auto')
    - `policy_number` (text, unique)
    - `premium_amount` (numeric)
    - `coverage_amount` (numeric)
    - `linked_loan_id` (uuid, nullable, references loans)
    - `start_date` (date)
    - `end_date` (date)
    - `is_active` (boolean, default true)

  ### 8. loyalty_points
    - `id` (uuid, primary key)
    - `user_id` (uuid, references users_profile)
    - `total_points` (integer, default 0)
    - `updated_at` (timestamptz)

  ### 9. direct_debits
    - `id` (uuid, primary key)
    - `account_id` (uuid, references accounts)
    - `service_name` (text)
    - `amount` (numeric)
    - `frequency` (text: 'monthly', 'quarterly', 'annual')
    - `next_payment_date` (date)
    - `is_active` (boolean, default true)

  ### 10. audit_logs
    - `id` (uuid, primary key)
    - `user_id` (uuid, references users_profile)
    - `action` (text)
    - `details` (jsonb)
    - `ip_address` (text)
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Workers can access all data for management purposes
  - Audit logs for all critical operations
*/

-- Users Profile Table
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'worker')),
  password_hash text NOT NULL,
  two_fa_enabled boolean DEFAULT false,
  two_fa_method text CHECK (two_fa_method IN ('email', 'sms', 'authenticator')),
  two_fa_secret text,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  account_number text UNIQUE NOT NULL,
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'GBP', 'USD')),
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  account_type text NOT NULL DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings')),
  created_at timestamptz DEFAULT now()
);

-- Cards Table
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  card_number text UNIQUE NOT NULL,
  card_type text NOT NULL CHECK (card_type IN ('debit', 'credit', 'disposable')),
  cvv text NOT NULL,
  expiry_date date NOT NULL,
  credit_limit numeric CHECK (credit_limit >= 0),
  current_debt numeric DEFAULT 0 CHECK (current_debt >= 0),
  points_multiplier numeric DEFAULT 1 CHECK (points_multiplier > 0),
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('transfer', 'withdrawal', 'deposit', 'payment', 'salary')),
  amount numeric NOT NULL CHECK (amount != 0),
  currency text NOT NULL DEFAULT 'EUR',
  description text NOT NULL,
  recipient_account text,
  is_suspicious boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  loan_type text NOT NULL CHECK (loan_type IN ('personal', 'mortgage')),
  amount numeric NOT NULL CHECK (amount > 0),
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  term_months integer NOT NULL CHECK (term_months > 0),
  monthly_payment numeric NOT NULL CHECK (monthly_payment > 0),
  remaining_balance numeric NOT NULL CHECK (remaining_balance >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'paid', 'defaulted')),
  approved_by uuid REFERENCES users_profile(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Investments Table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  investment_type text NOT NULL CHECK (investment_type IN ('stocks', 'funds', 'savings_account')),
  name text NOT NULL,
  amount_invested numeric NOT NULL CHECK (amount_invested > 0),
  current_value numeric NOT NULL CHECK (current_value >= 0),
  interest_rate numeric CHECK (interest_rate >= 0),
  purchase_date timestamptz DEFAULT now()
);

-- Insurances Table
CREATE TABLE IF NOT EXISTS insurances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  insurance_type text NOT NULL CHECK (insurance_type IN ('home', 'life', 'health', 'auto')),
  policy_number text UNIQUE NOT NULL,
  premium_amount numeric NOT NULL CHECK (premium_amount > 0),
  coverage_amount numeric NOT NULL CHECK (coverage_amount > 0),
  linked_loan_id uuid REFERENCES loans(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  CHECK (end_date > start_date)
);

-- Loyalty Points Table
CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0 CHECK (total_points >= 0),
  updated_at timestamptz DEFAULT now()
);

-- Direct Debits Table
CREATE TABLE IF NOT EXISTS direct_debits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'annual')),
  next_payment_date date NOT NULL,
  is_active boolean DEFAULT true
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_debits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_profile
CREATE POLICY "Users can view own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Workers can insert users"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "Workers can delete users"
  ON users_profile FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

-- RLS Policies for accounts
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ))
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "Workers can delete accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

-- RLS Policies for cards
CREATE POLICY "Users can view own cards"
  ON cards FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = cards.account_id 
    AND (accounts.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
    ))
  ));

CREATE POLICY "Users can insert own cards"
  ON cards FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = cards.account_id AND accounts.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "Users can update own cards"
  ON cards FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = cards.account_id 
    AND (accounts.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
    ))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = cards.account_id 
    AND (accounts.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
    ))
  ));

CREATE POLICY "Workers can delete cards"
  ON cards FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = transactions.account_id 
    AND (accounts.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
    ))
  ));

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = transactions.account_id AND accounts.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

-- RLS Policies for loans
CREATE POLICY "Users can view own loans"
  ON loans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "Users can insert own loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Workers can update loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ))
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

-- RLS Policies for investments
CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "Users can manage own investments"
  ON investments FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ))
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

-- RLS Policies for insurances
CREATE POLICY "Users can view own insurances"
  ON insurances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "Users can manage own insurances"
  ON insurances FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ))
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

-- RLS Policies for loyalty_points
CREATE POLICY "Users can view own loyalty points"
  ON loyalty_points FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "System can manage loyalty points"
  ON loyalty_points FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for direct_debits
CREATE POLICY "Users can view own direct debits"
  ON direct_debits FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = direct_debits.account_id 
    AND (accounts.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
    ))
  ));

CREATE POLICY "Users can manage own direct debits"
  ON direct_debits FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = direct_debits.account_id AND accounts.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM accounts WHERE accounts.id = direct_debits.account_id AND accounts.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

-- RLS Policies for audit_logs
CREATE POLICY "Workers can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'worker'
  ));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON cards(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_insurances_user_id ON insurances(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_debits_account_id ON direct_debits(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);