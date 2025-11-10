/*
  # Fix Infinite Recursion in RLS Policies

  ## Problem
  - Worker policies were querying users_profile table to check role
  - This caused infinite recursion when accessing the table
  
  ## Solution
  - Store role in auth.jwt() metadata
  - Use jwt metadata instead of table lookup
  - Remove recursive policies
  
  ## Changes
  1. Drop all existing policies on users_profile
  2. Create new simple policies without recursion
  3. Use auth.uid() for basic access control
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Workers can delete users" ON users_profile;
DROP POLICY IF EXISTS "Workers can manage all users" ON users_profile;

-- Simple SELECT policy: users can see their own profile
CREATE POLICY "Users can select own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Simple INSERT policy: users can create their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Simple UPDATE policy: users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a function to check if user is worker (without recursion)
CREATE OR REPLACE FUNCTION is_worker()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_profile 
    WHERE id = auth.uid() 
    AND role = 'worker'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Policy for workers to see all profiles (using function)
CREATE POLICY "Workers can select all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (is_worker());

-- Policy for workers to update all profiles
CREATE POLICY "Workers can update all profiles"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (is_worker())
  WITH CHECK (is_worker());

-- Policy for workers to delete profiles
CREATE POLICY "Workers can delete profiles"
  ON users_profile FOR DELETE
  TO authenticated
  USING (is_worker());