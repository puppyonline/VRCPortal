export async function renderWorlds(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>🌍 Worlds</h2>
      <p>Search and explore VRChat worlds</p>
    </div>
    <div class="tabs" id="world-tabs">
      <div class="tab active" data-tab="search">Search</div>
      <div class="tab" data-tab="active">Active</div>
      ${api.currentUser ? '<div class="tab" data-tab="recent">Recent</div>' : ''}
      ${api.currentUser ? '<div class="tab" data-tab="favorites">Favorites</div>' : ''}
    </div>
    <div id="world-search-bar" class="search-bar" style="flex-wrap:wrap;">
      <input type="text" id="world-search" class="form-control" placeholder="Search worlds by name..." style="min-width:200px;" />
      <select id="world-sort" class="form-control" style="max-width:160px;">
        <option value="popularity">Popularity</option>
        <option value="heat">Heat</option>
        <option value="trust">Trust</option>
        <option value="shuffle">Shuffle</option>
        <option value="favorites">Favorites</option>
        <option value="publicationDate">Publication Date</option>
        <option value="labsPublicationDate">Labs Date</option>
        <option value="created">Created</option>
        <option value="updated">Updated</option>
      </select>
      <input type="text" id="world-tag" class="form-control" style="max-width:160px;" placeholder="Tag filter..." />
      <select id="world-release" class="form-control" style="max-width:130px;">
        <option value="">Any Status</option>
        <option value="public">Public</option>
        <option value="private">Private</option>
        <option value="hidden">Hidden</option>
      </select>
      <button class="btn btn-primary" id="world-search-btn">🔍 Search</button>
    </div>
    <div id="world-tag-bar" style="display:none;margin-bottom:12px;"></div>
    <div id="world-results">
      <div class="empty-state">
        <div class="emoji">🌍</div>
        <h3>Search for worlds</h3>
        <p>Enter a name or browse active/recent worlds</p>
      </div>
    </div>
  `;

  let currentTab = 'search';

  const renderWorldGrid = (worlds) => {
    if (!worlds || worlds.length === 0) {
      return '<div class="empty-state"><div class="emoji">🔍</div><h3>No worlds found</h3></div>';
    }

    // Collect tags for filter bar
    const tagSet = new Set();
    worlds.forEach(w => (w.tags || []).filter(t => t.startsWith('author_tag_')).forEach(t => tagSet.add(t.replace('author_tag_', ''))));
    const tagBar = document.getElementById('world-tag-bar');
    if (tagSet.size > 0 && tagBar) {
      tagBar.style.display = 'flex';
      tagBar.style.gap = '6px';
      tagBar.style.flexWrap = 'wrap';
      tagBar.innerHTML = `<span style="font-size:0.75rem;color:var(--text-muted);align-self:center;">Tags:</span>` +
        [...tagSet].sort().slice(0, 20).map(t => `<span class="world-tag-chip" data-tag="${t}" style="font-size:0.72rem;padding:3px 8px;border-radius:10px;background:var(--bg-tertiary);color:var(--text-secondary);cursor:pointer;transition:all 0.1s;">${t}</span>`).join('');
      tagBar.querySelectorAll('.world-tag-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          document.getElementById('world-tag').value = chip.dataset.tag;
          loadWorlds('search');
        });
      });
    }

    return `<p style="color:var(--text-muted);margin-bottom:12px;">${worlds.length} worlds</p><div class="grid grid-3">${worlds.map(w => `
      <div class="world-card" data-worldid="${w.id}">
        <img src="${w.thumbnailImageUrl || w.imageUrl || ''}" alt="${w.name}" onerror="this.style.background='var(--bg-tertiary)';this.alt=''" />
        <div class="world-info">
          <h4>${w.name}</h4>
          <p>${w.description || 'No description'}</p>
        </div>
        <div class="world-meta">
          <span>👥 ${w.occupants || 0}</span>
          <span>⭐ ${w.favorites || 0}</span>
          <span>🔥 ${w.heat || 0}</span>
          <span>📅 ${w.created_at ? new Date(w.created_at).toLocaleDateString() : '—'}</span>
        </div>
      </div>
    `).join('')}</div>`;
  };

  const loadWorlds = async (tab) => {
    const results = document.getElementById('world-results');
    results.innerHTML = '<div class="loading"><div class="spinner"></div>Loading worlds...</div>';

    try {
      let worlds;
      switch (tab) {
        case 'search': {
          const query = document.getElementById('world-search').value.trim();
          if (!query) { results.innerHTML = '<div class="empty-state"><div class="emoji">🌍</div><h3>Enter a search term</h3></div>'; return; }
          const sort = document.getElementById('world-sort').value;
          const tag = document.getElementById('world-tag').value.trim();
          const release = document.getElementById('world-release').value;
          const params = { search: query, sort, n: 30 };
          if (tag) params.tag = tag;
          if (release) params.releaseStatus = release;
          worlds = await api.searchWorlds(params);
          break;
        }
        case 'active': worlds = await api.getActiveWorlds({ n: 30 }); break;
        case 'recent': worlds = await api.getRecentWorlds({ n: 30 }); break;
        case 'favorites': worlds = await api.getFavoritedWorlds({ n: 30 }); break;
      }

      if (!worlds || worlds.length === 0) { results.innerHTML = '<div class="empty-state"><div class="emoji">🔍</div><h3>No worlds found</h3></div>'; return; }
      results.innerHTML = renderWorldGrid(worlds);
      results.querySelectorAll('.world-card').forEach(card => {
        card.addEventListener('click', () => window.navigate('world-detail', card.dataset.worldid));
      });
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">Failed to load worlds: ${err.message}</div>`;
    }
  };

  document.querySelectorAll('#world-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#world-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      document.getElementById('world-search-bar').style.display = currentTab === 'search' ? 'flex' : 'none';
      document.getElementById('world-tag-bar').style.display = 'none';
      if (currentTab !== 'search') loadWorlds(currentTab);
    });
  });

  document.getElementById('world-search-btn').addEventListener('click', () => loadWorlds('search'));
  document.getElementById('world-search').addEventListener('keypress', (e) => { if (e.key === 'Enter') loadWorlds('search'); });
}
