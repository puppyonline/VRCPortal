const PAGE_SIZE = 25;
const CACHE_TTL = 120000; // 2 minutes
const friendsCache = { online: null, offline: null, onlineTime: 0, offlineTime: 0 };

export async function renderFriends(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>Friends</h2>
      <p>View friends, check statuses, and manage friend requests</p>
    </div>
    <div class="tabs" id="friends-tabs">
      <div class="tab active" data-tab="online">Online</div>
      <div class="tab" data-tab="offline">Offline</div>
      <div class="tab" data-tab="lookup">Friend Status</div>
    </div>
    <div id="friends-results"><div class="loading"><div class="spinner"></div>Loading friends...</div></div>
  `;

  let currentTab = 'online';
  let allFriends = [];
  let currentPage = 0;

  const loadFriends = async (offline = false) => {
    const results = document.getElementById('friends-results');
    const cacheKey = offline ? 'offline' : 'online';
    const cacheTimeKey = offline ? 'offlineTime' : 'onlineTime';

    // Use cache if fresh
    if (friendsCache[cacheKey] && (Date.now() - friendsCache[cacheTimeKey] < CACHE_TTL)) {
      allFriends = friendsCache[cacheKey];
      currentPage = 0;
      renderPage(results, offline);
      return;
    }

    results.innerHTML = '<div class="loading"><div class="spinner"></div>Loading friends...</div>';
    try {
      // Fetch all friends by paginating until empty response
      allFriends = [];
      let offset = 0;
      const batchSize = 50;
      while (true) {
        const batch = await api.getFriends({ offline, n: batchSize, offset });
        if (!batch || batch.length === 0) break;
        allFriends = allFriends.concat(batch);
        results.innerHTML = `<div class="loading"><div class="spinner"></div>Loading friends... (${allFriends.length} loaded)</div>`;
        offset += batch.length;
        // Only stop if we got zero results — VRChat sometimes returns fewer than requested
      }

      // Cache the result
      friendsCache[cacheKey] = allFriends;
      friendsCache[cacheTimeKey] = Date.now();

      if (allFriends.length === 0) {
        results.innerHTML = `<div class="empty-state"><div class="emoji">🤝</div><h3>No ${offline ? 'offline' : 'online'} friends</h3></div>`;
        return;
      }
      currentPage = 0;
      renderPage(results, offline);
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">${err.status === 401 ? 'Not logged in. <a href="#login" style="color:var(--accent);">Login</a>' : err.message}</div>`;
    }
  };

  const renderPage = (results, offline) => {
    const totalPages = Math.ceil(allFriends.length / PAGE_SIZE);
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageFriends = allFriends.slice(start, end);

    results.innerHTML = `
      <!-- Header with count -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <p style="color:var(--text-muted);">${allFriends.length} ${offline ? 'offline' : 'online'} friends</p>
        <span style="font-size:0.8rem;color:var(--text-muted);">Page ${currentPage + 1} of ${totalPages}</span>
      </div>

      <!-- Friend grid -->
      <div class="grid grid-2">${pageFriends.map(f => renderFriendCard(f)).join('')}</div>

      <!-- Pagination -->
      ${totalPages > 1 ? `
        <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:20px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-secondary" id="friends-prev" ${currentPage === 0 ? 'disabled style="opacity:0.4;pointer-events:none;"' : ''}>← Prev</button>
          <span style="font-size:0.82rem;color:var(--text-secondary);">Page ${currentPage + 1} of ${totalPages}</span>
          <button class="btn btn-sm btn-secondary" id="friends-next" ${currentPage >= totalPages - 1 ? 'disabled style="opacity:0.4;pointer-events:none;"' : ''}>Next →</button>
        </div>
      ` : ''}
    `;

    // Card click handlers
    results.querySelectorAll('.user-card[data-userid]').forEach(card => {
      card.addEventListener('click', () => window.navigate('user-detail', card.dataset.userid));
    });

    // Pagination handlers
    const prev = results.querySelector('#friends-prev');
    const next = results.querySelector('#friends-next');
    if (prev) prev.addEventListener('click', () => { currentPage--; renderPage(results, offline); });
    if (next) next.addEventListener('click', () => { currentPage++; renderPage(results, offline); });
  };

function showSearch(content, api) {
  content.innerHTML = `
    <div class="card">
      <h3 style="margin-bottom:16px;">Check Friend Status</h3>
      <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:16px;">Check your friendship status with a specific user.</p>
      <div class="search-bar">
        <input type="text" id="friend-lookup-id" class="form-control" placeholder="User ID (usr_...)" />
        <button class="btn btn-primary" id="friend-lookup-btn">Check</button>
      </div>
      <div id="friend-lookup-result"></div>
    </div>
  `;
  document.getElementById('friend-lookup-btn').addEventListener('click', async () => {
    const userId = document.getElementById('friend-lookup-id').value.trim();
    const result = document.getElementById('friend-lookup-result');
    if (!userId) return;
    result.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
      const status = await api.getFriendStatus(userId);
      result.innerHTML = `<div class="json-viewer" style="margin-top:12px;">${JSON.stringify(status, null, 2)}</div>`;
    } catch (err) { result.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
  });
}

  document.querySelectorAll('#friends-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#friends-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      if (currentTab === 'lookup') showSearch(document.getElementById('friends-results'), api);
      else loadFriends(currentTab === 'offline');
    });
  });

  loadFriends(false);
}

function renderFriendCard(f) {
  const statusClass = f.status === 'active' || f.status === 'join me' ? 'status-online' : f.status === 'ask me' ? 'status-ask-me' : f.status === 'busy' ? 'status-busy' : 'status-offline';
  const locationText = f.location && f.location !== 'offline' && f.location !== '' && f.location !== 'private' ? 'In world' : f.location === 'private' ? 'Private' : 'Offline';
  const locationIcon = f.location && f.location !== 'offline' && f.location !== '' && f.location !== 'private' ? '🟢' : f.location === 'private' ? '🔒' : '💤';

  return `
    <div class="user-card" data-userid="${f.id}">
      <img src="${f.profilePicOverrideThumbnail || f.currentAvatarThumbnailImageUrl || ''}" alt=""
        style="width:44px;height:44px;min-width:44px;max-width:44px;border-radius:50%;object-fit:cover;background:var(--bg-tertiary);flex-shrink:0;"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 48%22><rect fill=%22%23243447%22 width=%2248%22 height=%2248%22/><text x=%2224%22 y=%2230%22 text-anchor=%22middle%22 fill=%22%238899a6%22 font-size=%2220%22>?</text></svg>'" />
      <div class="user-info" style="min-width:0;">
        <h4 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          <span class="status-dot ${statusClass}"></span>
          ${f.displayName}
        </h4>
        <p style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${f.statusDescription || f.status || 'offline'}</p>
        <p style="font-size:0.75rem;color:var(--text-muted);">${locationIcon} ${locationText}${f.platform ? ' • ' + f.platform : ''}</p>
      </div>
    </div>
  `;
}
