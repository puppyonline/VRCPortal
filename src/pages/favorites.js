export async function renderFavorites(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>Favorites</h2>
      <p>View your favorited worlds, avatars, and friends</p>
    </div>
    <div class="tabs" id="fav-tabs">
      <div class="tab active" data-tab="worlds">Worlds</div>
      <div class="tab" data-tab="avatars">Avatars</div>
      <div class="tab" data-tab="friends">Friends</div>
      <div class="tab" data-tab="groups">Groups</div>
      <div class="tab" data-tab="limits">Limits</div>
    </div>
    <div id="fav-results"><div class="loading"><div class="spinner"></div>Loading...</div></div>
  `;

  const loadTab = async (tab) => {
    const results = document.getElementById('fav-results');
    results.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      switch (tab) {
        case 'worlds': await loadWorldFavs(results, api); break;
        case 'avatars': await loadAvatarFavs(results, api); break;
        case 'friends': await loadFriendFavs(results, api); break;
        case 'groups': await loadFavGroups(results, api); break;
        case 'limits': await loadLimits(results, api); break;
      }
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">${err.status === 401 ? 'Login required.' : err.message}</div>`;
    }
  };

  document.querySelectorAll('#fav-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#fav-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadTab(tab.dataset.tab);
    });
  });
  loadTab('worlds');
}

async function loadWorldFavs(container, api) {
  const favs = await api.getFavorites({ n: 100, type: 'world' });
  if (!favs || favs.length === 0) { container.innerHTML = emptyState('No favorited worlds'); return; }

  container.innerHTML = `<p style="color:var(--text-muted);margin-bottom:12px;">${favs.length} favorited worlds — resolving...</p><div class="grid grid-3" id="fav-world-grid"></div>`;
  const grid = container.querySelector('#fav-world-grid');

  // Resolve world details in batches of 5
  for (let i = 0; i < favs.length; i += 5) {
    const batch = favs.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map(f => api.getWorld(f.favoriteId)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        const w = r.value;
        grid.innerHTML += `
          <div class="world-card" data-worldid="${w.id}" onclick="window.navigate('world-detail','${w.id}')">
            <img src="${w.thumbnailImageUrl || w.imageUrl || ''}" alt="" onerror="this.style.background='var(--bg-tertiary)'" />
            <div class="world-info">
              <h4>${w.name}</h4>
              <p>${w.authorName || ''}</p>
            </div>
            <div class="world-meta">
              <span>👥 ${w.occupants || 0}</span>
              <span>⭐ ${(w.favorites || 0).toLocaleString()}</span>
            </div>
          </div>
        `;
      } else {
        grid.innerHTML += `<div class="card" style="padding:12px;font-size:0.8rem;color:var(--text-muted);">${batch[idx].favoriteId}</div>`;
      }
    });
  }
  container.querySelector('p').textContent = `${favs.length} favorited worlds`;
}

async function loadAvatarFavs(container, api) {
  const favs = await api.getFavorites({ n: 100, type: 'avatar' });
  if (!favs || favs.length === 0) { container.innerHTML = emptyState('No favorited avatars'); return; }

  container.innerHTML = `<p style="color:var(--text-muted);margin-bottom:12px;">${favs.length} favorited avatars — resolving...</p><div class="grid grid-3" id="fav-avatar-grid"></div>`;
  const grid = container.querySelector('#fav-avatar-grid');

  for (let i = 0; i < favs.length; i += 5) {
    const batch = favs.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map(f => api.getAvatar(f.favoriteId)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        const a = r.value;
        grid.innerHTML += `
          <div class="world-card">
            <img src="${a.thumbnailImageUrl || a.imageUrl || ''}" alt="" onerror="this.style.background='var(--bg-tertiary)'" />
            <div class="world-info">
              <h4>${a.name}</h4>
              <p>${a.authorName || ''}</p>
            </div>
            <div class="world-meta">
              <span>${a.releaseStatus || ''}</span>
              <span>${a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
            </div>
          </div>
        `;
      } else {
        grid.innerHTML += `<div class="card" style="padding:12px;font-size:0.8rem;color:var(--text-muted);">${batch[idx].favoriteId}</div>`;
      }
    });
  }
  container.querySelector('p').textContent = `${favs.length} favorited avatars`;
}

