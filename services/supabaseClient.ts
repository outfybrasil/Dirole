
import { createClient } from '@supabase/supabase-js';

// ⚠️ SUBSTITUA PELAS SUAS CHAVES DO SUPABASE ⚠️
// @ts-ignore
export const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://gwvnwsvaepxwjasdupks.supabase.co';
// @ts-ignore
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dm53c3ZhZXB4d2phc2R1cGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDMwNzgsImV4cCI6MjA3OTU3OTA3OH0.fTpMx6SidFTgR6rk1mNupO9KBPVMJ7f-KBMO2BOr3dw';

console.log("[Supabase Diagnostic] Initializing client with URL:", SUPABASE_URL);
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- AUTH WITH EMAIL & PASSWORD ---

export const signUpWithEmail = async (email: string, password: string, userData: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.name,
        nickname: userData.nickname,
        avatar_url: userData.avatar,
        age: userData.age,
        gender: userData.gender
      }
    }
  });
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const deleteAccount = async (userId: string) => {
  // 1. Delete profile data (Cascade should handle relations if set up, but explicit is safer for MVP)
  // Note: Client-side deletion of Auth user is restricted. 
  // We delete the 'profiles' row which wipes their app data.
  // A backend trigger should ideally handle the Auth user deletion or an Admin API.

  try {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;

    // 2. Sign out
    await signOut();
    return true;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
};
