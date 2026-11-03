/**
 * NEXORA Notification Service
 */
import { supabase, ensureClient } from '../config/supabase.js';

export const notificationService = {
  /**
   * Retrieves notifications for current user
   */
  async getNotifications(userId) {
    if (!ensureClient()) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(*),
        post:posts(id, content, media_urls)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  /**
   * Retrieves unread notification count
   */
  async getUnreadCount(userId) {
    if (!ensureClient()) return 0;
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  },

  /**
   * Marks a single notification as read
   */
  async markAsRead(notificationId) {
    if (!ensureClient()) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  },

  /**
   * Marks all notifications as read for current user
   */
  async markAllAsRead(userId) {
    if (!ensureClient()) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  },

  /**
   * Subscribes to realtime notifications
   */
  subscribeToNotifications(userId, onNotification) {
    if (!supabase) return null;

    return supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          const { data: actor } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.actor_id)
            .single();

          onNotification({
            ...payload.new,
            actor
          });
        }
      )
      .subscribe();
  }
};
