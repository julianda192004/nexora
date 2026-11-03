/**
 * Supabase Client Initialization & Helper
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Retrieve configuration
export function getCredentials() {
  const url = window.NEXORA_CONFIG?.SUPABASE_URL || localStorage.getItem('NEXORA_SUPABASE_URL') || '';
  const key = window.NEXORA_CONFIG?.SUPABASE_ANON_KEY || localStorage.getItem('NEXORA_SUPABASE_ANON_KEY') || '';
  return { url: url.trim(), key: key.trim() };
}

export function saveCredentials(url, key) {
  if (url && key) {
    localStorage.setItem('NEXORA_SUPABASE_URL', url.trim());
    localStorage.setItem('NEXORA_SUPABASE_ANON_KEY', key.trim());
    if (window.NEXORA_CONFIG) {
      window.NEXORA_CONFIG.SUPABASE_URL = url.trim();
      window.NEXORA_CONFIG.SUPABASE_ANON_KEY = key.trim();
    }
    return true;
  }
  return false;
}

const { url, key } = getCredentials();
export const isConfigured = Boolean(url && key && url.startsWith('http') && key.length > 20);

export const supabase = isConfigured 
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Checks if Supabase client is initialized.
 * If not, triggers the configuration guide modal.
 */
export function ensureClient() {
  if (!supabase) {
    showConfigModal();
    return false;
  }
  return true;
}

export function showConfigModal() {
  const existing = document.getElementById('nexora-config-modal');
  if (existing) {
    existing.classList.add('active');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'nexora-config-modal';
  modal.className = 'nexora-modal-overlay active';
  modal.innerHTML = `
    <div class="nexora-modal-box">
      <div class="modal-header">
        <div class="modal-title-wrap">
          <div class="modal-badge-icon"><i data-lucide="database"></i></div>
          <h3>Connect to Supabase</h3>
        </div>
      </div>
      <div class="modal-body">
        <p class="modal-desc">
          To activate full real-time database, auth, and cloud storage features on <strong>NEXORA</strong>, enter your Supabase credentials below.
        </p>
        <div class="input-group">
          <label>Supabase Project URL</label>
          <input type="text" id="cfg-supabase-url" placeholder="https://your-project.supabase.co" value="${getCredentials().url || ''}" />
          <span class="input-help">Found in Supabase Dashboard &gt; Project Settings &gt; API</span>
        </div>
        <div class="input-group">
          <label>Supabase Anon Public API Key</label>
          <input type="password" id="cfg-supabase-key" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." value="${getCredentials().key || ''}" />
          <span class="input-help">Found in Supabase Dashboard &gt; Project Settings &gt; API</span>
        </div>
        <div class="info-callout">
          <i data-lucide="shield-check"></i>
          <span>Database schema migrations are prepared in <code>supabase/migrations/</code>. Execute them in your Supabase SQL Editor.</span>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('nexora-config-modal').classList.remove('active')">Cancel</button>
        <button type="button" class="btn btn-primary" id="btn-save-config">Save & Connect</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  document.getElementById('btn-save-config').addEventListener('click', () => {
    const newUrl = document.getElementById('cfg-supabase-url').value;
    const newKey = document.getElementById('cfg-supabase-key').value;
    if (!newUrl || !newKey) {
      alert('Please provide both Project URL and Anon Key.');
      return;
    }
    saveCredentials(newUrl, newKey);
    window.location.reload();
  });
}
