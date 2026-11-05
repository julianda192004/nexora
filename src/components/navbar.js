/**
 * NEXORA Dynamic Navigation Component
 * Renders Left Sidebar, Mobile Topbar, and Mobile Bottom Nav
 */
import { authService } from '../services/authService.js';
import { profileService } from '../services/profileService.js';
import { notificationService } from '../services/notificationService.js';

export async function renderNavigation(activePage = 'feed') {
  const user = await authService.getCurrentUser();
  const meta = user?.user_metadata || {};
  const username = meta.username || 'user';

  // Fetch latest profile data from database (not stale auth session metadata)
  let displayName = meta.display_name || 'Nexora Member';
  let avatarUrl = meta.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;
  let role = meta.role || 'user';

  if (user) {
    try {
      const profile = await profileService.getProfileById(user.id);
      if (profile) {
        displayName = profile.display_name || displayName;
        avatarUrl = profile.avatar_url || avatarUrl;
        role = profile.role || role;
      }
    } catch (e) {
      // fallback to metadata if profile fetch fails
    }
  }

  let unreadCount = 0;
  if (user) {
    unreadCount = await notificationService.getUnreadCount(user.id);
  }

  // 1. LEFT SIDEBAR
  const leftSidebarContainer = document.getElementById('sidebar-left-root');
  if (leftSidebarContainer) {
    leftSidebarContainer.className = 'sidebar-left';
    leftSidebarContainer.innerHTML = `
      <div>
        <a href="feed.html" class="brand-wrap">
          <div class="brand-logo-icon">
            <i data-lucide="zap"></i>
          </div>
          <span class="brand-name">NEXORA</span>
        </a>

        <nav class="nav-links">
          <a href="feed.html" class="nav-item ${activePage === 'feed' ? 'active' : ''}">
            <i data-lucide="home"></i>
            <span>Home</span>
          </a>
          <a href="explore.html" class="nav-item ${activePage === 'explore' ? 'active' : ''}">
            <i data-lucide="compass"></i>
            <span>Explore</span>
          </a>
          <a href="notifications.html" class="nav-item ${activePage === 'notifications' ? 'active' : ''}">
            <i data-lucide="bell"></i>
            <span>Notifications</span>
            ${unreadCount > 0 ? `<span class="nav-badge" id="nav-badge-notif">${unreadCount}</span>` : ''}
          </a>
          <a href="messages.html" class="nav-item ${activePage === 'messages' ? 'active' : ''}">
            <i data-lucide="message-square"></i>
            <span>Messages</span>
          </a>
          <a href="communities.html" class="nav-item ${activePage === 'communities' ? 'active' : ''}">
            <i data-lucide="users"></i>
            <span>Communities</span>
          </a>
          <a href="bookmarks.html" class="nav-item ${activePage === 'bookmarks' ? 'active' : ''}">
            <i data-lucide="bookmark"></i>
            <span>Bookmarks</span>
          </a>
          <a href="profile.html?u=${encodeURIComponent(username)}" class="nav-item ${activePage === 'profile' ? 'active' : ''}">
            <i data-lucide="user"></i>
            <span>Profile</span>
          </a>
          <a href="settings.html" class="nav-item ${activePage === 'settings' ? 'active' : ''}">
            <i data-lucide="settings"></i>
            <span>Settings</span>
          </a>
          ${role === 'admin' ? `
            <a href="admin.html" class="nav-item ${activePage === 'admin' ? 'active' : ''}" style="color: var(--accent-rose);">
              <i data-lucide="shield-alert"></i>
              <span>Admin</span>
            </a>
          ` : ''}
        </nav>

        <button class="btn btn-primary btn-sidebar-post" id="btn-open-composer">
          <i data-lucide="plus-circle"></i>
          <span>Create Post</span>
        </button>
      </div>

      <div class="user-menu-btn" id="btn-user-profile-menu">
        <div class="avatar avatar-sm">
          <img src="${avatarUrl}" alt="${displayName}" />
        </div>
        <div class="user-meta-compact">
          <span class="display-name truncate">${displayName}</span>
          <span class="username truncate">@${username}</span>
        </div>
        <i data-lucide="more-horizontal" style="margin-left: auto; color: var(--text-muted); width: 18px;"></i>
      </div>
    `;
  }

  // 2. MOBILE TOP BAR
  const mobileTopRoot = document.getElementById('mobile-top-root');
  if (mobileTopRoot) {
    mobileTopRoot.className = 'mobile-top-bar';
    mobileTopRoot.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="brand-logo-icon" style="width: 32px; height: 32px; border-radius: 8px;">
          <i data-lucide="zap" style="width: 18px; height: 18px;"></i>
        </div>
        <span class="brand-name" style="font-size: 1.15rem;">NEXORA</span>
      </div>
      <div class="flex items-center gap-3">
        <a href="notifications.html" style="position: relative; color: var(--text-primary);">
          <i data-lucide="bell" style="width: 22px; height: 22px;"></i>
          ${unreadCount > 0 ? `<span class="nav-badge" style="position: absolute; top: -6px; right: -6px;">${unreadCount}</span>` : ''}
        </a>
        <a href="profile.html?u=${encodeURIComponent(username)}" class="avatar avatar-xs">
          <img src="${avatarUrl}" alt="${displayName}" />
        </a>
      </div>
    `;
  }

  // 3. MOBILE BOTTOM NAV
  const mobileBottomRoot = document.getElementById('mobile-bottom-root');
  if (mobileBottomRoot) {
    mobileBottomRoot.className = 'mobile-bottom-nav';
    mobileBottomRoot.innerHTML = `
      <a href="feed.html" class="mobile-nav-link ${activePage === 'feed' ? 'active' : ''}">
        <i data-lucide="home"></i>
      </a>
      <a href="explore.html" class="mobile-nav-link ${activePage === 'explore' ? 'active' : ''}">
        <i data-lucide="compass"></i>
      </a>
      <button class="mobile-create-post-btn" id="btn-mobile-composer">
        <i data-lucide="plus"></i>
      </button>
      <a href="messages.html" class="mobile-nav-link ${activePage === 'messages' ? 'active' : ''}">
        <i data-lucide="message-square"></i>
      </a>
      <a href="profile.html?u=${encodeURIComponent(username)}" class="mobile-nav-link ${activePage === 'profile' ? 'active' : ''}">
        <i data-lucide="user"></i>
      </a>
    `;
  }

  // Attach event listener to open composer
  const triggerComposer = () => {
    const composerModal = document.getElementById('composer-modal-overlay');
    if (composerModal) {
      composerModal.classList.add('active');
      const textarea = composerModal.querySelector('textarea');
      if (textarea) textarea.focus();
    } else {
      window.location.href = 'feed.html?action=compose';
    }
  };

  document.getElementById('btn-open-composer')?.addEventListener('click', triggerComposer);
  document.getElementById('btn-mobile-composer')?.addEventListener('click', triggerComposer);

  // User Profile bottom button click menu
  document.getElementById('btn-user-profile-menu')?.addEventListener('click', () => {
    window.location.href = `profile.html?u=${encodeURIComponent(username)}`;
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
