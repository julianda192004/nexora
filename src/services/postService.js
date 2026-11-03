/**
 * NEXORA Post Service
 * Handles feed retrieval, post creation, deletion, and filtering
 */
import { supabase, ensureClient } from '../config/supabase.js';

export const postService = {
  /**
   * Retrieves feed posts based on category filter
   * Categories: 'for_you', 'following', 'latest', 'trending'
   */
  async getFeedPosts({ filter = 'for_you', currentUserId = null, page = 0, limit = 20 }) {
    if (!ensureClient()) return [];

    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_user_id_fkey(*),
        community:communities!posts_community_id_fkey(id, name, slug, avatar_url)
      `);

    if (filter === 'following' && currentUserId) {
      // Get IDs of users current user is following
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      const followingIds = (follows || []).map(f => f.following_id);
      followingIds.push(currentUserId); // Include own posts

      query = query.in('user_id', followingIds);
    }

    if (filter === 'trending') {
      query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const from = page * limit;
    const to = from + limit - 1;
    const { data: posts, error } = await query.range(from, to);

    if (error) throw error;
    if (!posts || posts.length === 0) return [];

    // If current user is logged in, attach is_liked and is_bookmarked flags
    if (currentUserId) {
      const postIds = posts.map(p => p.id);

      const [likesRes, bookmarksRes] = await Promise.all([
        supabase.from('likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds),
        supabase.from('bookmarks').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      ]);

      const likedSet = new Set((likesRes.data || []).map(l => l.post_id));
      const bookmarkedSet = new Set((bookmarksRes.data || []).map(b => b.post_id));

      return posts.map(post => ({
        ...post,
        is_liked: likedSet.has(post.id),
        is_bookmarked: bookmarkedSet.has(post.id)
      }));
    }

    return posts;
  },

  /**
   * Retrieves posts authored by a specific user
   */
  async getPostsByUserId(userId, currentUserId = null) {
    if (!ensureClient()) return [];

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_user_id_fkey(*),
        community:communities!posts_community_id_fkey(id, name, slug, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!posts || posts.length === 0) return [];

    if (currentUserId) {
      const postIds = posts.map(p => p.id);
      const [likesRes, bookmarksRes] = await Promise.all([
        supabase.from('likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds),
        supabase.from('bookmarks').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      ]);

      const likedSet = new Set((likesRes.data || []).map(l => l.post_id));
      const bookmarkedSet = new Set((bookmarksRes.data || []).map(b => b.post_id));

      return posts.map(post => ({
        ...post,
        is_liked: likedSet.has(post.id),
        is_bookmarked: bookmarkedSet.has(post.id)
      }));
    }

    return posts;
  },

  /**
   * Retrieves posts inside a specific community
   */
  async getPostsByCommunity(communityId, currentUserId = null) {
    if (!ensureClient()) return [];

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_user_id_fkey(*),
        community:communities!posts_community_id_fkey(id, name, slug, avatar_url)
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return posts || [];
  },

  /**
   * Publishes a new post
   */
  async createPost({ userId, content, mediaUrls = [], mediaType = 'none', communityId = null }) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: content ? content.trim() : null,
        media_urls: mediaUrls,
        media_type: mediaType,
        community_id: communityId
      })
      .select(`
        *,
        author:profiles!posts_user_id_fkey(*),
        community:communities!posts_community_id_fkey(id, name, slug, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deletes a post
   */
  async deletePost(postId) {
    if (!ensureClient()) throw new Error('Database client not configured');
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    return true;
  }
};
