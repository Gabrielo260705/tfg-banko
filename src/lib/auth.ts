import { supabase } from './supabase';
import CryptoJS from 'crypto-js';

export const hashPassword = (password: string): string => {
  return CryptoJS.MD5(password).toString();
};

export const signUp = async (email: string, password: string, fullName: string, role: 'user' | 'worker' = 'user') => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined,
      data: {
        full_name: fullName,
        role: role,
      }
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  const { data: existingProfile } = await supabase
    .from('users_profile')
    .select('id')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (existingProfile) {
    return authData;
  }

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

  if (profileError) {
    console.error('Profile creation error:', profileError);
    throw profileError;
  }

  const { data: existingLoyalty } = await supabase
    .from('loyalty_points')
    .select('id')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (!existingLoyalty) {
    const { error: loyaltyError } = await supabase
      .from('loyalty_points')
      .insert({
        user_id: authData.user.id,
        total_points: 0,
      });

    if (loyaltyError) {
      console.error('Loyalty points creation error:', loyaltyError);
    }
  }

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

  if (!user) return null;

  let { data: profile, error: profileError } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // If profile doesn't exist, create it
  if (!profile && !profileError) {
    console.log('Profile not found, creating one...');

    const { data: newProfile, error: createError } = await supabase
      .from('users_profile')
      .insert({
        id: user.id,
        full_name: user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: 'user',
        password_hash: '',
        two_fa_enabled: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create profile:', createError);
    } else {
      profile = newProfile;
      console.log('Profile created successfully:', profile);

      // Also create loyalty points entry
      await supabase
        .from('loyalty_points')
        .insert({
          user_id: user.id,
          total_points: 0,
        });
    }
  }

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
