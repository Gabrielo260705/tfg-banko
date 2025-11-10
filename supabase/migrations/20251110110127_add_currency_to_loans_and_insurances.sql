/*
  # Add currency support to loans and insurances

  1. Changes
    - Add `currency` column to `loans` table with default 'EUR'
    - Add `currency` column to `insurances` table with default 'EUR'
    - Add `account_id` column to `loans` table to track which account receives the loan
    
  2. Notes
    - Existing records will default to EUR
    - New loans and insurances can be in EUR, USD, or GBP
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'currency'
  ) THEN
    ALTER TABLE loans ADD COLUMN currency text DEFAULT 'EUR';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE loans ADD COLUMN account_id uuid REFERENCES accounts(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurances' AND column_name = 'currency'
  ) THEN
    ALTER TABLE insurances ADD COLUMN currency text DEFAULT 'EUR';
  END IF;
END $$;