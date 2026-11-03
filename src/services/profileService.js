/**
 * NEXORA Profile Service
 */
import { supabase, ensureClient } from '../config/supabase.js';

export const profileService = {
  /**
   * Retrieves profile by user UUID
   */
  async getProfileById(userId) {
    if (!ensureClient()) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Retrieves profile by username
   */
  async getProfileByUsername(username) {
    if (!ensureClient()) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Updates profile fields for the authenticated user
   */
  async updateProfile(userId, updates) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Checks if user A is following user B
   */
  async isFollowing(followerId, followingId) {
    if (!ensureClient() || !followerId || !followingId) return false;
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) return false;
    return Boolean(data);
  },

  /**
   * Follows a user
   */
  async followUser(followerId, followingId) {
    if (!ensureClient()) throw new Error('Database client not configured');
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId
      });

    if (error) throw error;

    // Trigger notification
    await supabase.from('notifications').insert({
      user_id: followingId,
      actor_id: followerId,
      type: 'follow'
    }).catch(() => {});

    return true;
  },

  /**
   * Unfollows a user
   */
  async unfollowUser(followerId, followingId) {
    if (!ensureClient()) throw new Error('Database client not configured');
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return true;
  },

  /**
   * Retrieves list of followers for a user
   */
  async getFollowers(userId) {
    if (!ensureClient()) return [];
    const { data, error } = await supabase
      .from('follows')
      .select('follower:profiles!follows_follower_id_fkey(*)')
      .eq('following_id', userId);

    if (error) throw error;
    return (data || []).map(f => f.follower);
  },

  /**
   * Retrieves list of users that user is following
   */
  async getFollowing(userId) {
    if (!ensureClient()) return [];
    const { data, error } = await supabase
      .from('follows')
      .select('following:profiles!follows_following_id_fkey(*)')
      .eq('follower_id', userId);

    if (error) throw error;
    return (data || []).map(f => f.following);
  }
};
