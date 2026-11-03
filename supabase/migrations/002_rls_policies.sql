-- ==============================================================================
-- NEXORA - Social Networking Platform
-- Database Migration: 002_rls_policies.sql
-- Row Level Security (RLS) Policies
-- ==============================================================================

-- Helper Function: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- 2. COMMUNITIES RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public communities are viewable by everyone" 
ON public.communities FOR SELECT 
USING (NOT is_private OR auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE community_id = id
));

CREATE POLICY "Authenticated users can create communities" 
ON public.communities FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Community creators and admins can update community" 
ON public.communities FOR UPDATE 
TO authenticated 
USING (auth.uid() = creator_id OR public.is_admin(auth.uid()));

-- 3. COMMUNITY MEMBERS RLS
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members are viewable by everyone" 
ON public.community_members FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can join communities" 
ON public.community_members FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave community or admins can remove" 
ON public.community_members FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 4. POSTS RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone except blocked users" 
ON public.posts FOR SELECT 
USING (
    user_id NOT IN (
        SELECT blocked_id FROM public.user_blocks WHERE blocker_id = auth.uid()
    ) AND user_id NOT IN (
        SELECT blocker_id FROM public.user_blocks WHERE blocked_id = auth.uid()
    )
);

CREATE POLICY "Authenticated users can create posts" 
ON public.posts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" 
ON public.posts FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts or admins can delete" 
ON public.posts FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 5. POST MEDIA RLS
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post media viewable by everyone" 
ON public.post_media FOR SELECT 
USING (true);

CREATE POLICY "Authors can insert media" 
ON public.post_media FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- 6. LIKES RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone" 
ON public.likes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can like posts" 
ON public.likes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" 
ON public.likes FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 7. COMMENTS RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
ON public.comments FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments or post owners or admins" 
ON public.comments FOR DELETE 
TO authenticated 
USING (
    auth.uid() = user_id 
    OR public.is_admin(auth.uid()) 
    OR auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id)
);

-- 8. FOLLOWS RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone" 
ON public.follows FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can follow" 
ON public.follows FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
ON public.follows FOR DELETE 
TO authenticated 
USING (auth.uid() = follower_id);

-- 9. BOOKMARKS & COLLECTIONS RLS
ALTER TABLE public.bookmark_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections or public ones" 
ON public.bookmark_collections FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR NOT is_private);

CREATE POLICY "Users can manage own collections" 
ON public.bookmark_collections FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own bookmarks" 
ON public.bookmarks FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" 
ON public.bookmarks FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" 
ON public.bookmarks FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 10. NOTIFICATIONS RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "System/Users can insert notifications" 
ON public.notifications FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 11. CONVERSATIONS & MESSAGES RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view conversations" 
ON public.conversations FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members 
        WHERE conversation_id = id AND user_id = auth.uid()
    )
);

CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations FOR INSERT 
TO authenticated 
WITH CHECK (true);

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view conversation participants" 
ON public.conversation_members FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members cm 
        WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert themselves or partners into conversation" 
ON public.conversation_members FOR INSERT 
TO authenticated 
WITH CHECK (true);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages in conversation" 
ON public.messages FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members 
        WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Members can send messages in conversation" 
ON public.messages FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (
        SELECT 1 FROM public.conversation_members 
        WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
);

-- 12. REPORTS RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert reports" 
ON public.reports FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view and update all reports" 
ON public.reports FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- 13. MODERATION ACTIONS RLS
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view and insert moderation actions" 
ON public.moderation_actions FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- 14. USER BLOCKS RLS
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their own blocks" 
ON public.user_blocks FOR ALL 
TO authenticated 
USING (auth.uid() = blocker_id);
