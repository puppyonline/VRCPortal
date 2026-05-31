export async function renderAvatars(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>🎭 Avatars</h2>
      <p>Search and browse VRChat avatars</p>
    </div>
    <div class="tabs" id="avatar-tabs">
      <div class="tab active" data-tab="search">Search</div>
      <div class="tab" data-tab="favorites">My Favorites</div>
    </div>
    <div class="search-bar" id="avatar-search-bar" style="flex-wrap:wrap;">
      <input type="text" id="avatar-search" class="form-control" placeholder="Search avatars..." style="min-width:180px;" />
      <select id="avatar-sort" class="form-control" style="max-width:150px;">
        <option value="popularity">Popularity</option>
        <option value="heat">Heat</option>
        <option value="trust">Trust</option>
        <option value="shuffle">Shuffle</option>
        <option value="favorites">Favorites</option>
        <option value="created">Created</option>
        <option value="updated">Updated</option>
      </select>
      <input type="text" id="avatar-tag" class="form-control" style="max-width:140px;" placeholder="Tag filter..." />
      <select id="avatar-release" class="form-control" style="max-width:120px;">
        <option value="public">Public</option>
        <option value="private">Private</option>
        <option value="hidden">Hidden</option>
      </select>
      <button class="btn btn-primary" id="avatar-search-btn">🔍 Search</button>
    </div>
    <div id="avatar-results">
      <div class="empty-state">
        <div class="emoji">🎭</div>
        <h3>Search for avatars</h3>
        <p>Enter a name to find public avatars</p>
      </div>
    </div>
    <div class="card" id="avatar-detail-card" style="display:none;margin-top:16px;">
      <div class="card-header">
        <h3>Avatar Details</h3>
        <button class="btn btn-sm btn-secondary" id="close-avatar-detail">✕ Close</button>
      </div>
      <div id="avatar-detail"></div>
    </div>
  `;

  const loadAvatars = async (tab) => {
    const results = document.getElementById('avatar-results');
    results.innerHTML = '<div class="loading"><div class="spinner"></div>Loading avatars...</div>';

    try {
      let avatars;
      if (tab === 'search') {
        const query = document.getElementById('avatar-search').value.trim();
        if (!query) {
          results.innerHTML = '<div class="empty-state"><div class="emoji">🎭</div><h3>Enter a search term</h3></div>';
          return;
        }
        const sort = document.getElementById('avatar-sort').value;
        const tag = document.getElementById('avatar-tag').value.trim();
        const release = document.getElementById('avatar-release').value;
        const params = { search: query, sort, n: 24 };
        if (tag) params.tag = tag;
        if (release) params.releaseStatus = release;
        avatars = await api.searchAvatars(params);
      } else {
        avatars = await api.getFavoritedAvatars({ n: 24 });
      }

      if (!avatars || avatars.length === 0) {
        results.innerHTML = '<div class="empty-state"><div class="emoji">🔍</div><h3>No avatars found</h3></div>';
        return;
      }

      results.innerHTML = `<div class="grid grid-3">${avatars.map(a => `
        <div class="world-card" data-avatarid="${a.id}">
          <img src="${a.thumbnailImageUrl || a.imageUrl || ''}" alt="${a.name}" onerror="this.style.background='var(--bg-tertiary)'" />
          <div class="world-info">
            <h4>${a.name}</h4>
            <p>${a.description || 'No description'}</p>
          </div>
          <div class="world-meta">
            <span>👤 ${a.authorName || 'Unknown'}</span>
            <span>📅 ${a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      `).join('')}</div>`;

      results.querySelectorAll('.world-card').forEach(card => {
        card.addEventListener('click', () => loadAvatarDetail(card.dataset.avatarid));
      });
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">Failed to load avatars: ${err.message}</div>`;
    }
  };

  const loadAvatarDetail = async (avatarId) => {
    const detailCard = document.getElementById('avatar-detail-card');
    const detail = document.getElementById('avatar-detail');
    detailCard.style.display = 'block';
    detail.innerHTML = '<div class="loading"><div class="spinner"></div>Loading avatar...</div>';

    try {
      const avatar = await api.getAvatar(avatarId);
      detail.innerHTML = `
        <div class="detail-header">
          <img src="${avatar.thumbnailImageUrl || avatar.imageUrl || ''}" alt="${avatar.name}" style="width:160px;height:160px;" onerror="this.style.display='none'" />
          <div class="detail-info">
            <h2>${avatar.name}</h2>
            <p>by ${avatar.authorName || 'Unknown'}</p>
            <p style="font-size:0.85rem;color:var(--text-muted);">ID: ${avatar.id}</p>
            <p style="font-size:0.85rem;color:var(--text-muted);">Release: ${avatar.releaseStatus || '—'}</p>
          </div>
        </div>
        ${avatar.description ? `<p style="margin-bottom:16px;">${avatar.description}</p>` : ''}
        <div class="grid grid-3" style="margin-bottom:16px;">
          <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${avatar.releaseStatus || '—'}</div><div class="stat-label">Status</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${avatar.version || '—'}</div><div class="stat-label">Version</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${avatar.created_at ? new Date(avatar.created_at).toLocaleDateString() : '—'}</div><div class="stat-label">Created</div></div>
        </div>
        <h4 style="margin-bottom:8px;">Tags</h4>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
          ${(avatar.tags || []).map(tag => `<span class="badge badge-info">${tag}</span>`).join('') || '<span style="color:var(--text-muted)">No tags</span>'}
        </div>
        <h4 style="margin-bottom:8px;">Raw JSON</h4>
        <div class="json-viewer">${JSON.stringify(avatar, null, 2)}</div>
      `;
    } catch (err) {
      detail.innerHTML = `<div class="alert alert-error">Failed to load avatar: ${err.message}</div>`;
    }
  };

  // Tab switching
  document.querySelectorAll('#avatar-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#avatar-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById('avatar-search-bar').style.display = tabName === 'search' ? 'flex' : 'none';
      if (tabName !== 'search') loadAvatars(tabName);
    });
  });

  document.getElementById('avatar-search-btn').addEventListener('click', () => loadAvatars('search'));
  document.getElementById('avatar-search').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadAvatars('search');
  });
  document.getElementById('close-avatar-detail').addEventListener('click', () => {
    document.getElementById('avatar-detail-card').style.display = 'none';
  });
}
