-- ==============================================================================
-- NEXORA - Social Networking Platform
-- Database Migration: 003_storage_buckets.sql
-- Storage Buckets & Policies
-- ==============================================================================

-- Create Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('banners', 'banners', true),
    ('posts', 'posts', true),
    ('communities', 'communities', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 1. Storage Policies for Avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatar" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Storage Policies for Posts
CREATE POLICY "Post media is publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post media" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Storage Policies for Banners & Communities
CREATE POLICY "Banner media is publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banner media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Community media is publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'communities');

CREATE POLICY "Authenticated users can upload community media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'communities');
