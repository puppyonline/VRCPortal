export async function renderUsers(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>👥 Users</h2>
      <p>Search and view VRChat user profiles</p>
    </div>
    <div class="search-bar" style="flex-wrap:wrap;">
      <input type="text" id="user-search" class="form-control" placeholder="Search users by display name..." style="min-width:200px;" />
      <select id="user-dev-type" class="form-control" style="max-width:140px;">
        <option value="">Any Type</option>
        <option value="none">None</option>
        <option value="trusted">Trusted</option>
        <option value="internal">Internal</option>
      </select>
      <input type="number" id="user-count-input" class="form-control" style="max-width:80px;" placeholder="20" min="1" max="100" value="20" />
      <button class="btn btn-primary" id="user-search-btn">🔍 Search</button>
    </div>
    <div class="card">
      <div class="card-header">
        <h3>Search Results</h3>
        <span id="user-count" style="color:var(--text-muted);font-size:0.85rem;"></span>
      </div>
      <div id="user-results">
        <div class="empty-state">
          <div class="emoji">👥</div>
          <h3>Search for users</h3>
          <p>Enter a display name to find VRChat users</p>
        </div>
      </div>
    </div>
    <div class="card" id="user-detail-card" style="display:none;margin-top:16px;">
      <div class="card-header">
        <h3>User Details</h3>
        <button class="btn btn-sm btn-secondary" id="close-detail">✕ Close</button>
      </div>
      <div id="user-detail"></div>
    </div>
  `;

  const searchUsers = async () => {
    const query = document.getElementById('user-search').value.trim();
    if (!query) return;
    const n = parseInt(document.getElementById('user-count-input').value) || 20;
    const devType = document.getElementById('user-dev-type').value;

    const results = document.getElementById('user-results');
    results.innerHTML = '<div class="loading"><div class="spinner"></div>Searching...</div>';

    try {
      const users = await api.searchUsers(query, n);
      // Client-side filter by developer type if set
      let filtered = users;
      if (devType) filtered = users.filter(u => u.developerType === devType);

      document.getElementById('user-count').textContent = `${filtered.length} results${devType ? ` (filtered from ${users.length})` : ''}`;

      if (filtered.length === 0) {
        results.innerHTML = '<div class="empty-state"><div class="emoji">🔍</div><h3>No users found</h3></div>';
        return;
      }

      results.innerHTML = `<div class="grid grid-2">${filtered.map(u => `
        <div class="user-card" data-userid="${u.id}">
          <img class="user-avatar" src="${u.currentAvatarThumbnailImageUrl || u.thumbnailUrl || ''}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 48%22><rect fill=%22%23243447%22 width=%2248%22 height=%2248%22/><text x=%2224%22 y=%2230%22 text-anchor=%22middle%22 fill=%22%238899a6%22 font-size=%2220%22>👤</text></svg>'" />
          <div class="user-info">
            <h4>${u.displayName}</h4>
            <p>${u.statusDescription || u.status || 'No status'}</p>
            <p style="font-size:0.75rem;color:var(--text-muted);">${u.id}</p>
          </div>
        </div>
      `).join('')}</div>`;

      // Click handlers
      results.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', () => loadUserDetail(card.dataset.userid));
      });
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">Search failed: ${err.message}</div>`;
    }
  };

  const loadUserDetail = async (userId) => {
    const detailCard = document.getElementById('user-detail-card');
    const detail = document.getElementById('user-detail');
    detailCard.style.display = 'block';
    detail.innerHTML = '<div class="loading"><div class="spinner"></div>Loading user...</div>';

    try {
      const user = await api.getUser(userId);

      // Try to get mutuals if logged in
      let mutuals = null;
      try { mutuals = await api.getUserMutuals(userId); } catch {}

      detail.innerHTML = `
        <div class="detail-header">
          <img src="${user.currentAvatarThumbnailImageUrl || user.profilePicOverrideThumbnail || ''}" alt="Avatar" onerror="this.style.display='none'" />
          <div class="detail-info">
            <h2>${user.displayName}</h2>
            <p>${user.statusDescription || ''}</p>
            <p style="font-size:0.85rem;color:var(--text-muted);">Status: ${user.status || 'unknown'} | Platform: ${user.last_platform || '—'}</p>
            <p style="font-size:0.85rem;color:var(--text-muted);">ID: ${user.id}</p>
          </div>
        </div>
        ${user.bio ? `<div class="card" style="margin-bottom:12px;"><h4 style="margin-bottom:8px;">Bio</h4><p style="white-space:pre-wrap;font-size:0.9rem;">${user.bio}</p></div>` : ''}
        <div class="grid grid-${mutuals ? '4' : '3'}" style="margin-bottom:16px;">
          <div class="stat-card"><div class="stat-value" style="font-size:1.2rem;">${user.last_platform || '—'}</div><div class="stat-label">Platform</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:1.2rem;">${user.date_joined || '—'}</div><div class="stat-label">Joined</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:1.2rem;">${user.developerType || 'none'}</div><div class="stat-label">Developer Type</div></div>
          ${mutuals ? `<div class="stat-card"><div class="stat-value" style="font-size:1.2rem;">${mutuals.friends || 0} / ${mutuals.groups || 0}</div><div class="stat-label">Mutual Friends / Groups</div></div>` : ''}
        </div>
        ${user.bioLinks?.length ? `<h4 style="margin-bottom:8px;">Bio Links</h4><div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">${user.bioLinks.map(l => `<a href="${l}" target="_blank" class="btn btn-sm btn-secondary">${new URL(l).hostname}</a>`).join('')}</div>` : ''}
        <h4 style="margin-bottom:8px;">Tags</h4>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
          ${(user.tags || []).map(tag => {
            const isTrust = tag.startsWith('system_trust_');
            const isSystem = tag.startsWith('system_');
            const cls = isTrust ? 'badge-success' : isSystem ? 'badge-warning' : 'badge-info';
            return `<span class="badge ${cls}">${tag}</span>`;
          }).join('') || '<span style="color:var(--text-muted)">No tags</span>'}
        </div>
        <details><summary style="cursor:pointer;color:var(--text-muted);font-size:0.85rem;">View Raw JSON</summary>
          <div class="json-viewer" style="margin-top:8px;">${JSON.stringify(user, null, 2)}</div>
        </details>
      `;
    } catch (err) {
      detail.innerHTML = `<div class="alert alert-error">Failed to load user: ${err.message}</div>`;
    }
  };

  document.getElementById('user-search-btn').addEventListener('click', searchUsers);
  document.getElementById('user-search').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchUsers();
  });
  document.getElementById('close-detail').addEventListener('click', () => {
    document.getElementById('user-detail-card').style.display = 'none';
  });
}
