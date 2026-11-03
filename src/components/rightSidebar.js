/**
 * NEXORA Right Sidebar Component
 * Search input, trending hashtags, suggested accounts, communities
 */
import { searchService } from '../services/searchService.js';
import { profileService } from '../services/profileService.js';
import { authService } from '../services/authService.js';
import { showToast } from './toast.js';

export async function renderRightSidebar() {
  const container = document.getElementById('sidebar-right-root');
  if (!container) return;

  container.className = 'sidebar-right';

  const user = await authService.getCurrentUser();
  const trending = searchService.getTrendingTopics();
  const suggestedUsers = await searchService.getSuggestedUsers(user?.id, 3);

  container.innerHTML = `
    <!-- Global Search -->
    <div class="search-box-wrap">
      <i data-lucide="search"></i>
      <input type="text" id="global-search-input" placeholder="Search NEXORA..." />
    </div>

    <!-- Trending Widget -->
    <div class="widget-card">
      <div class="widget-title">
        <span>Trending for you</span>
        <i data-lucide="trending-up" style="width: 18px; color: var(--accent-electric);"></i>
      </div>
      <div class="flex flex-col">
        ${trending.map(item => `
          <a href="explore.html?q=%23${encodeURIComponent(item.tag)}" class="widget-item" style="text-decoration: none;">
            <div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted);">${item.category}</div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: var(--font-size-sm);">#${item.tag}</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${item.posts} posts</div>
            </div>
            <i data-lucide="chevron-right" style="color: var(--text-muted); width: 16px;"></i>
          </a>
        `).join('')}
      </div>
    </div>

    <!-- Suggested Users Widget -->
    <div class="widget-card">
      <div class="widget-title">
        <span>Who to follow</span>
        <i data-lucide="user-plus" style="width: 18px; color: var(--primary-400);"></i>
      </div>
      <div class="flex flex-col" id="suggested-users-list">
        ${suggestedUsers.length === 0 ? `
          <div style="font-size: var(--font-size-xs); color: var(--text-muted); padding: var(--space-2) 0;">
            No user suggestions available.
          </div>
        ` : suggestedUsers.map(u => `
          <div class="widget-item">
            <a href="profile.html?u=${encodeURIComponent(u.username)}" class="flex items-center gap-2" style="text-decoration:none; overflow:hidden;">
              <div class="avatar avatar-sm">
                <img src="${u.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + u.username}" alt="${u.display_name}" />
              </div>
              <div class="truncate">
                <div style="font-weight: 600; font-size: var(--font-size-sm); color: var(--text-primary);">${u.display_name}</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-muted);">@${u.username}</div>
              </div>
            </a>
            <button class="btn btn-secondary btn-follow-suggested" data-id="${u.id}" style="padding: 4px 12px; font-size: var(--font-size-xs);">
              Follow
            </button>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Footer info -->
    <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.6; padding: 0 var(--space-2);">
      Terms of Service · Privacy Policy · Cookie Policy · Accessibility · © 2026 NEXORA Inc.
    </div>
  `;

  // Search input handler
  const searchInput = document.getElementById('global-search-input');
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.location.href = `explore.html?q=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });

  // Follow buttons on suggested users
  container.querySelectorAll('.btn-follow-suggested').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!user) {
        showToast('Please log in to follow users.', 'error');
        return;
      }
      const targetId = btn.getAttribute('data-id');
      try {
        btn.disabled = true;
        await profileService.followUser(user.id, targetId);
        btn.textContent = 'Following';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-outline');
        showToast('Followed successfully!', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to follow user', 'error');
        btn.disabled = false;
      }
    });
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
