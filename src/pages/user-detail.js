export async function renderUserDetail(container, api, userId) {
  container.innerHTML = `
    <div style="margin-bottom:16px;">
      <button class="btn btn-secondary btn-sm" id="back-from-user">← Back</button>
    </div>
    <div id="user-detail-page"><div class="loading"><div class="spinner"></div>Loading user...</div></div>
  `;

  document.getElementById('back-from-user').addEventListener('click', () => window.history.back());

  try {
    const user = await api.getUser(userId);

    // Try to get mutuals
    let mutuals = null;
    try { mutuals = await api.getUserMutuals(userId); } catch {}

    const statusColors = {
      active: 'var(--success)',
      'join me': 'var(--accent)',
      'ask me': 'var(--warning)',
      busy: 'var(--danger)',
      offline: 'var(--text-muted)',
    };

    const trustTags = ['system_trust_veteran', 'system_trust_trusted', 'system_trust_known', 'system_trust_basic'];
    const trustLevel = trustTags.find(t => (user.tags || []).includes(t))?.replace('system_trust_', '') || 'visitor';
    const trustColors = { veteran: '#8b5cf6', trusted: '#f59e0b', known: '#10b981', basic: '#3b82f6', visitor: '#64748b' };

    const imgSrc = user.profilePicOverrideThumbnail || user.currentAvatarThumbnailImageUrl || '';

    document.getElementById('user-detail-page').innerHTML = `
      <!-- Hero -->
      <div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;">
        <div style="position:relative;flex-shrink:0;">
          <img src="${imgSrc}" alt="Avatar"
            style="width:120px;height:120px;border-radius:var(--radius-lg);object-fit:cover;background:var(--bg-tertiary);border:2px solid ${trustColors[trustLevel]};"
            onerror="this.style.display='none'" />
          <div style="position:absolute;bottom:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:${statusColors[user.status] || 'var(--text-muted)'};border:3px solid var(--bg-base);"></div>
        </div>
        <div style="flex:1;min-width:200px;">
          <h2 style="font-size:1.4rem;font-weight:700;margin-bottom:4px;">${user.displayName}</h2>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
            <span class="badge" style="background:${trustColors[trustLevel]}22;color:${trustColors[trustLevel]};">${trustLevel}</span>
            <span style="font-size:0.85rem;color:var(--text-secondary);">${user.status || 'offline'}${user.statusDescription ? ' — ' + user.statusDescription : ''}</span>
          </div>
          <p style="font-size:0.82rem;color:var(--text-muted);">ID: ${user.id}</p>
          ${user.last_platform ? `<p style="font-size:0.82rem;color:var(--text-muted);">Platform: ${user.last_platform}</p>` : ''}
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-${mutuals ? '4' : '3'}" style="margin-bottom:20px;">
        <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${user.last_platform || '—'}</div><div class="stat-label">Platform</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${user.date_joined || '—'}</div><div class="stat-label">Joined</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${user.developerType || 'none'}</div><div class="stat-label">Developer</div></div>
        ${mutuals ? `<div class="stat-card"><div class="stat-value" style="font-size:1rem;">${mutuals.friends || 0} / ${mutuals.groups || 0}</div><div class="stat-label">Mutual Friends / Groups</div></div>` : ''}
      </div>

      <!-- Bio -->
      ${user.bio ? `
        <div class="card" style="margin-bottom:16px;">
          <h3 style="margin-bottom:8px;">Bio</h3>
          <p style="font-size:0.9rem;color:var(--text-secondary);white-space:pre-wrap;line-height:1.6;">${user.bio}</p>
        </div>
      ` : ''}

      <!-- Bio Links -->
      ${user.bioLinks?.length ? `
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
          ${user.bioLinks.map(l => { try { return `<a href="${l}" target="_blank" class="btn btn-sm btn-secondary">${new URL(l).hostname}</a>`; } catch { return ''; } }).join('')}
        </div>
      ` : ''}

      <!-- Tags -->
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:8px;">Tags</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${(user.tags || []).map(tag => {
            const isTrust = tag.startsWith('system_trust_');
            const isSystem = tag.startsWith('system_');
            const isLang = tag.startsWith('language_');
            const cls = isTrust ? 'badge-success' : isLang ? 'badge-info' : isSystem ? 'badge-warning' : 'badge-info';
            return `<span class="badge ${cls}">${tag}</span>`;
          }).join('') || '<span style="color:var(--text-muted)">No tags</span>'}
        </div>
      </div>

      <!-- Raw JSON -->
      <details>
        <summary style="cursor:pointer;color:var(--text-muted);font-size:0.85rem;padding:8px 0;">View Raw JSON</summary>
        <div class="json-viewer" style="margin-top:8px;">${JSON.stringify(user, null, 2)}</div>
      </details>
    `;
  } catch (err) {
    document.getElementById('user-detail-page').innerHTML = `<div class="alert alert-error">Failed to load user: ${err.message}</div>`;
  }
}
