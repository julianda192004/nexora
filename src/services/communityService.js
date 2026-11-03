/**
 * NEXORA Community Service
 */
import { supabase, ensureClient } from '../config/supabase.js';

export const communityService = {
  /**
   * Retrieves all communities or searches by name
   */
  async getCommunities(searchQuery = '') {
    if (!ensureClient()) return [];

    let query = supabase
      .from('communities')
      .select('*')
      .order('members_count', { ascending: false });

    if (searchQuery.trim()) {
      query = query.ilike('name', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;
    return data || [];
  },

  /**
   * Retrieves community by unique slug
   */
  async getCommunityBySlug(slug) {
    if (!ensureClient()) return null;

    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        creator:profiles!communities_creator_id_fkey(*)
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Creates a new community
   */
  async createCommunity({ name, slug, description, avatarUrl = null, bannerUrl = null, creatorId }) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    const { data, error } = await supabase
      .from('communities')
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        description: description ? description.trim() : null,
        avatar_url: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanSlug}`,
        banner_url: bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop',
        creator_id: creatorId
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as member & admin
    await supabase.from('community_members').insert({
      community_id: data.id,
      user_id: creatorId,
      role: 'creator'
    });

    return data;
  },

  /**
   * Checks if user is member of community
   */
  async isMember(communityId, userId) {
    if (!ensureClient() || !userId) return false;

    const { data } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .maybeSingle();

    return Boolean(data);
  },

  /**
   * Joins a community
   */
  async joinCommunity(communityId, userId) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const { error } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: userId,
        role: 'member'
      });

    if (error) throw error;

    // Increment members count
    await supabase.rpc('increment_community_members', { comm_id: communityId }).catch(async () => {
      // Fallback query if RPC isn't loaded
      const { data: comm } = await supabase.from('communities').select('members_count').eq('id', communityId).single();
      if (comm) {
        await supabase.from('communities').update({ members_count: (comm.members_count || 0) + 1 }).eq('id', communityId);
      }
    });

    return true;
  },

  /**
   * Leaves a community
   */
  async leaveCommunity(communityId, userId) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;

    const { data: comm } = await supabase.from('communities').select('members_count').eq('id', communityId).single();
    if (comm) {
      await supabase.from('communities').update({ members_count: Math.max(0, (comm.members_count || 1) - 1) }).eq('id', communityId);
    }

    return true;
  }
};
