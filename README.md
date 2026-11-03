# NEXORA — Connect Beyond Boundaries

NEXORA is a modern, production-ready, full-stack social networking platform inspired by Instagram, Threads, Reddit, and Discord. It brings together social feeds, rich multimedia sharing, discussions, community hubs, and private real-time direct messaging into a unified experience without requiring a self-managed VPS.

---

## 🚀 Tech Stack

- **Frontend:** Modern Vanilla JavaScript (ES Modules), HTML5, CSS3 Custom Properties (Design System), Lucide Icons.
- **Backend & Database:** Supabase (PostgreSQL 15+, Row Level Security, Supabase Auth, Supabase Storage, Supabase Realtime).
- **Deployment:** Vercel / GitHub Pages / Cloudflare Pages (Serverless static hosting with zero maintenance).

---

## 📂 Project Architecture & Structure

```
D:\Projects\NEXORA/
├── index.html                   # Platform landing & feature presentation
├── login.html                   # User login with auth session persistence
├── register.html                # Registration (username uniqueness & validation)
├── forgot-password.html         # Secure password recovery
├── feed.html                    # Main feed (For You, Following, Latest, Trending)
├── explore.html                 # Discovery & global search (people, posts, topics)
├── profile.html                 # User profiles, statistics, followers/following, edits
├── messages.html                # Real-time private direct messaging
├── notifications.html           # Real-time activity notifications (likes, replies, follows)
├── communities.html             # Community hubs (create, join, discussions)
├── bookmarks.html               # Private saved posts
├── settings.html                # Account, profile, security & DB configuration
├── admin.html                   # Verified backend role admin dashboard & moderation
├── config.js                    # Global runtime Supabase credentials helper
├── vercel.json                  # Production clean URLs & security headers
├── package.json                 # Project dependencies & local runner
├── assets/
│   └── css/
│       ├── variables.css        # Design tokens: palette, typography, radii, shadows
│       ├── base.css             # CSS reset, utilities, animations, scrollbars
│       ├── components.css       # Buttons, cards, modals, tabs, toasts, avatars
│       ├── layout.css           # Desktop 3-column & mobile responsive navigation
│       └── pages/               # Page-specific stylesheets
├── src/
│   ├── config/
│   │   └── supabase.js          # ESM Supabase client with interactive config modal
│   ├── services/
│   │   ├── authService.js       # Signup, login, logout, password management
│   │   ├── profileService.js    # Profile retrieval, updates, follow/unfollow
│   │   ├── postService.js       # Feed filtering, post creation & deletion
│   │   ├── interactionService.js# Likes, comments, nested replies, bookmarks
│   │   ├── messageService.js    # Direct 1-on-1 chats & Realtime listener
│   │   ├── notificationService.js# In-app notifications & realtime updates
│   │   ├── communityService.js  # Communities CRUD, memberships, feeds
│   │   ├── searchService.js     # Global search and trending hashtags
│   │   ├── adminService.js      # Backend-verified metrics & content moderation
│   │   └── storageService.js    # Supabase Storage media upload engine
│   ├── components/
│   │   ├── navbar.js            # Left sidebar & mobile bottom bar
│   │   ├── rightSidebar.js      # Search, trending topics, suggested users
│   │   ├── postCard.js          # Dynamic post cards with media, likes, comments
│   │   ├── postComposer.js      # Text & media upload composer with preview
│   │   ├── commentModal.js      # Interactive comment thread & reply modal
│   │   ├── confirmModal.js      # Reusable confirmation dialog
│   │   └── toast.js             # Toast notifications banner
│   └── utils/
│       ├── formatters.js        # Relative dates (e.g. 2h ago), compact numbers (1.2k)
│       ├── validators.js        # Username, email, password, file size/type validation
│       └── security.js          # XSS mitigation, HTML escaping, hashtag & mention parser
└── supabase/
    ├── migrations/
    │   ├── 001_initial_schema.sql    # 17 normalized tables + counter triggers
    │   ├── 002_rls_policies.sql      # Row Level Security (RLS) on all tables
    │   └── 003_storage_buckets.sql   # Storage buckets & policies
    └── seed.sql                      # Sample communities and demo data
```

---

## 🛠️ Step-by-Step Setup Guide

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Under **Project Settings -> API**, copy your:
   - **Project URL** (e.g., `https://xyzproject.supabase.co`)
   - **Project Anon / Public API Key** (starts with `eyJ...`)

### 2. Run Database Migrations
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Run the SQL files in order:
   - `supabase/migrations/001_initial_schema.sql` (Creates all tables, relationships, and counter triggers)
   - `supabase/migrations/002_rls_policies.sql` (Enables strict Row Level Security)
   - `supabase/migrations/003_storage_buckets.sql` (Initializes storage buckets for avatars and media)
   - *(Optional)* `supabase/seed.sql` (Seeds initial communities)

### 3. Connect Credentials to NEXORA
You can connect your credentials in **any of the following ways**:

- **Option A (Interactive UI - Easiest):** Open `index.html` or `feed.html` in your browser. A modal will prompt you to enter your Supabase URL and Anon Key. The app will save them securely to local storage.
- **Option B (Configuration File):** Open `config.js` in the project root and fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY`:
  ```javascript
  window.NEXORA_CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key'
  };
  ```

---

## 💻 Running Locally

You can serve the directory using any static file server:

```bash
# Using Node.js serve
npx serve -s . -l 3000

# OR using Python
python -m http.server 3000
```
Then visit `http://localhost:3000` in your web browser.

---

## 🌐 Deploying to Vercel

1. Push this directory to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial release of NEXORA platform"
   git branch -M main
   git remote add origin https://github.com/yourusername/nexora.git
   git push -u origin main
   ```
2. Import the repository into [Vercel](https://vercel.com).
3. The included `vercel.json` will automatically configure clean URLs and enterprise security headers.
4. Deploy!

---

## 🛡️ Security & Privacy
- **Row Level Security (RLS):** Every single PostgreSQL table has explicit RLS policies enforced directly at the database engine level.
- **Admin Verification:** The admin console (`admin.html`) enforces a database check (`is_admin()`) rather than client-only flags.
- **XSS Protection:** All user inputs and rich text are escaped and sanitized via `src/utils/security.js`.
- **Private Encrypted Messaging:** Only participants in a conversation row can query or insert messages.
- **Private Bookmarks:** Bookmarks are strictly private to their owner through authenticated RLS.
