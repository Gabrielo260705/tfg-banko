import { supabase } from './supabase';
import CryptoJS from 'crypto-js';

export const hashPassword = (password: string): string => {
  return CryptoJS.MD5(password).toString();
};

export const signUp = async (email: string, password: string, fullName: string, role: 'user' | 'worker' = 'user') => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  const passwordHash = hashPassword(password);

  const { error: profileError } = await supabase
    .from('users_profile')
    .insert({
      id: authData.user.id,
      full_name: fullName,
      email,
      role,
      password_hash: passwordHash,
      two_fa_enabled: false,
    });

  if (profileError) throw profileError;

  const { error: loyaltyError } = await supabase
    .from('loyalty_points')
    .insert({
      user_id: authData.user.id,
      total_points: 0,
    });

  if (loyaltyError) throw loyaltyError;

  return authData;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profile?.two_fa_enabled) {
    return { ...data, requires2FA: true, profile };
  }

  return { ...data, requires2FA: false, profile };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log('getCurrentUser - user:', user);
  console.log('getCurrentUser - user.id:', user?.id);
  console.log('getCurrentUser - userError:', userError);

  if (!user) return null;

  // First check if the profile exists at all
  const { count } = await supabase
    .from('users_profile')
    .select('*', { count: 'exact', head: true })
    .eq('id', user.id);

  console.log('Profile count for user:', count);

  const { data: profile, error: profileError } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  console.log('getCurrentUser - profile:', profile);
  console.log('getCurrentUser - profileError:', profileError);

  return { user, profile };
};

export const enable2FA = async (userId: string, method: 'email' | 'sms' | 'authenticator', secret?: string) => {
  const { error } = await supabase
    .from('users_profile')
    .update({
      two_fa_enabled: true,
      two_fa_method: method,
      two_fa_secret: secret,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
};
