export async function renderProfile(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>👤 My Profile</h2>
      <p>View your VRChat profile information</p>
    </div>
    <div id="profile-content"><div class="loading"><div class="spinner"></div>Loading profile...</div></div>
  `;

  try {
    const user = await api.getCurrentUser();

    // Fetch additional data in parallel
    const [permissionsRes, groupBlocksRes, groupInvitedRes] = await Promise.allSettled([
      api.getAssignedPermissions(),
      api.getUserGroupBlocks(),
      api.getUserGroupInvited(),
    ]);

    const permissions = permissionsRes.status === 'fulfilled' ? permissionsRes.value : null;
    const groupBlocks = groupBlocksRes.status === 'fulfilled' ? groupBlocksRes.value : null;
    const groupInvited = groupInvitedRes.status === 'fulfilled' ? groupInvitedRes.value : null;

    const statusColors = {
      active: 'var(--success)',
      'join me': 'var(--accent)',
      'ask me': 'var(--warning)',
      busy: 'var(--danger)',
      offline: 'var(--text-muted)',
    };

    // Derive trust level
    const trustTags = ['system_trust_veteran', 'system_trust_trusted', 'system_trust_known', 'system_trust_basic'];
    const trustLevel = trustTags.find(t => (user.tags || []).includes(t))?.replace('system_trust_', '') || 'visitor';
    const trustColors = { veteran: '#8b5cf6', trusted: '#f59e0b', known: '#10b981', basic: '#3b82f6', visitor: '#64748b' };

    // Presence info
    const presence = user.presence || {};
    const isOnline = presence.status && presence.status !== 'offline';

    // Platform history
    const platforms = user.platform_history || [];

    // Past display names
    const pastNames = user.pastDisplayNames || [];

    // Status history
    const statusHistory = user.statusHistory || [];

    // Steam details
    const steam = user.steamDetails || {};

    document.getElementById('profile-content').innerHTML = `
      <!-- Profile Hero -->
      <div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:28px;flex-wrap:wrap;">
        <div style="position:relative;flex-shrink:0;">
          <img src="${user.currentAvatarThumbnailImageUrl || user.currentAvatarImageUrl || ''}" alt="Avatar"
            style="width:120px;height:120px;border-radius:var(--radius-lg);object-fit:cover;background:var(--bg-tertiary);border:2px solid ${trustColors[trustLevel]};"
            onerror="this.style.display='none'" />
          <div style="position:absolute;bottom:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:${statusColors[user.status] || 'var(--text-muted)'};border:3px solid var(--bg-base);"></div>
        </div>
        <div style="flex:1;min-width:200px;">
          <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:4px;">${user.displayName}</h2>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
            <span class="badge" style="background:${trustColors[trustLevel]}22;color:${trustColors[trustLevel]};font-size:0.75rem;">${trustLevel}</span>
            <span style="font-size:0.85rem;color:var(--text-secondary);">@${user.username}</span>
            ${user.pronouns ? `<span style="font-size:0.8rem;color:var(--text-muted);">• ${user.pronouns}</span>` : ''}
          </div>
          <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:6px;">
            <span class="status-dot" style="background:${statusColors[user.status] || 'var(--text-muted)'}"></span>
            ${user.status || 'offline'}${user.statusDescription ? ` — ${user.statusDescription}` : ''}
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:0.8rem;color:var(--text-muted);">
            <span>ID: ${user.id}</span>
            ${user.obfuscatedEmail ? `<span>✉️ ${user.obfuscatedEmail}</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-4" style="margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-value">${(user.friends?.length || 0).toLocaleString()}</div>
          <div class="stat-label">Total Friends</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--success);">${user.onlineFriends?.length || 0}</div>
          <div class="stat-label">Online</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--accent-hover);">${user.activeFriends?.length || 0}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--text-muted);">${user.offlineFriends?.length || 0}</div>
          <div class="stat-label">Offline</div>
        </div>
      </div>

      <!-- Presence Card -->
      ${isOnline ? `
      <div class="card" style="margin-bottom:16px;border-left:3px solid var(--success);">
        <h3 style="margin-bottom:12px;">🟢 Current Presence</h3>
        <div class="grid grid-3">
          <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;">World</span><span style="font-size:0.88rem;">${presence.world && presence.world !== 'offline' ? presence.world : '—'}</span></div>
          <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;">Instance</span><span style="font-size:0.88rem;">${presence.instance && presence.instance !== 'offline' ? presence.instance : '—'}</span></div>
          <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;">Instance Type</span><span style="font-size:0.88rem;">${presence.instanceType || '—'}</span></div>
          <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;">Platform</span><span style="font-size:0.88rem;">${presence.platform || '—'}</span></div>
          <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;">Traveling To</span><span style="font-size:0.88rem;">${presence.travelingToWorld && presence.travelingToWorld !== 'offline' ? presence.travelingToWorld : '—'}</span></div>
          <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;">Status</span><span style="font-size:0.88rem;">${presence.status || '—'}</span></div>
        </div>
      </div>
      ` : ''}

      <!-- Main Info Grid -->
      <div class="grid grid-2" style="margin-bottom:16px;">
        <!-- Account Details -->
        <div class="card">
          <h3 style="margin-bottom:12px;">Account Details</h3>
          <table>
            <tr><td style="color:var(--text-muted)">Trust Level</td><td><span style="color:${trustColors[trustLevel]};font-weight:600;">${trustLevel}</span></td></tr>
            <tr><td style="color:var(--text-muted)">Account Created</td><td>${user.date_joined || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Last Login</td><td>${user.last_login ? new Date(user.last_login).toLocaleString() : '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Last Activity</td><td>${user.last_activity ? new Date(user.last_activity).toLocaleString() : '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Last Platform</td><td>${user.last_platform || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Last Mobile</td><td>${user.last_mobile ? new Date(user.last_mobile).toLocaleString() : '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Home World</td><td style="font-size:0.8rem;word-break:break-all;">${user.homeLocation || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">State</td><td>${user.state || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Pronouns</td><td>${user.pronouns || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Language</td><td>${user.userLanguage || '—'} (${user.userLanguageCode || '—'})</td></tr>
            <tr><td style="color:var(--text-muted)">Is Adult</td><td>${user.isAdult ? '✓ Yes' : '✗ No'}</td></tr>
            <tr><td style="color:var(--text-muted)">Booping Enabled</td><td>${user.isBoopingEnabled ? '✓ Yes' : '✗ No'}</td></tr>
            <tr><td style="color:var(--text-muted)">Mobile Invites</td><td>${user.receiveMobileInvitations ? '✓ Yes' : '✗ No'}</td></tr>
          </table>
        </div>

        <!-- Security & Account -->
        <div class="card">
          <h3 style="margin-bottom:12px;">Security & Integrations</h3>
          <table>
            <tr><td style="color:var(--text-muted)">2FA Enabled</td><td>${user.twoFactorAuthEnabled ? '✓ Yes' : '✗ No'}</td></tr>
            ${user.twoFactorAuthEnabledDate ? `<tr><td style="color:var(--text-muted)">2FA Since</td><td>${new Date(user.twoFactorAuthEnabledDate).toLocaleDateString()}</td></tr>` : ''}
            <tr><td style="color:var(--text-muted)">Email Verified</td><td>${user.hasEmail ? '✓ Yes' : '✗ No'}</td></tr>
            <tr><td style="color:var(--text-muted)">Email</td><td>${user.obfuscatedEmail || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Has Birthday</td><td>${user.hasBirthday ? '✓ Yes' : '✗ No'}</td></tr>
            <tr><td style="color:var(--text-muted)">Developer Type</td><td>${user.developerType || 'none'}</td></tr>
            <tr><td style="color:var(--text-muted)">Early Adopter</td><td>${(user.tags || []).includes('system_early_adopter') ? '✓ Yes' : '✗ No'}</td></tr>
            <tr><td style="color:var(--text-muted)">Steam ID</td><td>${user.steamId ? `<a href="https://steamcommunity.com/profiles/${user.steamId}" target="_blank" style="color:var(--accent-hover);">${user.steamId}</a>` : '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Oculus ID</td><td>${user.oculusId || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Pico ID</td><td>${user.picoId || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Vive ID</td><td>${user.viveId || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Discord SDK</td><td>${user.hasAcceptedDiscordSocialSDKPerms ? '✓ Accepted' : '✗ No'}</td></tr>
            <tr><td style="color:var(--text-muted)">Logged In From Client</td><td>${user.hasLoggedInFromClient ? '✓ Yes' : '✗ No'}</td></tr>
          </table>
        </div>
      </div>

      <!-- Bio & Links -->
      ${user.bio || user.bioLinks?.length ? `
      <div class="card" style="margin-bottom:16px;">
        ${user.bio ? `<h3 style="margin-bottom:8px;">Bio</h3><p style="font-size:0.9rem;color:var(--text-secondary);white-space:pre-wrap;line-height:1.6;margin-bottom:12px;">${user.bio}</p>` : ''}
        ${user.bioLinks?.length ? `
          <h4 style="margin-bottom:8px;font-size:0.85rem;color:var(--text-muted);">Bio Links</h4>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${user.bioLinks.map(l => `<a href="${l}" target="_blank" class="btn btn-sm btn-secondary">${(() => { try { return new URL(l).hostname; } catch { return l; } })()}</a>`).join('')}
          </div>
        ` : ''}
      </div>
      ` : ''}

      <!-- Tags -->
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:12px;">Tags</h3>
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

      <!-- Platform History & Past Names -->
      <div class="grid grid-2" style="margin-bottom:16px;">
        ${platforms.length > 0 ? `
        <div class="card">
          <h3 style="margin-bottom:12px;">Platform History</h3>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${platforms.map(p => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg-primary);border-radius:var(--radius-sm);border:1px solid var(--border);">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:1.1rem;">${p.platform === 'standalonewindows' ? '🖥️' : p.platform === 'android' ? '📱' : p.platform === 'ios' ? '📱' : '🎮'}</span>
                  <div>
                    <span style="font-size:0.85rem;font-weight:500;">${p.platform}</span>
                    ${p.isMobile ? '<span class="badge badge-info" style="margin-left:6px;font-size:0.65rem;">Mobile</span>' : ''}
                  </div>
                </div>
                <span style="font-size:0.75rem;color:var(--text-muted);">${p.recorded ? new Date(p.recorded).toLocaleDateString() : '—'}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${pastNames.length > 0 ? `
        <div class="card">
          <h3 style="margin-bottom:12px;">Past Display Names</h3>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${pastNames.map(n => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg-primary);border-radius:var(--radius-sm);border:1px solid var(--border);">
                <span style="font-size:0.88rem;font-weight:500;">${n.displayName}</span>
                <div style="display:flex;align-items:center;gap:6px;">
                  ${n.reverted ? '<span class="badge badge-warning" style="font-size:0.65rem;">Reverted</span>' : ''}
                  <span style="font-size:0.75rem;color:var(--text-muted);">${n.updated_at ? new Date(n.updated_at).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Status History -->
      ${statusHistory.length > 0 ? `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:12px;">Status History</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${statusHistory.map(s => `<span style="padding:6px 12px;background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;font-size:0.8rem;color:var(--text-secondary);">${s}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Steam Details -->
      ${steam.steamid ? `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:12px;">Steam Profile</h3>
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px;">
          ${steam.avatarmedium ? `<img src="${steam.avatarmedium}" style="width:48px;height:48px;border-radius:var(--radius);background:var(--bg-tertiary);" onerror="this.style.display='none'" />` : ''}
          <div>
            <h4 style="font-size:0.95rem;">${steam.personaname || '—'}</h4>
            ${steam.realname ? `<p style="font-size:0.82rem;color:var(--text-secondary);">${steam.realname}</p>` : ''}
            <a href="${steam.profileurl || '#'}" target="_blank" style="font-size:0.78rem;color:var(--accent-hover);">View Steam Profile →</a>
          </div>
        </div>
        <div class="grid grid-3">
          <div><span style="font-size:0.75rem;color:var(--text-muted);display:block;">Steam ID</span><span style="font-size:0.82rem;">${steam.steamid}</span></div>
          <div><span style="font-size:0.75rem;color:var(--text-muted);display:block;">Status</span><span style="font-size:0.82rem;">${steam.personastate === 1 ? '🟢 Online' : steam.personastate === 0 ? '⚫ Offline' : '🟡 Away'}</span></div>
          <div><span style="font-size:0.75rem;color:var(--text-muted);display:block;">Playing</span><span style="font-size:0.82rem;">${steam.gameextrainfo || '—'}</span></div>
          <div><span style="font-size:0.75rem;color:var(--text-muted);display:block;">Location</span><span style="font-size:0.82rem;">${[steam.loccountrycode, steam.locstatecode].filter(Boolean).join(', ') || '—'}</span></div>
          <div><span style="font-size:0.75rem;color:var(--text-muted);display:block;">Account Created</span><span style="font-size:0.82rem;">${steam.timecreated ? new Date(steam.timecreated * 1000).toLocaleDateString() : '—'}</span></div>
          <div><span style="font-size:0.75rem;color:var(--text-muted);display:block;">Visibility</span><span style="font-size:0.82rem;">${steam.communityvisibilitystate === 3 ? 'Public' : 'Private'}</span></div>
        </div>
      </div>
      ` : ''}

      <!-- Group Blocks & Invites -->
      ${(groupBlocks && Array.isArray(groupBlocks) && groupBlocks.length > 0) || (groupInvited && Array.isArray(groupInvited) && groupInvited.length > 0) ? `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:12px;">Groups</h3>
        <div class="grid grid-2">
          ${groupBlocks && Array.isArray(groupBlocks) && groupBlocks.length > 0 ? `
            <div>
              <h4 style="margin-bottom:8px;font-size:0.82rem;color:var(--text-muted);">Blocked Groups (${groupBlocks.length})</h4>
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${groupBlocks.slice(0, 10).map(g => `<span class="badge badge-danger">${g.name || g.groupId || g}</span>`).join('')}
                ${groupBlocks.length > 10 ? `<span class="badge badge-info">+${groupBlocks.length - 10} more</span>` : ''}
              </div>
            </div>
          ` : ''}
          ${groupInvited && Array.isArray(groupInvited) && groupInvited.length > 0 ? `
            <div>
              <h4 style="margin-bottom:8px;font-size:0.82rem;color:var(--text-muted);">Pending Invites (${groupInvited.length})</h4>
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${groupInvited.slice(0, 10).map(g => `<span class="badge badge-info">${g.name || g.groupId || g}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Permissions -->
      ${permissions ? `
        <details style="margin-bottom:16px;">
          <summary style="cursor:pointer;color:var(--text-muted);font-size:0.85rem;padding:8px 0;">Assigned Permissions (${Array.isArray(permissions) ? permissions.length : 'N/A'})</summary>
          <div class="json-viewer" style="margin-top:8px;max-height:300px;">${JSON.stringify(permissions, null, 2)}</div>
        </details>
      ` : ''}

      <!-- Full JSON -->
      <details>
        <summary style="cursor:pointer;color:var(--text-muted);font-size:0.85rem;padding:8px 0;">Full Profile JSON</summary>
        <div class="json-viewer" style="margin-top:8px;">${JSON.stringify(user, null, 2)}</div>
      </details>
    `;
  } catch (err) {
    document.getElementById('profile-content').innerHTML = `
      <div class="alert alert-error">
        ${err.status === 401 ? 'You need to be logged in to view your profile. <a href="#login" style="color:var(--accent-hover);">Go to Login</a>' : `Error: ${err.message}`}
      </div>
    `;
  }
}
