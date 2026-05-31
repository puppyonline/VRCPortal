export async function renderGroups(container, api) {
  const isAuth = !!api.currentUser;

  container.innerHTML = `
    <div class="page-header">
      <h2>Groups</h2>
      <p>Browse your groups and search for new ones</p>
    </div>
    <div class="tabs" id="groups-tabs">
      ${isAuth ? '<div class="tab active" data-tab="my">My Groups</div>' : ''}
      <div class="tab ${isAuth ? '' : 'active'}" data-tab="search">Search</div>
    </div>
    <div id="groups-content"></div>
  `;

  const showTab = (tab) => {
    const content = document.getElementById('groups-content');
    if (tab === 'my') {
      loadMyGroups(content, api);
    } else {
      showSearch(content, api);
    }
  };

  document.querySelectorAll('#groups-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#groups-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      showTab(tab.dataset.tab);
    });
  });

  showTab(isAuth ? 'my' : 'search');
}

async function loadMyGroups(content, api) {
  content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading your groups...</div>';
  try {
    const groups = await api.getUserGroups(api.currentUser.id);
    if (!groups || groups.length === 0) {
      content.innerHTML = '<div class="empty-state"><div class="emoji">👥</div><h3>No groups</h3></div>';
      return;
    }

    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap;">
        <p style="color:var(--text-muted);">${groups.length} groups</p>
        <input type="text" id="my-groups-filter" class="form-control" placeholder="Filter groups..." style="max-width:240px;" />
      </div>
      <div id="my-groups-list" style="display:flex;flex-direction:column;gap:12px;"></div>
    `;

    const listEl = content.querySelector('#my-groups-list');
    const renderList = (filter) => {
      const filtered = filter
        ? groups.filter(g => g.name.toLowerCase().includes(filter) || (g.shortCode || '').toLowerCase().includes(filter))
        : groups;
      listEl.innerHTML = filtered.length === 0
        ? '<p style="color:var(--text-muted);text-align:center;padding:20px;">No groups match your filter</p>'
        : filtered.map(g => renderGroupCard(g)).join('');
      listEl.querySelectorAll('[data-groupid]').forEach(card => {
        card.addEventListener('click', () => window.navigate('group-detail', card.dataset.groupid));
      });
    };

    renderList('');
    content.querySelector('#my-groups-filter').addEventListener('input', (e) => {
      renderList(e.target.value.trim().toLowerCase());
    });
  } catch (err) {
    content.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderGroupCard(g) {
  const hasUnread = g.lastPostCreatedAt && (!g.lastPostReadAt || new Date(g.lastPostCreatedAt) > new Date(g.lastPostReadAt));

  return `
    <div data-groupid="${g.groupId}" style="display:flex;gap:14px;padding:14px 16px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);cursor:pointer;transition:all 0.2s;overflow:hidden;${hasUnread ? 'border-left:3px solid var(--accent);' : ''}" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='${hasUnread ? 'var(--accent)' : 'var(--border)'}';${hasUnread ? "this.style.borderLeftColor='var(--accent)';" : ''}">
      <img src="${g.iconUrl || ''}" alt="" style="width:48px;height:48px;border-radius:var(--radius);object-fit:cover;background:var(--bg-tertiary);flex-shrink:0;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 48%22><rect fill=%22%23243447%22 width=%2248%22 height=%2248%22/><text x=%2224%22 y=%2230%22 text-anchor=%22middle%22 fill=%22%238899a6%22 font-size=%2216%22>G</text></svg>'" />
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <h4 style="font-size:0.9rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${g.name}</h4>
          ${hasUnread ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0;"></span>' : ''}
          ${g.isRepresenting ? '<span class="badge badge-success" style="font-size:0.6rem;">Representing</span>' : ''}
        </div>
        <p style="font-size:0.78rem;color:var(--text-secondary);margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4;">${(g.description || '').replace(/\n/g, ' ')}</p>
        <div style="display:flex;gap:12px;margin-top:6px;font-size:0.72rem;color:var(--text-muted);">
          <span>${g.shortCode || ''}.${g.discriminator || ''}</span>
          <span>${(g.memberCount || 0).toLocaleString()} members</span>
          ${g.privacy === 'private' ? '<span>🔒 Private</span>' : ''}
          ${g.lastPostCreatedAt ? `<span>Last post: ${timeAgo(g.lastPostCreatedAt)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function showSearch(content, api) {
  content.innerHTML = `
    <div class="search-bar" style="margin-bottom:16px;">
      <input type="text" id="group-search" class="form-control" placeholder="Search groups by name..." />
      <button class="btn btn-primary" id="group-search-btn">Search</button>
    </div>
    <div id="group-results">
      <div class="empty-state"><div class="emoji">🔍</div><h3>Search for groups</h3><p>Enter a name to find VRChat groups</p></div>
    </div>
  `;

  const searchGroups = async () => {
    const query = document.getElementById('group-search').value.trim();
    if (!query) return;
    const results = document.getElementById('group-results');
    results.innerHTML = '<div class="loading"><div class="spinner"></div>Searching...</div>';
    try {
      const groups = await api.searchGroups(query, { n: 20 });
      if (!groups || groups.length === 0) {
        results.innerHTML = '<div class="empty-state"><div class="emoji">🔍</div><h3>No groups found</h3></div>';
        return;
      }
      results.innerHTML = `<div class="grid grid-2">${groups.map(g => `
        <div class="user-card" data-groupid="${g.id}" style="cursor:pointer;">
          <img src="${g.iconUrl || g.bannerUrl || ''}" alt="" style="width:44px;height:44px;border-radius:var(--radius);object-fit:cover;background:var(--bg-tertiary);flex-shrink:0;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 48%22><rect fill=%22%23243447%22 width=%2248%22 height=%2248%22/><text x=%2224%22 y=%2230%22 text-anchor=%22middle%22 fill=%22%238899a6%22 font-size=%2216%22>G</text></svg>'" />
          <div class="user-info" style="min-width:0;">
            <h4 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${g.name}</h4>
            <p>${g.shortCode || ''}${g.discriminator ? '.' + g.discriminator : ''} • ${(g.memberCount || 0).toLocaleString()} members</p>
          </div>
        </div>
      `).join('')}</div>`;
      results.querySelectorAll('[data-groupid]').forEach(card => {
        card.addEventListener('click', () => window.navigate('group-detail', card.dataset.groupid));
      });
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  };

  document.getElementById('group-search-btn').addEventListener('click', searchGroups);
  document.getElementById('group-search').addEventListener('keypress', (e) => { if (e.key === 'Enter') searchGroups(); });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