async function loadFriendFavs(container, api) {
  const favs = await api.getFavorites({ n: 100, type: 'friend' });
  if (!favs || favs.length === 0) { container.innerHTML = emptyState('No favorited friends'); return; }

  container.innerHTML = `<p style="color:var(--text-muted);margin-bottom:12px;">${favs.length} favorited friends — resolving...</p><div class="grid grid-2" id="fav-friend-grid"></div>`;
  const grid = container.querySelector('#fav-friend-grid');

  for (let i = 0; i < favs.length; i += 5) {
    const batch = favs.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map(f => api.getUser(f.favoriteId)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        const u = r.value;
        grid.innerHTML += `
          <div class="user-card" onclick="window.navigate('user-detail','${u.id}')" style="cursor:pointer;">
            <img src="${u.profilePicOverrideThumbnail || u.currentAvatarThumbnailImageUrl || ''}" alt=""
              style="width:44px;height:44px;border-radius:50%;object-fit:cover;background:var(--bg-tertiary);flex-shrink:0;"
              onerror="this.style.display='none'" />
            <div class="user-info" style="min-width:0;">
              <h4 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.displayName}</h4>
              <p style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.statusDescription || u.status || ''}</p>
            </div>
          </div>
        `;
      } else {
        grid.innerHTML += `<div class="card" style="padding:12px;font-size:0.8rem;color:var(--text-muted);">${batch[idx].favoriteId}</div>`;
      }
    });
  }
  container.querySelector('p').textContent = `${favs.length} favorited friends`;
}

async function loadFavGroups(container, api) {
  const groups = await api.getFavoriteGroups({ n: 50 });
  if (!groups || groups.length === 0) { container.innerHTML = emptyState('No favorite groups configured'); return; }
  container.innerHTML = `
    <p style="color:var(--text-muted);margin-bottom:12px;">${groups.length} favorite groups</p>
    <div class="grid grid-2">${groups.map(g => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h4 style="font-size:0.9rem;">${g.displayName || g.name || 'Unnamed'}</h4>
          <span class="badge badge-info">${g.type || '—'}</span>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);">
          <span>Visibility: ${g.visibility || '—'}</span>
          <span style="margin-left:12px;">Tags: ${(g.tags || []).join(', ') || 'none'}</span>
        </div>
      </div>
    `).join('')}</div>
  `;
}

async function loadLimits(container, api) {
  const limits = await api.getFavoriteLimits();
  if (!limits) { container.innerHTML = emptyState('Could not load limits'); return; }

  // Parse limits into a readable format
  const entries = Object.entries(limits);
  container.innerHTML = `
    <p style="color:var(--text-muted);margin-bottom:12px;">Your favorite slot limits</p>
    <div class="grid grid-3">
      ${entries.map(([key, val]) => `
        <div style="padding:12px;background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-sm);text-align:center;">
          <div style="font-size:1.1rem;font-weight:600;color:var(--accent-hover);">${typeof val === 'number' ? val : JSON.stringify(val)}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">${key}</div>
        </div>
      `).join('')}
    </div>
    <details style="margin-top:16px;">
      <summary style="cursor:pointer;color:var(--text-muted);font-size:0.82rem;">Raw JSON</summary>
      <div class="json-viewer" style="margin-top:8px;">${JSON.stringify(limits, null, 2)}</div>
    </details>
  `;
}

function emptyState(msg) {
  return `<div class="empty-state"><div class="emoji">⭐</div><h3>${msg}</h3></div>`;
}
