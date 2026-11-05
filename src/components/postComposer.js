/**
 * NEXORA Post Composer Component
 * Handles rich text input, media upload preview, validation, and submission
 */
import { validateMediaUpload } from '../utils/validators.js';
import { storageService } from '../services/storageService.js';
import { postService } from '../services/postService.js';
import { showToast } from './toast.js';

export function setupComposer({ containerId, currentUser, onPostCreated = null, communityId = null }) {
  const container = document.getElementById(containerId);
  if (!container || !currentUser) return;

  const meta = currentUser.user_metadata || {};
  const avatarUrl = currentUser._profileAvatarUrl || meta.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${meta.username || 'user'}`;
  const displayNameText = currentUser._profileDisplayName || meta.display_name || 'User';

  container.className = 'feed-composer';
  container.innerHTML = `
    <div class="composer-avatar">
      <div class="avatar avatar-md">
        <img src="${avatarUrl}" alt="${displayNameText}" />
      </div>
    </div>

    <div class="composer-main">
      <textarea 
        class="composer-textarea" 
        id="${containerId}-textarea" 
        placeholder="What is echoing in your mind today?" 
        rows="2"
      ></textarea>

      <!-- Media Previews -->
      <div class="media-preview-container hidden" id="${containerId}-preview"></div>

      <!-- Composer Actions -->
      <div class="composer-actions">
        <div class="composer-tools">
          <input type="file" id="${containerId}-file-input" accept="image/*,video/*" class="hidden" />
          <button type="button" class="composer-tool-btn" id="${containerId}-btn-image" title="Add Media">
            <i data-lucide="image"></i>
          </button>
          <button type="button" class="composer-tool-btn" id="${containerId}-btn-emoji" title="Add Hashtag">
            <i data-lucide="hash"></i>
          </button>
        </div>

        <div class="flex items-center gap-3">
          <span id="${containerId}-char-count" style="font-size: var(--font-size-xs); color: var(--text-muted);">500</span>
          <button type="button" class="btn btn-primary" id="${containerId}-btn-submit" style="padding: 6px 18px;">
            Post
          </button>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const textarea = document.getElementById(`${containerId}-textarea`);
  const fileInput = document.getElementById(`${containerId}-file-input`);
  const previewContainer = document.getElementById(`${containerId}-preview`);
  const submitBtn = document.getElementById(`${containerId}-btn-submit`);
  const charCounter = document.getElementById(`${containerId}-char-count`);
  const btnImage = document.getElementById(`${containerId}-btn-image`);
  const btnHash = document.getElementById(`${containerId}-btn-emoji`);

  let selectedFile = null;

  // Auto-resize textarea & character count
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    const remaining = 500 - textarea.value.length;
    charCounter.textContent = remaining;
    charCounter.style.color = remaining < 0 ? 'var(--accent-rose)' : 'var(--text-muted)';
  });

  // Hashtag button appends #
  btnHash?.addEventListener('click', () => {
    textarea.value += ' #';
    textarea.focus();
  });

  // Image upload trigger
  btnImage?.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const error = validateMediaUpload(file);
    if (error) {
      showToast(error, 'error');
      fileInput.value = '';
      return;
    }

    selectedFile = file;
    const objectUrl = URL.createObjectURL(file);

    previewContainer.classList.remove('hidden');
    previewContainer.innerHTML = `
      <div class="media-preview-item">
        ${file.type.startsWith('video') ? `
          <video src="${objectUrl}" muted autoplay loop></video>
        ` : `
          <img src="${objectUrl}" alt="Upload preview" />
        `}
        <button type="button" class="btn-remove-media" id="${containerId}-btn-remove-media">&times;</button>
      </div>
    `;

    document.getElementById(`${containerId}-btn-remove-media`).onclick = () => {
      selectedFile = null;
      fileInput.value = '';
      previewContainer.innerHTML = '';
      previewContainer.classList.add('hidden');
    };
  });

  // Submission handler
  submitBtn.addEventListener('click', async () => {
    const content = textarea.value.trim();
    if (!content && !selectedFile) {
      showToast('Please enter text or upload media to publish a post.', 'info');
      return;
    }

    if (content.length > 500) {
      showToast('Post exceeds maximum character limit (500).', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Publishing...';

      let mediaUrls = [];
      let mediaType = 'none';

      if (selectedFile) {
        showToast('Uploading media...', 'info');
        const uploadedUrl = await storageService.uploadFile({
          bucket: 'posts',
          userId: currentUser.id,
          file: selectedFile
        });
        mediaUrls.push(uploadedUrl);
        mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';
      }

      const newPost = await postService.createPost({
        userId: currentUser.id,
        content,
        mediaUrls,
        mediaType,
        communityId
      });

      // Reset form
      textarea.value = '';
      textarea.style.height = 'auto';
      selectedFile = null;
      fileInput.value = '';
      previewContainer.innerHTML = '';
      previewContainer.classList.add('hidden');
      charCounter.textContent = '500';

      showToast('Post published to NEXORA!', 'success');

      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (err) {
      showToast(err.message || 'Failed to create post', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post';
    }
  });
}
