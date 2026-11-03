/**
 * NEXORA Authentication Service
 */
import { supabase, ensureClient } from '../config/supabase.js';

export const authService = {
  /**
   * Registers a new user with Supabase Auth
   */
  async signUp({ email, password, username, displayName }) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplay = displayName.trim();

    // Check if username already exists in profiles table
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (existingUser) {
      throw new Error('This username is already taken. Please choose another.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: cleanUsername,
          display_name: cleanDisplay,
          avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`
        }
      }
    });

    if (error) throw error;
    return data;
  },

  /**
   * Signs in user with email & password
   */
  async signIn({ email, password }) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) throw error;
    return data;
  },

  /**
   * Signs out current user
   */
  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = 'login.html';
  },

  /**
   * Retrieves active session
   */
  async getSession() {
    if (!supabase) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session;
  },

  /**
   * Retrieves currently logged in user
   */
  async getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Sends password reset email
   */
  async resetPassword(email) {
    if (!ensureClient()) throw new Error('Database client not configured');
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/settings.html?action=reset_password`
    });
    if (error) throw error;
    return data;
  },

  /**
   * Updates password for active authenticated user
   */
  async updatePassword(newPassword) {
    if (!ensureClient()) throw new Error('Database client not configured');
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },

  /**
   * Listens to auth state changes (login, logout, refresh)
   */
  onAuthStateChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  }
};
