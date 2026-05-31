export async function renderGroupDetail(container, api, groupId) {
  container.innerHTML = `
    <div style="margin-bottom:16px;">
      <button class="btn btn-secondary btn-sm" id="back-from-group">← Back</button>
    </div>
    <div id="group-detail-page"><div class="loading"><div class="spinner"></div>Loading group...</div></div>
  `;

  document.getElementById('back-from-group').addEventListener('click', () => window.history.back());

  try {
    // Fetch group and all related data in parallel
    const [groupRes, rolesRes, membersRes, announcementRes, postsRes, instancesRes, permissionsRes] = await Promise.allSettled([
      api.getGroup(groupId),
      api.getGroupRoles(groupId),
      api.getGroupMembers(groupId, { n: 100 }),
      api.getGroupAnnouncement(groupId),
      api.getGroupPosts(groupId, { n: 10 }),
      api.getGroupInstances(groupId),
      api.getGroupPermissions(groupId),
    ]);

    const group = groupRes.status === 'fulfilled' ? groupRes.value : null;
    const roles = rolesRes.status === 'fulfilled' ? rolesRes.value : [];
    const members = membersRes.status === 'fulfilled' ? membersRes.value : [];
    const announcement = announcementRes.status === 'fulfilled' ? announcementRes.value : null;
    const posts = postsRes.status === 'fulfilled' ? postsRes.value : [];
    const instances = instancesRes.status === 'fulfilled' ? instancesRes.value : [];
    const permissions = permissionsRes.status === 'fulfilled' ? permissionsRes.value : [];

    if (!group) {
      document.getElementById('group-detail-page').innerHTML = '<div class="alert alert-error">Could not load group</div>';
      return;
    }

    document.getElementById('group-detail-page').innerHTML = `
      <!-- Hero -->
      <div class="world-detail-hero" style="margin-bottom:20px;">
        <img class="world-detail-banner" src="${group.bannerUrl || group.iconUrl || ''}" alt="${group.name}" onerror="this.style.display='none'" />
        <div class="world-detail-hero-overlay"></div>
        <div class="world-detail-hero-content" style="display:flex;align-items:center;gap:16px;">
          ${group.iconUrl ? `<img src="${group.iconUrl}" style="width:64px;height:64px;border-radius:12px;border:2px solid rgba(255,255,255,0.2);" onerror="this.style.display='none'" />` : ''}
          <div>
            <h1>${group.name}</h1>
            <p style="opacity:0.8;">${group.shortCode || ''}.${group.discriminator || ''}</p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-4" style="margin-bottom:20px;">
        <div class="stat-card dash-stat-card dash-stat-users">
          <div class="dash-stat-body" style="text-align:center;width:100%;">
            <div class="dash-stat-value" style="font-size:1.6rem;">${(group.memberCount || 0).toLocaleString()}</div>
            <div class="dash-stat-label">Members</div>
          </div>
        </div>
        <div class="stat-card dash-stat-card dash-stat-status">
          <div class="dash-stat-body" style="text-align:center;width:100%;">
            <div class="dash-stat-value" style="font-size:1.6rem;">${group.onlineMemberCount || 0}</div>
            <div class="dash-stat-label">Online</div>
          </div>
        </div>
        <div class="stat-card dash-stat-card dash-stat-time">
          <div class="dash-stat-body" style="text-align:center;width:100%;">
            <div class="dash-stat-value" style="font-size:1rem;">${group.privacy || '—'}</div>
            <div class="dash-stat-label">Privacy</div>
          </div>
        </div>
        <div class="stat-card dash-stat-card dash-stat-version">
          <div class="dash-stat-body" style="text-align:center;width:100%;">
            <div class="dash-stat-value" style="font-size:1rem;">${group.joinState || '—'}</div>
            <div class="dash-stat-label">Join State</div>
          </div>
        </div>
      </div>

      <!-- Announcement -->
      ${announcement && (announcement.title || announcement.text) ? `
        <div class="alert alert-info" style="margin-bottom:20px;">
          <strong>📢 ${announcement.title || 'Announcement'}</strong>
          ${announcement.text ? `<p style="margin-top:6px;opacity:0.9;">${announcement.text}</p>` : ''}
        </div>
      ` : ''}

      <!-- Info Grid -->
      <div class="grid grid-2" style="margin-bottom:20px;">
        <div class="card">
          <h3 style="margin-bottom:12px;">About</h3>
          <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;margin-bottom:16px;">${group.description || 'No description.'}</p>
          <table>
            <tr><td style="color:var(--text-muted)">Group ID</td><td style="font-size:0.8rem;word-break:break-all;">${group.id}</td></tr>
            <tr><td style="color:var(--text-muted)">Owner</td><td style="font-size:0.8rem;"><span id="group-owner-name">${group.ownerId || '—'}</span></td></tr>
            <tr><td style="color:var(--text-muted)">Created</td><td>${group.createdAt ? new Date(group.createdAt).toLocaleString() : '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Updated</td><td>${group.updatedAt ? new Date(group.updatedAt).toLocaleString() : '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Verified</td><td>${group.isVerified ? '✓ Yes' : '✗ No'}</td></tr>
            <tr><td style="color:var(--text-muted)">Languages</td><td>${(group.languages || []).join(', ') || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Links</td><td>${(group.links || []).map(l => `<a href="${l}" target="_blank" style="color:var(--accent);font-size:0.8rem;">${l}</a>`).join('<br>') || '—'}</td></tr>
          </table>
        </div>
        <div class="card">
          <h3 style="margin-bottom:12px;">Rules</h3>
          <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.5;white-space:pre-wrap;">${group.rules || 'No rules specified.'}</p>
        </div>
      </div>

      <!-- Roles -->
      ${Array.isArray(roles) && roles.length > 0 ? `
        <div class="card" style="margin-bottom:20px;">
          <h3 style="margin-bottom:12px;">Roles (${roles.length})</h3>
          <div class="grid grid-3">
            ${roles.map(r => `
              <div style="padding:10px 14px;background:var(--bg-primary);border:1px solid var(--border);border-radius:8px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  ${r.iconUrl ? `<img src="${r.iconUrl}" style="width:20px;height:20px;border-radius:4px;" onerror="this.style.display='none'" />` : ''}
                  <strong style="font-size:0.88rem;">${r.name || 'Unnamed'}</strong>
                </div>
                <p style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">${r.description || ''}</p>
                <p style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">Order: ${r.order ?? '—'} | Default: ${r.isDefault ? '✓' : '✗'}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Members -->
      ${Array.isArray(members) && members.length > 0 ? (() => {
        const friendIds = new Set(api.currentUser?.friends || []);
        const mutualMembers = members.filter(m => friendIds.has(m.userId));
        return mutualMembers.length > 0 ? `
        <div class="card" style="margin-bottom:20px;">
          <h3 style="margin-bottom:12px;">Friends in this Group (${mutualMembers.length})</h3>
          <div class="grid grid-2">
            ${mutualMembers.map(m => `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-primary);border:1px solid var(--border);border-radius:8px;cursor:pointer;" onclick="window.navigate('user-detail','${m.userId}')">
                <img src="${m.user?.thumbnailUrl || m.user?.currentAvatarThumbnailImageUrl || m.thumbnailUrl || ''}" style="width:32px;height:32px;border-radius:50%;background:var(--bg-tertiary);object-fit:cover;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect fill=%22%23243447%22 width=%2232%22 height=%2232%22/></svg>'" />
                <div style="min-width:0;">
                  <p style="font-size:0.85rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.user?.displayName || m.displayName || m.userId || '—'}</p>
                  <p style="font-size:0.72rem;color:var(--text-muted);">${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : ''} ${m.isRepresenting ? '• Representing' : ''}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '';
      })() : ''}

      <!-- Group Instances -->
      ${Array.isArray(instances) && instances.length > 0 ? `
        <div class="card" style="margin-bottom:20px;">
          <h3 style="margin-bottom:12px;">Group Instances (${instances.length})</h3>
          <div class="grid grid-2">
            ${instances.map(inst => `
              <div style="padding:12px;background:var(--bg-primary);border:1px solid var(--border);border-radius:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <strong style="font-size:0.85rem;">${inst.world?.name || inst.worldId || 'Unknown'}</strong>
                  <span class="badge badge-success">${inst.memberCount || inst.n_users || 0} users</span>
                </div>
                <p style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${inst.instanceId || inst.location || '—'}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Posts -->
      ${Array.isArray(posts) && posts.length > 0 ? `
        <div class="card" style="margin-bottom:20px;">
          <h3 style="margin-bottom:12px;">Recent Posts (${posts.length})</h3>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${posts.map(p => `
              <div style="padding:12px;background:var(--bg-primary);border:1px solid var(--border);border-radius:8px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                  <strong style="font-size:0.9rem;">${p.title || 'Post'}</strong>
                  <span style="font-size:0.72rem;color:var(--text-muted);">${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:6px;line-height:1.4;">${(p.text || '').substring(0, 300)}${(p.text || '').length > 300 ? '...' : ''}</p>
                ${p.imageUrl ? `<img src="${p.imageUrl}" style="max-width:100%;max-height:150px;border-radius:6px;margin-top:8px;" onerror="this.style.display='none'" />` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Permissions -->
      ${Array.isArray(permissions) && permissions.length > 0 ? `
        <details style="margin-bottom:20px;">
          <summary style="cursor:pointer;color:var(--text-muted);font-size:0.85rem;">View Permissions (${permissions.length})</summary>
          <div class="json-viewer" style="margin-top:8px;max-height:300px;">${JSON.stringify(permissions, null, 2)}</div>
        </details>
      ` : ''}

      <!-- Raw JSON -->
      <details>
        <summary style="cursor:pointer;color:var(--text-muted);font-size:0.85rem;">View Full Raw JSON</summary>
        <div class="json-viewer" style="margin-top:8px;">${JSON.stringify(group, null, 2)}</div>
      </details>
    `;

    // Resolve owner name
    if (group.ownerId) {
      api.getUser(group.ownerId).then(u => {
        const el = document.getElementById('group-owner-name');
        if (el && u) el.innerHTML = `<a style="color:var(--accent-hover);cursor:pointer;" onclick="window.navigate('user-detail','${group.ownerId}')">${u.displayName}</a>`;
      }).catch(() => {});
    }

  } catch (err) {
    document.getElementById('group-detail-page').innerHTML = `<div class="alert alert-error">Failed to load group: ${err.message}</div>`;
  }
}
