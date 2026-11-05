-- ==============================================================================
-- NEXORA - Social Networking Platform
-- Database Seed: seed.sql
-- Optional Development & Testing Seed Data
-- ==============================================================================

-- Note: Seed data creates standard sample communities and showcases content structure.
-- Real user accounts should be created via Supabase Auth signup.

-- Sample Official Communities
INSERT INTO public.communities (id, name, slug, description, avatar_url, banner_url, creator_id, members_count, posts_count, is_private)
VALUES 
    (
        'a0000000-0000-0000-0000-000000000001',
        'Nexora Tech & AI',
        'tech-ai',
        'Discussions on artificial intelligence, software engineering, cloud computing, and developer tools.',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop',
        NULL,
        1420,
        38,
        false
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        'Designers & Creators',
        'designers',
        'UI/UX design, visual aesthetics, generative art, and creative showcases from around the world.',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&h=400&fit=crop',
        NULL,
        890,
        24,
        false
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'Web3 & Cyberpunk',
        'cyberpunk',
        'Futurism, digital identity, decentralized systems, and high-tech street aesthetics.',
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&h=400&fit=crop',
        NULL,
        612,
        15,
        false
    )
ON CONFLICT (slug) DO NOTHING;
