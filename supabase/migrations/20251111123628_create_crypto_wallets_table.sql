/*
  # Create Crypto Wallets Table

  1. New Tables
    - `crypto_wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users_profile)
      - `symbol` (text) - Crypto symbol (BTC, ETH, etc.)
      - `name` (text) - Crypto name
      - `amount` (numeric) - Amount of crypto owned
      - `average_buy_price` (numeric) - Average price paid per unit
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `crypto_wallets` table
    - Add policy for users to read their own crypto wallets
    - Add policy for users to insert their own crypto wallets
    - Add policy for users to update their own crypto wallets
    - Add policy for users to delete their own crypto wallets
*/

CREATE TABLE IF NOT EXISTS crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  average_buy_price numeric NOT NULL DEFAULT 0 CHECK (average_buy_price >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own crypto wallets"
  ON crypto_wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crypto wallets"
  ON crypto_wallets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crypto wallets"
  ON crypto_wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own crypto wallets"
  ON crypto_wallets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);