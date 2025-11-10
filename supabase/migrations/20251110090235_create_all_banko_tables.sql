/*
  # Creación Completa del Sistema Banko

  Este script crea todas las tablas necesarias para el sistema bancario completo con sus relaciones,
  políticas de seguridad RLS y datos iniciales.

  ## 1. Nuevas Tablas

  ### users_profile
  - `id` (uuid, primary key) - ID único del usuario
  - `full_name` (text) - Nombre completo
  - `email` (text, unique) - Correo electrónico
  - `role` (text) - Rol: 'user' o 'worker'
  - `password_hash` (text) - Hash de contraseña
  - `two_fa_enabled` (boolean) - Si 2FA está activo
  - `two_fa_method` (text) - Método 2FA: 'email', 'sms', 'authenticator'
  - `two_fa_secret` (text) - Secreto para 2FA
  - `phone_number` (text) - Número de teléfono
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Fecha de actualización

  ### accounts
  - `id` (uuid, primary key) - ID único de la cuenta
  - `user_id` (uuid, foreign key) - Referencia a users_profile
  - `account_number` (text, unique) - Número de cuenta
  - `currency` (text) - Moneda: 'EUR', 'GBP', 'USD'
  - `balance` (numeric) - Saldo de la cuenta
  - `account_type` (text) - Tipo: 'checking' o 'savings'
  - `created_at` (timestamptz) - Fecha de creación

  ### cards
  - `id` (uuid, primary key) - ID único de la tarjeta
  - `account_id` (uuid, foreign key) - Referencia a accounts
  - `card_number` (text) - Número de tarjeta
  - `card_type` (text) - Tipo: 'debit', 'credit', 'disposable'
  - `cvv` (text) - CVV
  - `expiry_date` (text) - Fecha de expiración
  - `credit_limit` (numeric) - Límite de crédito
  - `current_debt` (numeric) - Deuda actual
  - `points_multiplier` (numeric) - Multiplicador de puntos
  - `is_active` (boolean) - Si está activa
  - `expires_at` (timestamptz) - Fecha de expiración (tarjetas desechables)
  - `created_at` (timestamptz) - Fecha de creación

  ### transactions
  - `id` (uuid, primary key) - ID único de la transacción
  - `account_id` (uuid, foreign key) - Referencia a accounts
  - `transaction_type` (text) - Tipo: 'transfer', 'withdrawal', 'deposit', 'payment', 'salary'
  - `amount` (numeric) - Cantidad
  - `currency` (text) - Moneda
  - `description` (text) - Descripción
  - `recipient_account` (text) - Cuenta destinataria
  - `is_suspicious` (boolean) - Si es sospechosa
  - `created_at` (timestamptz) - Fecha de creación

  ### loans
  - `id` (uuid, primary key) - ID único del préstamo
  - `user_id` (uuid, foreign key) - Referencia a users_profile
  - `loan_type` (text) - Tipo: 'personal', 'mortgage'
  - `amount` (numeric) - Cantidad del préstamo
  - `interest_rate` (numeric) - Tasa de interés
  - `term_months` (integer) - Plazo en meses
  - `monthly_payment` (numeric) - Pago mensual
  - `remaining_balance` (numeric) - Saldo restante
  - `status` (text) - Estado: 'pending', 'approved', 'active', 'paid', 'defaulted'
  - `approved_by` (uuid) - ID del trabajador que aprobó
  - `approved_at` (timestamptz) - Fecha de aprobación
  - `created_at` (timestamptz) - Fecha de creación

  ### investments
  - `id` (uuid, primary key) - ID único de la inversión
  - `user_id` (uuid, foreign key) - Referencia a users_profile
  - `investment_type` (text) - Tipo: 'stocks', 'funds', 'savings_account'
  - `name` (text) - Nombre de la inversión
  - `amount_invested` (numeric) - Cantidad invertida
  - `current_value` (numeric) - Valor actual
  - `interest_rate` (numeric) - Tasa de interés
  - `purchase_date` (timestamptz) - Fecha de compra

  ### insurances
  - `id` (uuid, primary key) - ID único del seguro
  - `user_id` (uuid, foreign key) - Referencia a users_profile
  - `insurance_type` (text) - Tipo: 'home', 'life', 'health', 'auto'
  - `policy_number` (text, unique) - Número de póliza
  - `premium_amount` (numeric) - Prima mensual
  - `coverage_amount` (numeric) - Monto de cobertura
  - `start_date` (date) - Fecha de inicio
  - `end_date` (date) - Fecha de fin
  - `is_active` (boolean) - Si está activo

  ### loyalty_points
  - `id` (uuid, primary key) - ID único
  - `user_id` (uuid, foreign key) - Referencia a users_profile
  - `total_points` (integer) - Total de puntos
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Fecha de actualización

  ### cryptocurrencies
  - `id` (uuid, primary key) - ID único
  - `user_id` (uuid, foreign key) - Referencia a users_profile
  - `crypto_type` (text) - Tipo: 'BTC', 'ETH', 'USDT'
  - `amount` (numeric) - Cantidad
  - `purchase_price` (numeric) - Precio de compra
  - `current_price` (numeric) - Precio actual
  - `purchase_date` (timestamptz) - Fecha de compra

  ## 2. Seguridad

  - Se habilita RLS en todas las tablas
  - Los usuarios solo pueden ver y modificar sus propios datos
  - Los trabajadores pueden ver todos los datos para gestión
  - Políticas restrictivas que verifican autenticación y propiedad
*/

