/*
  # Fix Insurances RLS Policies

  ## Problem
  - Insurance policies have recursive queries causing issues
  
  ## Solution
  - Use the is_worker() function created earlier
  - Create simple, non-recursive policies
  
  ## Changes
  1. Drop existing recursive policies
  2. Create new simple policies using is_worker() function
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own insurances" ON insurances;
DROP POLICY IF EXISTS "Users can manage own insurances" ON insurances;

-- Simple SELECT policy: users can see their own insurances
CREATE POLICY "Users can select own insurances"
  ON insurances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Simple INSERT policy: users can create their own insurances
CREATE POLICY "Users can insert own insurances"
  ON insurances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Simple UPDATE policy: users can update their own insurances
CREATE POLICY "Users can update own insurances"
  ON insurances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Simple DELETE policy: users can delete their own insurances
CREATE POLICY "Users can delete own insurances"
  ON insurances FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Workers can see all insurances
CREATE POLICY "Workers can select all insurances"
  ON insurances FOR SELECT
  TO authenticated
  USING (is_worker());

-- Workers can update all insurances
CREATE POLICY "Workers can update all insurances"
  ON insurances FOR UPDATE
  TO authenticated
  USING (is_worker())
  WITH CHECK (is_worker());

-- Workers can delete insurances
CREATE POLICY "Workers can delete all insurances"
  ON insurances FOR DELETE
  TO authenticated
  USING (is_worker());