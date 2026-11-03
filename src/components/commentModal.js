/**
 * NEXORA Comment & Replies Modal Component
 */
import { formatRelativeTime } from '../utils/formatters.js';
import { parseContentTags, escapeHTML } from '../utils/security.js';
import { interactionService } from '../services/interactionService.js';
import { showToast } from './toast.js';

export async function openCommentModal(post, currentUser) {
  let modal = document.getElementById('nexora-comment-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'nexora-comment-modal';
  modal.className = 'nexora-modal-overlay active';

  const author = post.author || { username: 'unknown', display_name: 'Member' };

  modal.innerHTML = `
    <div class="nexora-modal-box" style="max-width: 580px;">
      <div class="modal-header">
        <div class="modal-title-wrap">
          <div class="modal-badge-icon"><i data-lucide="message-square"></i></div>
          <h3>Discussion</h3>
        </div>
        <button type="button" class="btn-icon" id="comment-modal-close" style="color:var(--text-muted);">&times;</button>
      </div>

      <div class="modal-body" style="padding-top: var(--space-4); max-height: 55vh; overflow-y: auto;">
        <!-- Original post summary -->
        <div style="display: flex; gap: var(--space-3); padding-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle);">
          <div class="avatar avatar-sm">
            <img src="${author.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + author.username}" alt="${escapeHTML(author.display_name)}" />
          </div>
          <div>
            <div style="font-weight: 600; font-size: var(--font-size-sm); color: var(--text-primary);">
              ${escapeHTML(author.display_name)} <span style="font-size: var(--font-size-xs); color: var(--text-muted);">@${escapeHTML(author.username)}</span>
            </div>
            <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: 4px;">
              ${parseContentTags(post.content || '')}
            </div>
          </div>
        </div>

        <!-- Comments list -->
        <div id="comments-container" style="display: flex; flex-direction: column; gap: var(--space-3); padding-top: var(--space-4);">
          <div style="text-align: center; color: var(--text-muted); font-size: var(--font-size-sm); padding: var(--space-4) 0;">
            Loading comments...
          </div>
        </div>
      </div>

      <!-- Add Comment Form -->
      <div class="modal-actions" style="flex-direction: column; align-items: stretch; gap: var(--space-2); background: var(--bg-surface);">
        <div id="replying-to-banner" class="hidden" style="font-size: var(--font-size-xs); color: var(--primary-400); display: flex; justify-content: space-between; align-items: center;">
          <span>Replying to <strong id="replying-to-username">@user</strong></span>
          <button type="button" id="cancel-reply-btn" style="color: var(--accent-rose); font-size: 11px;">Cancel</button>
        </div>
        <div style="display: flex; gap: var(--space-2);">
          <input type="text" id="comment-input" placeholder="${currentUser ? 'Add your perspective...' : 'Sign in to comment'}" ${!currentUser ? 'disabled' : ''} style="flex: 1; border-radius: var(--radius-full);" />
          <button type="button" class="btn btn-primary" id="btn-submit-comment" ${!currentUser ? 'disabled' : ''} style="padding: 6px 16px;">
            <i data-lucide="send" style="width: 14px;"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  const closeBtn = document.getElementById('comment-modal-close');
  closeBtn.onclick = () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 200);
  };

  const commentsContainer = document.getElementById('comments-container');
  const commentInput = document.getElementById('comment-input');
  const submitCommentBtn = document.getElementById('btn-submit-comment');
  const replyingBanner = document.getElementById('replying-to-banner');
  const replyingUsername = document.getElementById('replying-to-username');
  const cancelReplyBtn = document.getElementById('cancel-reply-btn');

  let activeParentId = null;

  cancelReplyBtn.onclick = () => {
    activeParentId = null;
    replyingBanner.classList.add('hidden');
  };

  // Load comments
  const loadComments = async () => {
    try {
      const comments = await interactionService.getComments(post.id);
      if (comments.length === 0) {
        commentsContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: var(--font-size-sm); padding: var(--space-4) 0;">
            No comments yet. Start the conversation!
          </div>
        `;
        return;
      }

      commentsContainer.innerHTML = comments.map(c => {
        const cAuthor = c.author || { username: 'unknown', display_name: 'Member' };
        const isOwn = currentUser && currentUser.id === c.user_id;

        return `
          <div class="comment-item ${c.parent_id ? 'is-reply' : ''}" style="display: flex; gap: var(--space-3); ${c.parent_id ? 'margin-left: 28px;' : ''}" id="comment-${c.id}">
            <a href="profile.html?u=${encodeURIComponent(cAuthor.username)}" class="avatar avatar-xs" style="margin-top: 2px;">
              <img src="${cAuthor.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + cAuthor.username}" alt="${escapeHTML(cAuthor.display_name)}" />
            </a>
            <div style="flex: 1; background: var(--bg-surface-elevated); padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="font-weight: 600; font-size: var(--font-size-xs); color: var(--text-primary);">
                  ${escapeHTML(cAuthor.display_name)} <span style="color: var(--text-muted);">@${escapeHTML(cAuthor.username)}</span>
                  <span style="color: var(--text-muted); font-weight: normal; margin-left: 4px;">· ${formatRelativeTime(c.created_at)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${currentUser ? `
                    <button type="button" class="btn-reply-comment" data-id="${c.id}" data-user="${escapeHTML(cAuthor.username)}" style="font-size: 11px; color: var(--primary-400);">
                      Reply
                    </button>
                  ` : ''}
                  ${isOwn ? `
                    <button type="button" class="btn-delete-comment" data-id="${c.id}" style="color: var(--accent-rose); font-size: 11px;">
                      &times;
                    </button>
                  ` : ''}
                </div>
              </div>
              <div style="font-size: var(--font-size-sm); color: var(--text-primary); margin-top: 4px;">
                ${parseContentTags(c.content)}
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Reply listeners
      commentsContainer.querySelectorAll('.btn-reply-comment').forEach(btn => {
        btn.onclick = () => {
          activeParentId = btn.getAttribute('data-id');
          replyingUsername.textContent = '@' + btn.getAttribute('data-user');
          replyingBanner.classList.remove('hidden');
          commentInput.focus();
        };
      });

      // Delete listeners
      commentsContainer.querySelectorAll('.btn-delete-comment').forEach(btn => {
        btn.onclick = async () => {
          const commentId = btn.getAttribute('data-id');
          await interactionService.deleteComment(commentId);
          loadComments();
          showToast('Comment deleted', 'info');
        };
      });

    } catch (err) {
      commentsContainer.innerHTML = `<div style="color: var(--accent-rose); font-size: 12px;">Error loading comments</div>`;
    }
  };

  await loadComments();

  // Submit comment
  const handleCommentSubmit = async () => {
    const text = commentInput.value.trim();
    if (!text || !currentUser) return;

    try {
      submitCommentBtn.disabled = true;
      await interactionService.addComment({
        postId: post.id,
        userId: currentUser.id,
        content: text,
        parentId: activeParentId,
        postAuthorId: post.user_id
      });

      commentInput.value = '';
      activeParentId = null;
      replyingBanner.classList.add('hidden');
      await loadComments();
      showToast('Comment added', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to post comment', 'error');
    } finally {
      submitCommentBtn.disabled = false;
    }
  };

  submitCommentBtn.onclick = handleCommentSubmit;
  commentInput.onkeydown = (e) => {
    if (e.key === 'Enter') handleCommentSubmit();
  };
}
