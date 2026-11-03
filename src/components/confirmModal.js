/**
 * NEXORA Confirmation Modal
 */

export function showConfirmModal({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', confirmType = 'danger' }) {
  return new Promise((resolve) => {
    let existing = document.getElementById('nexora-confirm-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'nexora-confirm-modal';
    modal.className = 'nexora-modal-overlay active';
    modal.innerHTML = `
      <div class="nexora-modal-box" style="max-width: 400px;">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-badge-icon" style="color: ${confirmType === 'danger' ? 'var(--accent-rose)' : 'var(--primary-400)'}; background: ${confirmType === 'danger' ? 'rgba(244,63,94,0.15)' : 'rgba(99,102,241,0.15)'}">
              <i data-lucide="${confirmType === 'danger' ? 'alert-triangle' : 'help-circle'}"></i>
            </div>
            <h3>${title}</h3>
          </div>
        </div>
        <div class="modal-body">
          <p class="modal-desc" style="color: var(--text-primary);">${message}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="confirm-modal-cancel">Cancel</button>
          <button type="button" class="btn btn-${confirmType}" id="confirm-modal-ok">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    const cleanup = (result) => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 200);
      resolve(result);
    };

    document.getElementById('confirm-modal-cancel').onclick = () => cleanup(false);
    document.getElementById('confirm-modal-ok').onclick = () => cleanup(true);
  });
}
