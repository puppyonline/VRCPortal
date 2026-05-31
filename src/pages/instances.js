export async function renderInstances(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>🏠 Instances</h2>
      <p>Look up instances, view recent locations, and get short names</p>
    </div>
    <div class="tabs" id="inst-tabs">
      <div class="tab active" data-tab="lookup">Lookup</div>
      <div class="tab" data-tab="recent">Recent Locations</div>
      <div class="tab" data-tab="shortname">Short Name</div>
    </div>
    <div id="inst-content"></div>
    <div class="card" id="instance-result-card" style="display:none;margin-top:16px;">
      <div class="card-header"><h3>Instance Details</h3><button class="btn btn-sm btn-secondary" id="close-instance-result">✕ Close</button></div>
      <div id="instance-result"></div>
    </div>
  `;

  const worldCache = {};
  async function fetchWorld(id) {
    if (worldCache[id]) return worldCache[id];
    try { const w = await api.getWorld(id); worldCache[id] = w; return w; } catch { return null; }
  }

  const showInstance = async (instance) => {
    const card = document.getElementById('instance-result-card');
    const result = document.getElementById('instance-result');
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const isGroup = instance.ownerId?.startsWith('grp_');
    const isUser = instance.ownerId?.startsWith('usr_');
    const worldId = instance.worldId || '';

    result.innerHTML = `
      <div class="grid grid-4" style="margin-bottom:16px;">
        <div class="stat-card"><div class="stat-value">${instance.n_users || instance.userCount || 0}</div><div class="stat-label">Users</div></div>
        <div class="stat-card"><div class="stat-value">${instance.capacity || '—'}</div><div class="stat-label">Capacity</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${instance.type || '—'}</div><div class="stat-label">Type</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${instance.region || '—'}</div><div class="stat-label">Region</div></div>
      </div>
      <table style="margin-bottom:16px;">
        <tr><td style="color:var(--text-muted)">Instance ID</td><td style="font-size:0.82rem;word-break:break-all;">${instance.instanceId || instance.id || '—'}</td></tr>
        <tr><td style="color:var(--text-muted)">World ID</td><td style="font-size:0.82rem;">${worldId}</td></tr>
        <tr><td style="color:var(--text-muted)">Owner ID</td><td style="font-size:0.82rem;">${instance.ownerId || '—'}</td></tr>
        <tr><td style="color:var(--text-muted)">Active</td><td>${instance.active ? '✓' : '✗'}</td></tr>
        <tr><td style="color:var(--text-muted)">Full</td><td>${instance.full ? '✓' : '✗'}</td></tr>
        <tr><td style="color:var(--text-muted)">Short Name</td><td>${instance.shortName || '—'}</td></tr>
      </table>
      <h4 style="margin-bottom:8px;font-size:0.82rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">🌍 World</h4>
      <div id="inst-world-box" style="margin-bottom:16px;"><div class="loading" style="padding:12px;"><div class="spinner"></div></div></div>
      <h4 style="margin-bottom:8px;font-size:0.82rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">${isGroup ? '👨‍👩‍👧‍👦 Group' : '👤 Host'}</h4>
      <div id="inst-owner-box" style="margin-bottom:16px;"><div class="loading" style="padding:12px;"><div class="spinner"></div></div></div>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        ${worldId ? '<button class="btn btn-primary btn-sm" id="inst-nav-world">🌍 World Page</button>' : ''}
        ${isGroup ? '<button class="btn btn-primary btn-sm" id="inst-nav-group">👨‍👩‍👧‍👦 Group Page</button>' : ''}
      </div>
      <details><summary style="cursor:pointer;color:var(--text-muted);font-size:0.8rem;">Raw JSON</summary><div class="json-viewer" style="margin-top:8px;">${JSON.stringify(instance, null, 2)}</div></details>
    `;
    document.getElementById('inst-nav-world')?.addEventListener('click', () => window.navigate('world-detail', worldId));
    document.getElementById('inst-nav-group')?.addEventListener('click', () => window.navigate('group-detail', instance.ownerId));

    // World box
    if (worldId) {
      const w = await fetchWorld(worldId);
      const box = document.getElementById('inst-world-box');
      if (box && w) {
        box.innerHTML = `<div style="display:flex;gap:12px;padding:14px;background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;cursor:pointer;" id="inst-wb"><img src="${w.thumbnailImageUrl||w.imageUrl||''}" style="width:110px;height:68px;border-radius:6px;object-fit:cover;background:var(--bg-tertiary);flex-shrink:0;" onerror="this.style.display='none'"/><div style="min-width:0;"><h4 style="font-size:0.92rem;">${w.name}</h4><p style="font-size:0.78rem;color:var(--text-secondary);">by ${w.authorName||'?'}</p><div style="display:flex;gap:10px;margin-top:6px;font-size:0.75rem;color:var(--text-muted);"><span>👥${w.occupants||0}</span><span>⭐${(w.favorites||0).toLocaleString()}</span><span>👁️${(w.visits||0).toLocaleString()}</span></div></div></div>`;
        document.getElementById('inst-wb').addEventListener('click', () => window.navigate('world-detail', worldId));
      } else if (box) box.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;">Unavailable</p>';
    }
    // Owner box
    const ob = document.getElementById('inst-owner-box');
    if (isGroup && ob) {
      try {
        const g = await api.getGroup(instance.ownerId);
        ob.innerHTML = `<div style="display:flex;gap:12px;padding:14px;background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;cursor:pointer;" id="inst-ob"><img src="${g.iconUrl||''}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;background:var(--bg-tertiary);flex-shrink:0;" onerror="this.style.display='none'"/><div><h4 style="font-size:0.92rem;">${g.name}</h4><p style="font-size:0.78rem;color:var(--text-secondary);">${g.shortCode||''}.${g.discriminator||''} • ${g.memberCount||0} members</p></div></div>`;
        document.getElementById('inst-ob').addEventListener('click', () => window.navigate('group-detail', instance.ownerId));
      } catch { ob.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;">Unavailable</p>'; }
    } else if (isUser && ob) {
      try {
        const u = await api.getUser(instance.ownerId);
        ob.innerHTML = `<div style="display:flex;gap:12px;padding:14px;background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;"><img src="${u.currentAvatarThumbnailImageUrl||''}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;background:var(--bg-tertiary);flex-shrink:0;" onerror="this.style.display='none'"/><div><h4 style="font-size:0.92rem;">${u.displayName}</h4><p style="font-size:0.78rem;color:var(--text-secondary);">${u.status||'offline'} • ${(u.tags||[]).find(t=>t.startsWith('system_trust_'))?.replace('system_trust_','')||'visitor'}</p></div></div>`;
      } catch { ob.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;">Unavailable</p>'; }
    } else if (ob) { ob.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;">N/A</p>'; }
  };

  const showTab = (tab) => {
    const content = document.getElementById('inst-content');
    document.getElementById('instance-result-card').style.display = 'none';

    if (tab === 'lookup') {
      content.innerHTML = `<div class="grid grid-2"><div class="card"><h4 style="margin-bottom:12px;">By World + Instance ID</h4><div class="form-group"><label>World ID</label><input type="text" id="inst-world-id" class="form-control" placeholder="wrld_..."/></div><div class="form-group"><label>Instance ID</label><input type="text" id="inst-instance-id" class="form-control" placeholder="12345~private(usr_xxx)"/></div><button class="btn btn-primary" id="lookup-btn">🔍 Lookup</button></div><div class="card"><h4 style="margin-bottom:12px;">By Short Name</h4><div class="form-group"><label>Short Name</label><input type="text" id="inst-short" class="form-control" placeholder="shortname"/></div><button class="btn btn-primary" id="lookup-short-btn">🔍 Lookup</button></div></div>`;
      document.getElementById('lookup-btn').addEventListener('click', async () => {
        const wid = document.getElementById('inst-world-id').value.trim();
        const iid = document.getElementById('inst-instance-id').value.trim();
        if (wid && iid) { try { await showInstance(await api.getInstance(wid, iid)); } catch(e) { document.getElementById('instance-result-card').style.display='block'; document.getElementById('instance-result').innerHTML=`<div class="alert alert-error">${e.message}</div>`; } }
      });
      document.getElementById('lookup-short-btn').addEventListener('click', async () => {
        const sn = document.getElementById('inst-short').value.trim();
        if (sn) { try { await showInstance(await api.getInstanceByShortName(sn)); } catch(e) { document.getElementById('instance-result-card').style.display='block'; document.getElementById('instance-result').innerHTML=`<div class="alert alert-error">${e.message}</div>`; } }
      });
    } else if (tab === 'recent') {
      content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading recent locations...</div>';
      loadRecent(content);
    } else if (tab === 'shortname') {
      content.innerHTML = `<div class="card"><h4 style="margin-bottom:12px;">Get Short Name</h4><div class="form-group"><label>Full Instance ID (worldId:instanceId)</label><input type="text" id="shortname-input" class="form-control" placeholder="wrld_xxx:12345~friends(usr_xxx)"/></div><button class="btn btn-primary" id="shortname-btn">🔗 Get Short Name</button><div id="shortname-result" style="margin-top:12px;"></div></div>`;
      document.getElementById('shortname-btn').addEventListener('click', async () => {
        const id = document.getElementById('shortname-input').value.trim();
        if (!id) return;
        try { const d = await api.getShortName(id); document.getElementById('shortname-result').innerHTML = `<div class="alert alert-success">Short name: <strong>${d.shortName||JSON.stringify(d)}</strong></div>`; }
        catch(e) { document.getElementById('shortname-result').innerHTML = `<div class="alert alert-error">${e.message}</div>`; }
      });
    }
  };

  async function loadRecent(content) {
    try {
      const locations = await api.getRecentLocations({ n: 20 });
      if (!locations || locations.length === 0) { content.innerHTML = '<div class="empty-state"><div class="emoji">🏠</div><h3>No recent locations</h3></div>'; return; }
      const items = Array.isArray(locations) ? locations : [];
      const parsed = items.map(loc => {
        const locStr = typeof loc === 'string' ? loc : (loc.location || loc.instanceId || JSON.stringify(loc));
        const parts = locStr.split(':');
        const worldId = parts[0] || '';
        const instancePart = parts.slice(1).join(':') || '';
        const regionMatch = instancePart.match(/~region\(([^)]+)\)/);
        const typeMatch = instancePart.match(/^[^~]*~(\w+)\(/);
        const groupMatch = instancePart.match(/~group\((grp_[^)]+)\)/);
        const privateMatch = instancePart.match(/~private\((usr_[^)]+)\)/);
        const friendsMatch = instancePart.match(/~friends\((usr_[^)]+)\)/);
        const hiddenMatch = instancePart.match(/~hidden\((usr_[^)]+)\)/);
        const ownerId = groupMatch?.[1] || privateMatch?.[1] || friendsMatch?.[1] || hiddenMatch?.[1] || null;
        const ownerType = groupMatch ? 'group' : (privateMatch || friendsMatch || hiddenMatch) ? 'user' : null;
        return { worldId, instancePart, region: regionMatch?.[1], type: typeMatch?.[1], ownerId, ownerType };
      });

      // Render cards with expandable area
      content.innerHTML = `
        <p style="color:var(--text-muted);margin-bottom:12px;">${parsed.length} recent locations</p>
        <div id="recent-list" style="display:flex;flex-direction:column;gap:10px;"></div>
      `;
      const list = document.getElementById('recent-list');
      parsed.forEach((p, i) => {
        const card = document.createElement('div');
        card.id = `rloc-${i}`;
        card.style.cssText = 'background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:border-color 0.15s;';
        card.innerHTML = `
          <div style="display:flex;">
            <div class="rloc-thumb" style="width:110px;min-height:72px;background:var(--bg-tertiary);flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Open World"><div class="spinner" style="width:16px;height:16px;margin:0;"></div></div>
            <div class="rloc-body" style="flex:1;min-width:0;padding:12px 14px;cursor:pointer;" title="View Instance">
              <div class="rloc-name" style="font-weight:600;font-size:0.92rem;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.worldId}</div>
              <div style="font-size:0.8rem;margin-top:2px;"><span class="rloc-owner-link" style="color:var(--accent);cursor:pointer;display:${p.ownerId ? 'inline' : 'none'};" title="${p.ownerType === 'group' ? 'Open Group' : ''}">${p.ownerId || ''}</span></div>
              <div style="display:flex;gap:6px;margin-top:6px;">${p.region ? `<span class="badge badge-info">${p.region}</span>` : ''}${p.type ? `<span class="badge badge-warning">${p.type}</span>` : '<span class="badge badge-success">public</span>'}</div>
            </div>
          </div>
          <div class="rloc-expand" style="display:none;border-top:1px solid var(--border);padding:14px;"></div>
        `;
        list.appendChild(card);
      });

      // Resolve names
      const uWorlds = [...new Set(parsed.map(p => p.worldId).filter(id => id.startsWith('wrld_')))];
      const uGroups = [...new Set(parsed.filter(p => p.ownerType === 'group').map(p => p.ownerId))];
      const uUsers = [...new Set(parsed.filter(p => p.ownerType === 'user').map(p => p.ownerId))];
      const [wR, gR, uR] = await Promise.all([
        Promise.allSettled(uWorlds.map(id => fetchWorld(id))),
        Promise.allSettled(uGroups.map(id => api.getGroup(id).catch(() => null))),
        Promise.allSettled(uUsers.map(id => api.getUser(id).catch(() => null))),
      ]);
      const wMap = {}; uWorlds.forEach((id, i) => { if (wR[i].status === 'fulfilled' && wR[i].value) wMap[id] = wR[i].value; });
      const gMap = {}; uGroups.forEach((id, i) => { if (gR[i].status === 'fulfilled' && gR[i].value) gMap[id] = gR[i].value; });
      const uMap = {}; uUsers.forEach((id, i) => { if (uR[i].status === 'fulfilled' && uR[i].value) uMap[id] = uR[i].value; });

      // Update cards
      let expandedIdx = null;
      parsed.forEach((p, i) => {
        const card = document.getElementById(`rloc-${i}`);
        if (!card) return;
        const thumb = card.querySelector('.rloc-thumb');
        const name = card.querySelector('.rloc-name');
        const ownerLink = card.querySelector('.rloc-owner-link');
        const body = card.querySelector('.rloc-body');
        const expand = card.querySelector('.rloc-expand');
        const world = wMap[p.worldId];

        // Fill world
        if (world) {
          thumb.innerHTML = `<img src="${world.thumbnailImageUrl||world.imageUrl||''}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='N/A'"/>`;
          name.textContent = world.name;
        } else { thumb.innerHTML = '<span style="font-size:0.7rem;color:var(--text-muted);">N/A</span>'; }

        // Fill owner
        if (p.ownerType === 'group' && gMap[p.ownerId]) {
          const g = gMap[p.ownerId];
          ownerLink.textContent = `👨‍👩‍👧‍👦 ${g.name} (${g.shortCode||''}.${g.discriminator||''})`;
        } else if (p.ownerType === 'user' && uMap[p.ownerId]) {
          ownerLink.textContent = `👤 ${uMap[p.ownerId].displayName}`;
        } else if (!p.ownerId) { ownerLink.style.display = 'none'; }

        // Thumb click → world page
        thumb.addEventListener('click', (e) => { e.stopPropagation(); if (p.worldId.startsWith('wrld_')) window.navigate('world-detail', p.worldId); });
        thumb.addEventListener('mouseenter', () => { thumb.style.opacity = '0.8'; });
        thumb.addEventListener('mouseleave', () => { thumb.style.opacity = '1'; });

        // Owner link click → group page only
        ownerLink.addEventListener('click', (e) => {
          e.stopPropagation();
          if (p.ownerType === 'group' && p.ownerId) window.navigate('group-detail', p.ownerId);
        });
        ownerLink.addEventListener('mouseenter', () => { ownerLink.style.textDecoration = 'underline'; });
        ownerLink.addEventListener('mouseleave', () => { ownerLink.style.textDecoration = 'none'; });

        // Body click → expand inline instance details
        body.addEventListener('mouseenter', () => { card.style.borderColor = 'var(--accent)'; });
        body.addEventListener('mouseleave', () => { if (expandedIdx !== i) card.style.borderColor = 'var(--border)'; });
        body.addEventListener('click', async (e) => {
          if (e.target.closest('.rloc-owner-link')) return;
          // Collapse previous
          if (expandedIdx !== null && expandedIdx !== i) {
            const prev = document.getElementById(`rloc-${expandedIdx}`);
            if (prev) { prev.querySelector('.rloc-expand').style.display = 'none'; prev.style.borderColor = 'var(--border)'; }
          }
          // Toggle
          if (expandedIdx === i) { expand.style.display = 'none'; card.style.borderColor = 'var(--border)'; expandedIdx = null; return; }
          expandedIdx = i;
          card.style.borderColor = 'var(--accent)';
          expand.style.display = 'block';
          expand.innerHTML = '<div class="loading" style="padding:8px;"><div class="spinner"></div></div>';

          if (!p.worldId || !p.instancePart) { expand.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;">No instance data</p>'; return; }
          try {
            const inst = await api.getInstance(p.worldId, p.instancePart);
            const isGrp = inst.ownerId?.startsWith('grp_');
            const isUsr = inst.ownerId?.startsWith('usr_');
            let ownerHtml = '';
            if (isGrp) {
              const g = gMap[inst.ownerId] || (await api.getGroup(inst.ownerId).catch(() => null));
              if (g) ownerHtml = `<div style="margin-top:10px;padding:10px;background:var(--bg-tertiary);border-radius:8px;display:flex;gap:8px;align-items:center;cursor:pointer;" onclick="window.navigate('group-detail','${inst.ownerId}')"><img src="${g.iconUrl||''}" style="width:32px;height:32px;border-radius:6px;" onerror="this.style.display='none'"/><div><strong style="font-size:0.82rem;">👨‍👩‍👧‍👦 ${g.name}</strong><br/><span style="font-size:0.72rem;color:var(--text-muted);">${g.shortCode||''}.${g.discriminator||''} • ${g.memberCount||0} members</span></div></div>`;
            } else if (isUsr) {
              const u = uMap[inst.ownerId] || (await api.getUser(inst.ownerId).catch(() => null));
              if (u) ownerHtml = `<div style="margin-top:10px;padding:10px;background:var(--bg-tertiary);border-radius:8px;display:flex;gap:8px;align-items:center;"><img src="${u.currentAvatarThumbnailImageUrl||''}" style="width:32px;height:32px;border-radius:50%;" onerror="this.style.display='none'"/><div><strong style="font-size:0.82rem;">👤 ${u.displayName}</strong><br/><span style="font-size:0.72rem;color:var(--text-muted);">${u.status||'offline'}</span></div></div>`;
            }
            expand.innerHTML = `
              <div style="display:flex;gap:16px;margin-bottom:8px;flex-wrap:wrap;">
                <span><strong>${inst.n_users||inst.userCount||0}</strong> users</span>
                <span>Cap: ${inst.capacity||'—'}</span>
                <span>Type: ${inst.type||'—'}</span>
                <span>Region: ${inst.region||'—'}</span>
                <span>${inst.active?'Active':'Inactive'}</span>
                <span>${inst.full?'Full':'Not full'}</span>
              </div>
              ${ownerHtml}
            `;
          } catch (err) { expand.innerHTML = `<p style="color:var(--danger);font-size:0.82rem;">${err.message}</p>`; }
        });
      });

      content.querySelector('p').textContent = `${parsed.length} recent locations`;
    } catch (err) { content.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
  }

  document.querySelectorAll('#inst-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#inst-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      showTab(tab.dataset.tab);
    });
  });

  document.getElementById('close-instance-result').addEventListener('click', () => { document.getElementById('instance-result-card').style.display = 'none'; });

  // Handle pending lookup from world detail page
  if (window._pendingInstanceLookup) {
    const { worldId, instanceId } = window._pendingInstanceLookup;
    window._pendingInstanceLookup = null;
    showTab('lookup');
    if (worldId && instanceId) {
      try { await showInstance(await api.getInstance(worldId, instanceId)); }
      catch (err) { document.getElementById('instance-result-card').style.display = 'block'; document.getElementById('instance-result').innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
    }
  } else {
    showTab('lookup');
  }
}
