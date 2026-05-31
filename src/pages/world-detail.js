export async function renderWorldDetail(container, api, worldId) {
  container.innerHTML = `
    <div style="margin-bottom:16px;">
      <button class="btn btn-secondary btn-sm" id="back-from-world">← Back</button>
    </div>
    <div id="world-detail-page"><div class="loading"><div class="spinner"></div>Loading world...</div></div>
  `;

  document.getElementById('back-from-world').addEventListener('click', () => window.history.back());

  try {
    const world = await api.getWorld(worldId);

    // Also try to get metadata and publish status
    const [metaRes, publishRes] = await Promise.allSettled([
      api.getWorldMetadata(worldId),
      api.getWorldPublishStatus(worldId),
    ]);
    const meta = metaRes.status === 'fulfilled' ? metaRes.value : null;
    const publish = publishRes.status === 'fulfilled' ? publishRes.value : null;

    document.getElementById('world-detail-page').innerHTML = `
      <!-- Hero Banner -->
      <div class="world-detail-hero">
        <img class="world-detail-banner" src="${world.imageUrl || world.thumbnailImageUrl || ''}" alt="${world.name}" onerror="this.style.display='none'" />
        <div class="world-detail-hero-overlay"></div>
        <div class="world-detail-hero-content">
          <h1>${world.name}</h1>
          <p>by <strong>${world.authorName || 'Unknown'}</strong></p>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-4" style="margin:20px 0;">
        <div class="stat-card dash-stat-card dash-stat-users">
          <div class="dash-stat-body" style="text-align:center;width:100%;">
            <div class="dash-stat-value" style="font-size:1.6rem;">${(world.occupants || 0).toLocaleString()}</div>
            <div class="dash-stat-label">Online Now</div>
          </div>
        </div>
        <div class="stat-card dash-stat-card dash-stat-status">
          <div class="dash-stat-body" style="text-align:center;width:100%;">
            <div class="dash-stat-value" style="font-size:1.6rem;">${(world.favorites || 0).toLocaleString()}</div>
            <div class="dash-stat-label">Favorites</div>
          </div>
        </div>
        <div class="stat-card dash-stat-card dash-stat-time">
          <div class="dash-stat-body" style="text-align:center;width:100%;">
            <div class="dash-stat-value" style="font-size:1.6rem;">${(world.visits || 0).toLocaleString()}</div>
            <div class="dash-stat-label">Total Visits</div>
          </div>
        </div>
        <div class="stat-card dash-stat-card dash-stat-version">
          <div class="dash-stat-body" style="text-align:center;width:100%;">
            <div class="dash-stat-value" style="font-size:1.6rem;">${world.heat || 0}</div>
            <div class="dash-stat-label">Heat</div>
          </div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-2" style="margin-bottom:20px;">
        <div class="card">
          <h3 style="margin-bottom:12px;">Description</h3>
          <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;">${world.description || 'No description provided.'}</p>
        </div>
        <div class="card">
          <h3 style="margin-bottom:12px;">Details</h3>
          <table>
            <tr><td style="color:var(--text-muted)">World ID</td><td style="font-size:0.8rem;word-break:break-all;">${world.id}</td></tr>
            <tr><td style="color:var(--text-muted)">Author ID</td><td style="font-size:0.8rem;">${world.authorId || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Capacity</td><td>${world.capacity || '—'} (recommended: ${world.recommendedCapacity || '—'})</td></tr>
            <tr><td style="color:var(--text-muted)">Release Status</td><td><span class="badge badge-success">${world.releaseStatus || '—'}</span></td></tr>
            <tr><td style="color:var(--text-muted)">Platform</td><td>${world.platform || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Version</td><td>${world.version || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Created</td><td>${world.created_at ? new Date(world.created_at).toLocaleString() : '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Last Updated</td><td>${world.updated_at ? new Date(world.updated_at).toLocaleString() : '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Publication Date</td><td>${world.publicationDate ? new Date(world.publicationDate).toLocaleString() : '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Labs Publication</td><td>${world.labsPublicationDate ? new Date(world.labsPublicationDate).toLocaleString() : '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Namespace</td><td>${world.namespace || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Organization</td><td>${world.organization || '—'}</td></tr>
          </table>
        </div>
      </div>

      <!-- Tags -->
      <div class="card" style="margin-bottom:20px;">
        <h3 style="margin-bottom:12px;">Tags</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${(world.tags || []).map(tag => {
            const isSystem = tag.startsWith('system_');
            const isAuthor = tag.startsWith('author_tag_');
            const label = isAuthor ? tag.replace('author_tag_', '') : tag;
            const cls = isSystem ? 'badge-warning' : isAuthor ? 'badge-success' : 'badge-info';
            return `<span class="badge ${cls}">${label}</span>`;
          }).join('') || '<span style="color:var(--text-muted)">No tags</span>'}
        </div>
      </div>

      <!-- Active Instances -->
      ${world.instances && world.instances.length > 0 ? `
        <div class="card" style="margin-bottom:20px;">
          <h3 style="margin-bottom:12px;">Active Instances (${world.instances.length})</h3>
          <div class="grid grid-3" id="world-instances-grid">
            ${world.instances.map((i, idx) => {
              const instId = i[0] || '';
              const users = i[1] || 0;
              const regionMatch = instId.match(/~region\(([^)]+)\)/);
              const typeMatch = instId.match(/^[^~]*~(\w+)\(/);
              const groupMatch = instId.match(/~group\((grp_[^)]+)\)/);
              const userMatch = instId.match(/~(?:private|friends|hidden)\((usr_[^)]+)\)/);
              return `
                <div class="world-instance-card" data-worldid="${worldId}" data-instanceid="${instId}" data-groupid="${groupMatch?.[1] || ''}" data-userid="${userMatch?.[1] || ''}" style="padding:10px 14px;background:var(--bg-primary);border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all 0.15s;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:0.88rem;font-weight:600;">${users} user${users !== 1 ? 's' : ''}</span>
                    <div style="display:flex;gap:4px;">
                      ${regionMatch ? `<span class="badge badge-info" style="font-size:0.65rem;">${regionMatch[1]}</span>` : ''}
                      ${typeMatch ? `<span class="badge badge-warning" style="font-size:0.65rem;">${typeMatch[1]}</span>` : '<span class="badge badge-success" style="font-size:0.65rem;">public</span>'}
                    </div>
                  </div>
                  <div class="inst-owner-name" data-idx="${idx}" style="font-size:0.78rem;color:var(--accent);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${groupMatch ? groupMatch[1] : userMatch ? userMatch[1] : ''}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Unity Packages -->
      ${world.unityPackages && world.unityPackages.length > 0 ? `
        <div class="card" style="margin-bottom:20px;">
          <h3 style="margin-bottom:12px;">Unity Packages (${world.unityPackages.length})</h3>
          <table>
            <thead><tr><th>Platform</th><th>Unity Version</th><th>SDK Version</th><th>Size</th><th>Status</th></tr></thead>
            <tbody>
              ${world.unityPackages.map(pkg => `
                <tr>
                  <td><span class="badge badge-info">${pkg.platform || '—'}</span></td>
                  <td style="font-size:0.8rem;">${pkg.unityVersion || '—'}</td>
                  <td style="font-size:0.8rem;">${pkg.unitySortNumber || '—'}</td>
                  <td style="font-size:0.8rem;">${pkg.assetUrlObject?.sizeInBytes ? (pkg.assetUrlObject.sizeInBytes / 1048576).toFixed(1) + ' MB' : '—'}</td>
                  <td><span class="badge ${pkg.status === 'current' ? 'badge-success' : 'badge-warning'}">${pkg.status || '—'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Metadata & Publish Status -->
      ${meta || publish ? `
        <div class="grid grid-2" style="margin-bottom:20px;">
          ${meta ? `<div class="card"><h3 style="margin-bottom:8px;">Metadata</h3><div class="json-viewer" style="max-height:200px;">${JSON.stringify(meta, null, 2)}</div></div>` : ''}
          ${publish ? `<div class="card"><h3 style="margin-bottom:8px;">Publish Status</h3><div class="json-viewer" style="max-height:200px;">${JSON.stringify(publish, null, 2)}</div></div>` : ''}
        </div>
      ` : ''}

      <!-- Raw JSON -->
      <details>
        <summary style="cursor:pointer;color:var(--text-muted);font-size:0.85rem;margin-bottom:8px;">View Full Raw JSON</summary>
        <div class="json-viewer">${JSON.stringify(world, null, 2)}</div>
      </details>
    `;

    // Post-render: resolve group/user names in instance cards and make them clickable
    const instanceCards = document.querySelectorAll('.world-instance-card');
    if (instanceCards.length > 0) {
      // Collect unique group and user IDs
      const groupIds = [...new Set([...instanceCards].map(c => c.dataset.groupid).filter(Boolean))];
      const userIds = [...new Set([...instanceCards].map(c => c.dataset.userid).filter(Boolean))];

      // Resolve in parallel
      const [groupResults, userResults] = await Promise.all([
        Promise.allSettled(groupIds.map(id => api.getGroup(id).catch(() => null))),
        Promise.allSettled(userIds.map(id => api.getUser(id).catch(() => null))),
      ]);

      const groupMap = {};
      groupIds.forEach((id, i) => { if (groupResults[i].status === 'fulfilled' && groupResults[i].value) groupMap[id] = groupResults[i].value; });
      const userMap = {};
      userIds.forEach((id, i) => { if (userResults[i].status === 'fulfilled' && userResults[i].value) userMap[id] = userResults[i].value; });

      // Update each card with resolved names
      instanceCards.forEach(card => {
        const gid = card.dataset.groupid;
        const uid = card.dataset.userid;
        const nameEl = card.querySelector('.inst-owner-name');
        if (gid && groupMap[gid] && nameEl) {
          nameEl.innerHTML = `👨‍👩‍👧‍👦 ${groupMap[gid].name} <span style="color:var(--text-muted);font-size:0.7rem;">${groupMap[gid].shortCode || ''}.${groupMap[gid].discriminator || ''}</span>`;
        } else if (uid && userMap[uid] && nameEl) {
          nameEl.textContent = `👤 ${userMap[uid].displayName}`;
        } else if (nameEl && !gid && !uid) {
          nameEl.style.display = 'none';
        }

        // Click to navigate to instances page and look up
        card.addEventListener('mouseenter', () => { card.style.borderColor = 'var(--accent)'; card.style.transform = 'translateY(-1px)'; });
        card.addEventListener('mouseleave', () => { card.style.borderColor = 'var(--border)'; card.style.transform = 'none'; });
        card.addEventListener('click', () => {
          // Navigate to instances page - store lookup data globally
          window._pendingInstanceLookup = { worldId: card.dataset.worldid, instanceId: card.dataset.instanceid };
          window.navigate('instances');
        });
      });
    }

  } catch (err) {
    document.getElementById('world-detail-page').innerHTML = `<div class="alert alert-error">Failed to load world: ${err.message}</div>`;
  }
}
