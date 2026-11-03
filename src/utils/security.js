/**
 * NEXORA Security Utilities
 * Input sanitization, XSS mitigation, Safe HTML rendering
 */

/**
 * Escapes HTML characters to prevent cross-site scripting (XSS).
 */
export function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes URLs to ensure they only use http, https, or mailto protocols.
 */
export function sanitizeURL(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return parsed.href;
    }
    return '';
  } catch (e) {
    return '';
  }
}

/**
 * Parses user text and automatically converts #hashtags and @mentions into safe HTML links.
 */
export function parseContentTags(text) {
  if (!text) return '';
  const escaped = escapeHTML(text);
  
  // Format @mentions
  const withMentions = escaped.replace(/@([a-zA-Z0-9_]{3,24})/g, (match, username) => {
    return `<a href="profile.html?u=${encodeURIComponent(username)}" class="mention-link">@${username}</a>`;
  });
  
  // Format #hashtags
  const withTags = withMentions.replace(/#([a-zA-Z0-9_]{2,30})/g, (match, tag) => {
    return `<a href="explore.html?q=%23${encodeURIComponent(tag)}" class="hashtag-link">#${tag}</a>`;
  });

  return withTags;
}
