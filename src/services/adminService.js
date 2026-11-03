/**
 * NEXORA Admin Service
 * Administrative metrics, moderation, and user management
 */
import { supabase, ensureClient } from '../config/supabase.js';

export const adminService = {
  /**
   * Verifies if current user has admin role via backend query
   */
  async verifyAdminAccess(userId) {
    if (!ensureClient() || !userId) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    return data.role === 'admin';
  },

  /**
   * Retrieves high-level platform metrics
   */
  async getMetrics() {
    if (!ensureClient()) return { usersCount: 0, postsCount: 0, communitiesCount: 0, reportsCount: 0 };

    const [usersCount, postsCount, commsCount, reportsCount] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('communities').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return {
      usersCount: usersCount.count || 0,
      postsCount: postsCount.count || 0,
      communitiesCount: commsCount.count || 0,
      reportsCount: reportsCount.count || 0
    };
  },

  /**
   * Retrieves list of users for administration
   */
  async getUsersList(limit = 50) {
    if (!ensureClient()) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Updates user role (e.g. promote to admin or moderator)
   */
  async updateUserRole(adminUserId, targetUserId, newRole) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const isAdmin = await this.verifyAdminAccess(adminUserId);
    if (!isAdmin) throw new Error('Unauthorized. Admin privilege required.');

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) throw error;

    // Log moderation action
    await supabase.from('moderation_actions').insert({
      moderator_id: adminUserId,
      target_user_id: targetUserId,
      action_type: `role_change_to_${newRole}`,
      notes: `User role modified to ${newRole}`
    }).catch(() => {});

    return data;
  },

  /**
   * Retrieves reported content
   */
  async getReports() {
    if (!ensureClient()) return [];

    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(username, display_name),
        reported_post:posts(id, content, user_id)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Resolves or dismisses a report
   */
  async resolveReport(adminUserId, reportId, newStatus) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const { data, error } = await supabase
      .from('reports')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deletes a reported or violating post by admin
   */
  async deletePostAsAdmin(adminUserId, postId, reason) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const isAdmin = await this.verifyAdminAccess(adminUserId);
    if (!isAdmin) throw new Error('Unauthorized: Admin privilege required.');

    // Log action before delete
    await supabase.from('moderation_actions').insert({
      moderator_id: adminUserId,
      target_post_id: postId,
      action_type: 'delete_post',
      notes: reason || 'Post deleted for violating terms'
    }).catch(() => {});

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    return true;
  }
};