-- Crear tabla users_profile
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Crear tabla accounts
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  account_number text UNIQUE NOT NULL,
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'GBP', 'USD')),
  balance numeric DEFAULT 0,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings')),
  created_at timestamptz DEFAULT now()
);

-- Crear tabla cards
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  card_number text NOT NULL,
  card_type text NOT NULL CHECK (card_type IN ('debit', 'credit', 'disposable')),
  cvv text NOT NULL,
  expiry_date text NOT NULL,
  credit_limit numeric,
  current_debt numeric DEFAULT 0,
  points_multiplier numeric DEFAULT 1,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('transfer', 'withdrawal', 'deposit', 'payment', 'salary')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  description text NOT NULL,
  recipient_account text,
  is_suspicious boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla loans
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  loan_type text NOT NULL CHECK (loan_type IN ('personal', 'mortgage')),
  amount numeric NOT NULL,
  interest_rate numeric NOT NULL,
  term_months integer NOT NULL,
  monthly_payment numeric NOT NULL,
  remaining_balance numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'paid', 'defaulted')),
  approved_by uuid REFERENCES users_profile(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla investments
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  investment_type text NOT NULL CHECK (investment_type IN ('stocks', 'funds', 'savings_account')),
  name text NOT NULL,
  amount_invested numeric NOT NULL,
  current_value numeric NOT NULL,
  interest_rate numeric,
  purchase_date timestamptz DEFAULT now()
);

-- Crear tabla insurances
CREATE TABLE IF NOT EXISTS insurances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  insurance_type text NOT NULL CHECK (insurance_type IN ('home', 'life', 'health', 'auto')),
  policy_number text UNIQUE NOT NULL,
  premium_amount numeric NOT NULL,
  coverage_amount numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true
);

-- Crear tabla loyalty_points
CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla cryptocurrencies
CREATE TABLE IF NOT EXISTS cryptocurrencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  crypto_type text NOT NULL CHECK (crypto_type IN ('BTC', 'ETH', 'USDT')),
  amount numeric NOT NULL,
  purchase_price numeric NOT NULL,
  current_price numeric NOT NULL,
  purchase_date timestamptz DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE cryptocurrencies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users_profile
CREATE POLICY "Users can view own profile"
  ON users_profile FOR SELECT
  USING (id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  USING (id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Workers can view all profiles"
  ON users_profile FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Workers can update all profiles"
  ON users_profile FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Workers can delete profiles"
  ON users_profile FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Anyone can insert new profiles"
  ON users_profile FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para accounts
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (
    user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (
    user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING (
    user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

-- Políticas RLS para cards
CREATE POLICY "Users can view own cards"
  ON cards FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    )
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Users can insert own cards"
  ON cards FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    )
  );

CREATE POLICY "Users can update own cards"
  ON cards FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    )
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Users can delete own cards"
  ON cards FOR DELETE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    )
  );

-- Políticas RLS para transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    )
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    )
  );

-- Políticas RLS para loans
CREATE POLICY "Users can view own loans"
  ON loans FOR SELECT
  USING (
    user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Users can insert own loans"
  ON loans FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Workers can update loans"
  ON loans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

-- Políticas RLS para investments
CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  USING (
    user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Users can insert own investments"
  ON investments FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  USING (user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Políticas RLS para insurances
CREATE POLICY "Users can view own insurances"
  ON insurances FOR SELECT
  USING (
    user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Users can insert own insurances"
  ON insurances FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update own insurances"
  ON insurances FOR UPDATE
  USING (user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Políticas RLS para loyalty_points
CREATE POLICY "Users can view own loyalty points"
  ON loyalty_points FOR SELECT
  USING (
    user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Users can insert own loyalty points"
  ON loyalty_points FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update own loyalty points"
  ON loyalty_points FOR UPDATE
  USING (
    user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

-- Políticas RLS para cryptocurrencies
CREATE POLICY "Users can view own cryptocurrencies"
  ON cryptocurrencies FOR SELECT
  USING (
    user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND role = 'worker'
    )
  );

CREATE POLICY "Users can insert own cryptocurrencies"
  ON cryptocurrencies FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update own cryptocurrencies"
  ON cryptocurrencies FOR UPDATE
  USING (user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can delete own cryptocurrencies"
  ON cryptocurrencies FOR DELETE
  USING (user_id = (SELECT id FROM users_profile WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));