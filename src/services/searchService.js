/**
 * NEXORA Search & Discovery Service
 */
import { supabase, ensureClient } from '../config/supabase.js';

export const searchService = {
  /**
   * Global search across users, posts, and communities
   */
  async searchGlobal(query) {
    if (!ensureClient() || !query || !query.trim()) {
      return { users: [], posts: [], communities: [] };
    }

    const term = query.trim();

    const [usersRes, postsRes, communitiesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(10),

      supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_user_id_fkey(*)
        `)
        .ilike('content', `%${term}%`)
        .limit(15),

      supabase
        .from('communities')
        .select('*')
        .or(`name.ilike.%${term}%,slug.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(8)
    ]);

    return {
      users: usersRes.data || [],
      posts: postsRes.data || [],
      communities: communitiesRes.data || []
    };
  },

  /**
   * Retrieves trending topics and hashtags
   */
  getTrendingTopics() {
    return [
      { tag: 'Technology', posts: '28.4K', category: 'Technology' },
      { tag: 'ArtificialIntelligence', posts: '19.2K', category: 'AI & Machine Learning' },
      { tag: 'DesignInspiration', posts: '12.8K', category: 'UI/UX Design' },
      { tag: 'NexoraCommunity', posts: '9.6K', category: 'Platform' },
      { tag: 'WebDevelopment', posts: '8.1K', category: 'Coding' },
      { tag: 'Cybersecurity', posts: '5.3K', category: 'Infosec' }
    ];
  },

  /**
   * Retrieves suggested users to follow
   */
  async getSuggestedUsers(currentUserId, limit = 5) {
    if (!ensureClient()) return [];

    let query = supabase
      .from('profiles')
      .select('*')
      .order('followers_count', { ascending: false });

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query.limit(limit);
    if (error) return [];
    return data || [];
  }
};
