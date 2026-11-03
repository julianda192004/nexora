/**
 * NEXORA Post Card Component
 * Renders individual posts with likes, comments, bookmarks, and sharing
 */
import { formatRelativeTime, formatCompactNumber } from '../utils/formatters.js';
import { parseContentTags, escapeHTML } from '../utils/security.js';
import { interactionService } from '../services/interactionService.js';
import { postService } from '../services/postService.js';
import { showToast } from './toast.js';
import { showConfirmModal } from './confirmModal.js';
import { openCommentModal } from './commentModal.js';

export function createPostCard(post, currentUser) {
  const card = document.createElement('article');
  card.className = 'post-card fade-in';
  card.id = `post-${post.id}`;

  const author = post.author || {
    username: 'unknown',
    display_name: 'Nexora Member',
    avatar_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=unknown'
  };

  const isAuthor = currentUser && currentUser.id === post.user_id;
  const isAdmin = currentUser?.user_metadata?.role === 'admin';
  const mediaUrls = post.media_urls || [];
  const hasMedia = Array.isArray(mediaUrls) && mediaUrls.length > 0;

  card.innerHTML = `
    <div class="post-avatar-col">
      <a href="profile.html?u=${encodeURIComponent(author.username)}" class="avatar avatar-md">
        <img src="${author.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + author.username}" alt="${escapeHTML(author.display_name)}" />
      </a>
    </div>

    <div class="post-content-col">
      <!-- Post Header -->
      <div class="post-header">
        <div class="post-author-info">
          <a href="profile.html?u=${encodeURIComponent(author.username)}" class="post-author-name">
            ${escapeHTML(author.display_name)}
            ${author.is_verified ? '<span class="verified-badge"><i data-lucide="check-circle-2" style="width:14px;height:14px;"></i></span>' : ''}
          </a>
          <span class="post-author-username">@${escapeHTML(author.username)}</span>
          <span style="color: var(--text-muted); font-size: 0.75rem;">·</span>
          <span class="post-time">${formatRelativeTime(post.created_at)}</span>
          ${post.community ? `
            <a href="communities.html?c=${encodeURIComponent(post.community.slug)}" class="topic-tag-chip" style="padding: 2px 8px; font-size: 0.72rem; margin-left: 4px;">
              c/${escapeHTML(post.community.name)}
            </a>
          ` : ''}
        </div>

        <!-- Post Options Menu -->
        <div style="position: relative;">
          <button class="post-menu-trigger" aria-label="More options">
            <i data-lucide="more-horizontal" style="width: 18px; height: 18px;"></i>
          </button>
          <div class="post-dropdown-menu hidden" style="position: absolute; right: 0; top: 100%; background: var(--bg-surface-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-md); box-shadow: var(--shadow-md); z-index: 20; min-width: 140px; overflow: hidden;">
            ${(isAuthor || isAdmin) ? `
              <button class="menu-action-delete" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; color: var(--accent-rose); font-size: var(--font-size-xs);">
                <i data-lucide="trash-2" style="width: 14px;"></i> Delete
              </button>
            ` : ''}
            <button class="menu-action-report" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; color: var(--text-secondary); font-size: var(--font-size-xs);">
              <i data-lucide="flag" style="width: 14px;"></i> Report Post
            </button>
          </div>
        </div>
      </div>

      <!-- Post Body Text -->
      ${post.content ? `
        <div class="post-body-text">${parseContentTags(post.content)}</div>
      ` : ''}

      <!-- Media Grid -->
      ${hasMedia ? `
        <div class="post-media-grid">
          ${mediaUrls[0].match(/\.(mp4|webm|mov)$/i) || post.media_type === 'video' ? `
            <video src="${escapeHTML(mediaUrls[0])}" controls playsinline preload="metadata"></video>
          ` : `
            <img src="${escapeHTML(mediaUrls[0])}" alt="Post media" loading="lazy" />
          `}
        </div>
      ` : ''}

      <!-- Post Actions Footer -->
      <div class="post-actions">
        <!-- Like -->
        <button class="post-action-btn ${post.is_liked ? 'active-like' : ''}" data-action="like">
          <i data-lucide="heart" style="width: 18px; height: 18px; ${post.is_liked ? 'fill: currentColor;' : ''}"></i>
          <span class="like-counter">${formatCompactNumber(post.likes_count)}</span>
        </button>

        <!-- Comment -->
        <button class="post-action-btn" data-action="comment">
          <i data-lucide="message-circle" style="width: 18px; height: 18px;"></i>
          <span>${formatCompactNumber(post.comments_count)}</span>
        </button>

        <!-- Bookmark -->
        <button class="post-action-btn ${post.is_bookmarked ? 'active-bookmark' : ''}" data-action="bookmark">
          <i data-lucide="bookmark" style="width: 18px; height: 18px; ${post.is_bookmarked ? 'fill: currentColor;' : ''}"></i>
        </button>

        <!-- Share -->
        <button class="post-action-btn" data-action="share">
          <i data-lucide="share-2" style="width: 18px; height: 18px;"></i>
        </button>
      </div>
    </div>
  `;

  // Attach Interaction Listeners
  const dropdownMenu = card.querySelector('.post-dropdown-menu');
  const menuTrigger = card.querySelector('.post-menu-trigger');

  menuTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu?.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    dropdownMenu?.classList.add('hidden');
  });

  // 1. Like button
  const likeBtn = card.querySelector('[data-action="like"]');
  const likeCounter = card.querySelector('.like-counter');
  likeBtn?.addEventListener('click', async () => {
    if (!currentUser) {
      showToast('Please sign in to like posts', 'info');
      return;
    }
    const currentlyLiked = likeBtn.classList.contains('active-like');
    let count = parseInt(likeCounter.textContent) || 0;

    // Optimistic UI update
    likeBtn.classList.toggle('active-like');
    likeCounter.textContent = currentlyLiked ? Math.max(0, count - 1) : count + 1;
    const icon = likeBtn.querySelector('svg, i');
    if (icon) icon.style.fill = currentlyLiked ? 'none' : 'currentColor';

    try {
      await interactionService.toggleLike(post.id, currentUser.id, post.user_id);
    } catch (err) {
      // Rollback on error
      likeBtn.classList.toggle('active-like');
      likeCounter.textContent = count;
      showToast('Error liking post', 'error');
    }
  });

  // 2. Comment button
  card.querySelector('[data-action="comment"]')?.addEventListener('click', () => {
    openCommentModal(post, currentUser);
  });

  // 3. Bookmark button
  const bookmarkBtn = card.querySelector('[data-action="bookmark"]');
  bookmarkBtn?.addEventListener('click', async () => {
    if (!currentUser) {
      showToast('Please sign in to bookmark posts', 'info');
      return;
    }
    const currentlyBookmarked = bookmarkBtn.classList.contains('active-bookmark');
    bookmarkBtn.classList.toggle('active-bookmark');
    const icon = bookmarkBtn.querySelector('svg, i');
    if (icon) icon.style.fill = currentlyBookmarked ? 'none' : 'currentColor';

    try {
      const res = await interactionService.toggleBookmark(post.id, currentUser.id);
      showToast(res.bookmarked ? 'Post saved to bookmarks' : 'Removed from bookmarks', 'info');
    } catch (err) {
      bookmarkBtn.classList.toggle('active-bookmark');
      showToast('Error saving bookmark', 'error');
    }
  });

  // 4. Share button
  card.querySelector('[data-action="share"]')?.addEventListener('click', () => {
    const postUrl = `${window.location.origin}/feed.html?post=${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      showToast('Link copied to clipboard!', 'success');
    } else {
      showToast(postUrl, 'info');
    }
  });

  // 5. Delete post action
  card.querySelector('.menu-action-delete')?.addEventListener('click', async () => {
    const confirmed = await showConfirmModal({
      title: 'Delete Post',
      message: 'This post will be permanently deleted. Are you sure?',
      confirmText: 'Delete',
      confirmType: 'danger'
    });

    if (confirmed) {
      try {
        await postService.deletePost(post.id);
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        card.style.transition = 'all 0.3s ease';
        setTimeout(() => card.remove(), 300);
        showToast('Post deleted', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to delete post', 'error');
      }
    }
  });

  // 6. Report post action
  card.querySelector('.menu-action-report')?.addEventListener('click', async () => {
    if (!currentUser) {
      showToast('Please sign in to report content', 'info');
      return;
    }
    const confirmed = await showConfirmModal({
      title: 'Report Content',
      message: 'Report this post to Nexora moderators for violating community guidelines?',
      confirmText: 'Submit Report',
      confirmType: 'danger'
    });

    if (confirmed) {
      showToast('Report submitted for review. Thank you for keeping Nexora safe.', 'success');
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  return card;
}
