/**
 * NEXORA Private Messaging Service
 */
import { supabase, ensureClient } from '../config/supabase.js';

export const messageService = {
  /**
   * Retrieves all conversations for current user
   */
  async getConversations(userId) {
    if (!ensureClient()) return [];

    // Find conversation IDs user is part of
    const { data: memberRows, error: memberErr } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    if (memberErr || !memberRows || memberRows.length === 0) return [];
    const convIds = memberRows.map(r => r.conversation_id);

    // Fetch conversations with members and last message
    const { data: convs, error } = await supabase
      .from('conversations')
      .select(`
        *,
        members:conversation_members(
          user_id,
          user:profiles(*)
        ),
        messages(
          id,
          sender_id,
          content,
          media_url,
          created_at
        )
      `)
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (convs || []).map(c => {
      // Find partner (other user in 1-on-1 direct message)
      const otherMember = c.members.find(m => m.user_id !== userId);
      const lastMsg = c.messages && c.messages.length > 0
        ? c.messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        : null;

      return {
        id: c.id,
        partner: otherMember ? otherMember.user : null,
        lastMessage: lastMsg,
        updated_at: c.updated_at
      };
    });
  },

  /**
   * Retrieves messages in a specific conversation
   */
  async getMessages(conversationId) {
    if (!ensureClient()) return [];

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Sends a message in a conversation
   */
  async sendMessage({ conversationId, senderId, content, mediaUrl = null }) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content ? content.trim() : null,
        media_url: mediaUrl
      })
      .select(`
        *,
        sender:profiles(*)
      `)
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  },

  /**
   * Starts or retrieves an existing 1-on-1 direct conversation
   */
  async getOrCreateDirectConversation(currentUserId, targetUserId) {
    if (!ensureClient()) throw new Error('Database client not configured');

    // Check if conversation already exists between both users
    const { data: myConvs } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (myConvs && myConvs.length > 0) {
      const myConvIds = myConvs.map(c => c.conversation_id);
      const { data: match } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', targetUserId)
        .in('conversation_id', myConvIds)
        .maybeSingle();

      if (match) {
        return match.conversation_id;
      }
    }

    // Create new conversation
    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convErr) throw convErr;

    // Add both members
    await supabase.from('conversation_members').insert([
      { conversation_id: newConv.id, user_id: currentUserId },
      { conversation_id: newConv.id, user_id: targetUserId }
    ]);

    return newConv.id;
  },

  /**
   * Subscribes to realtime messages in a conversation
   */
  subscribeToConversation(conversationId, onNewMessage) {
    if (!supabase) return null;

    return supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch sender details
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();

          onNewMessage({
            ...payload.new,
            sender
          });
        }
      )
      .subscribe();
  }
};
