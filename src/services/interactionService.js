/**
 * NEXORA Interaction Service
 * Likes, Comments, Replies, Bookmarks
 */
import { supabase, ensureClient } from '../config/supabase.js';

export const interactionService = {
  /**
   * Toggles like on a post
   */
  async toggleLike(postId, userId, authorId = null) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id);
      return { liked: false };
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: userId });

      // Notify post author if not liking own post
      if (authorId && authorId !== userId) {
        await supabase.from('notifications').insert({
          user_id: authorId,
          actor_id: userId,
          type: 'like',
          post_id: postId
        }).catch(() => {});
      }

      return { liked: true };
    }
  },

  /**
   * Retrieves comments for a post
   */
  async getComments(postId) {
    if (!ensureClient()) return [];

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_user_id_fkey(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Adds a new comment or reply
   */
  async addComment({ postId, userId, content, parentId = null, postAuthorId = null }) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        parent_id: parentId
      })
      .select(`
        *,
        author:profiles!comments_user_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    // Trigger notification
    if (postAuthorId && postAuthorId !== userId) {
      await supabase.from('notifications').insert({
        user_id: postAuthorId,
        actor_id: userId,
        type: parentId ? 'reply' : 'comment',
        post_id: postId,
        comment_id: data.id
      }).catch(() => {});
    }

    return data;
  },

  /**
   * Deletes a comment
   */
  async deleteComment(commentId) {
    if (!ensureClient()) throw new Error('Database client not configured');
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return true;
  },

  /**
   * Toggles bookmark on a post
   */
  async toggleBookmark(postId, userId) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase.from('bookmarks').delete().eq('id', existing.id);
      return { bookmarked: false };
    } else {
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: userId });
      return { bookmarked: true };
    }
  },

  /**
   * Retrieves all bookmarked posts for a user
   */
  async getUserBookmarks(userId) {
    if (!ensureClient()) return [];

    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        post:posts(
          *,
          author:profiles!posts_user_id_fkey(*),
          community:communities!posts_community_id_fkey(id, name, slug)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).filter(b => Boolean(b.post)).map(b => ({
      ...b.post,
      is_liked: false, // will be evaluated
      is_bookmarked: true
    }));
  }
};
