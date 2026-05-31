export async function renderConfig(container, api) {
  const currentEmail = localStorage.getItem('vrchat_portal_contact_email') || '';

  container.innerHTML = `
    <div class="page-header">
      <h2>API Configuration</h2>
      <p>Live configuration data from the VRChat API and portal settings</p>
    </div>

    <!-- Portal Settings -->
    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-bottom:12px;">Portal Settings</h3>
      <div class="form-group">
        <label>User-Agent Contact Email</label>
        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">Required by VRChat's Creator Guidelines. Sent as part of the User-Agent header with every request.</p>
        <div style="display:flex;gap:8px;">
          <input type="email" id="ua-email" class="form-control" value="${currentEmail}" placeholder="you@example.com" />
          <button class="btn btn-primary btn-sm" id="ua-save">Save</button>
        </div>
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">Current User-Agent: <code style="background:var(--bg-primary);padding:2px 6px;border-radius:3px;">VRChatPortal/1.0.0 ${currentEmail || '(not set)'}</code></p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>VRChat Remote Config</h3>
        <button class="btn btn-sm btn-secondary" id="refresh-config">Refresh</button>
      </div>
      <div id="config-content"><div class="loading"><div class="spinner"></div>Loading configuration...</div></div>
    </div>
  `;

  document.getElementById('ua-save').addEventListener('click', () => {
    const email = document.getElementById('ua-email').value.trim();
    if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return; }
    localStorage.setItem('vrchat_portal_contact_email', email);
    renderConfig(container, api);
  });

  const loadConfig = async () => {
    const content = document.getElementById('config-content');
    try {
      const c = await api.getConfig();
      content.innerHTML = renderConfigSections(c);
      // If authenticated, resolve world/avatar IDs into info cards
      if (api.currentUser) {
        resolveConfigIds(api);
      }
    } catch (err) {
      content.innerHTML = `<div class="alert alert-error">Failed to load config: ${err.message}</div>`;
    }
  };

  document.getElementById('refresh-config').addEventListener('click', () => {
    api.clearCache();
    loadConfig();
  });
  loadConfig();
}

function renderConfigSections(c) {
  return `
    <!-- Overview Stats -->
    <div class="grid grid-4" style="margin-bottom:20px;">
      <div class="stat-card"><div class="stat-value" style="font-size:0.85rem;">${c.buildVersionTag || '---'}</div><div class="stat-label">Build Version</div></div>
      <div class="stat-card"><div class="stat-value" style="font-size:0.85rem;">${c.sdkUnityVersion || '---'}</div><div class="stat-label">Unity Version</div></div>
      <div class="stat-card"><div class="stat-value" style="font-size:0.85rem;">${c.currentTOSVersion || '---'}</div><div class="stat-label">TOS Version</div></div>
      <div class="stat-card"><div class="stat-value" style="font-size:0.85rem;">${c.currentPrivacyVersion || '---'}</div><div class="stat-label">Privacy Version</div></div>
    </div>

    <!-- Announcements -->
    ${(c.announcements && c.announcements.length > 0) ? `
      <div style="margin-bottom:20px;">
        <h4 style="margin-bottom:10px;">Announcements</h4>
        ${c.announcements.map(a => `<div class="alert alert-info"><strong>${a.title || 'Notice'}</strong><br/>${a.text || ''}</div>`).join('')}
      </div>
    ` : ''}

    <!-- SDK & Downloads -->
    ${renderSection('SDK & Downloads', `
      <table>
        <tr><td style="color:var(--text-muted);width:180px;">SDK Unity Version</td><td>${c.sdkUnityVersion || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Dev SDK Version</td><td>${c.devSdkVersion || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Min Unity for Uploads</td><td>${c.minimumUnityVersionForUploads || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Dev SDK URL</td><td><a href="${c.devSdkUrl || '#'}" target="_blank" style="color:var(--accent-hover);font-size:0.82rem;">${c.devSdkUrl || '---'}</a></td></tr>
      </table>
      ${c.downloadUrls ? `
        <h4 style="margin:16px 0 8px;font-size:0.85rem;">Download URLs</h4>
        <table>
          ${Object.entries(c.downloadUrls).map(([k, v]) => `<tr><td style="color:var(--text-muted);width:140px;">${k}</td><td style="word-break:break-all;font-size:0.78rem;"><a href="${v}" target="_blank" style="color:var(--accent-hover);">${v}</a></td></tr>`).join('')}
        </table>
      ` : ''}
    `)}

    <!-- API Keys & IDs -->
    ${renderSection('API Keys & Identifiers', `
      <table>
        <tr><td style="color:var(--text-muted);width:180px;">Client API Key</td><td><code style="font-size:0.78rem;">${c.clientApiKey || '---'}</code></td></tr>
        <tr><td style="color:var(--text-muted)">Google API Client ID</td><td style="font-size:0.75rem;word-break:break-all;">${c.googleApiClientId || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Home World</td><td><span class="config-world-id" data-id="${c.homeWorldId || ''}">${c.homeWorldId || '---'}</span></td></tr>
        <tr><td style="color:var(--text-muted)">Hub World</td><td><span class="config-world-id" data-id="${c.hubWorldId || ''}">${c.hubWorldId || '---'}</span></td></tr>
        <tr><td style="color:var(--text-muted)">Tutorial World</td><td><span class="config-world-id" data-id="${c.tutorialWorldId || ''}">${c.tutorialWorldId || '---'}</span></td></tr>
        <tr><td style="color:var(--text-muted)">Timeout World</td><td><span class="config-world-id" data-id="${c.timeOutWorldId || ''}">${c.timeOutWorldId || '---'}</span></td></tr>
        <tr><td style="color:var(--text-muted)">Default Avatar</td><td><span class="config-avatar-id" data-id="${c.defaultAvatar || ''}">${c.defaultAvatar || '---'}</span></td></tr>
      </table>
    `)}

    <!-- Contact & Legal -->
    ${renderSection('Contact & Legal', `
      <table>
        <tr><td style="color:var(--text-muted);width:180px;">Contact Email</td><td>${c.contactEmail || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Support Email</td><td>${c.supportEmail || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Moderation Email</td><td>${c.moderationEmail || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Copyright Email</td><td>${c.copyrightEmail || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Jobs Email</td><td>${c.jobsEmail || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Address</td><td>${c.address || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Homepage</td><td><a href="${c.homepageRedirectTarget || '#'}" target="_blank" style="color:var(--accent-hover);">${c.homepageRedirectTarget || '---'}</a></td></tr>
      </table>
    `)}

    <!-- Networking -->
    <details style="margin-bottom:20px;">
      <summary style="cursor:pointer;font-size:0.95rem;font-weight:600;padding:12px 0;border-bottom:1px solid var(--border);color:var(--text-primary);">Networking & Client <span style="font-size:0.75rem;color:var(--text-muted);font-weight:400;margin-left:8px;">nerd stuff</span></summary>
      <div style="padding-top:12px;">
      <div class="grid grid-3" style="margin-bottom:12px;">
        <div style="padding:10px;background:var(--bg-primary);border-radius:var(--radius-sm);border:1px solid var(--border);text-align:center;"><div style="font-size:1rem;font-weight:600;">${c.updateRateMsNormal || '---'}ms</div><div style="font-size:0.72rem;color:var(--text-muted);">Update Rate</div></div>
        <div style="padding:10px;background:var(--bg-primary);border-radius:var(--radius-sm);border:1px solid var(--border);text-align:center;"><div style="font-size:1rem;font-weight:600;">${c.updateRateMsMinimum || '---'}ms</div><div style="font-size:0.72rem;color:var(--text-muted);">Min Update Rate</div></div>
        <div style="padding:10px;background:var(--bg-primary);border-radius:var(--radius-sm);border:1px solid var(--border);text-align:center;"><div style="font-size:1rem;font-weight:600;">${c.updateRateMsMaximum || '---'}ms</div><div style="font-size:0.72rem;color:var(--text-muted);">Max Update Rate</div></div>
      </div>
      <table>
        <tr><td style="color:var(--text-muted);width:220px;">Client BPS Ceiling</td><td>${c.clientBPSCeiling || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Reserved Player BPS</td><td>${c.clientReservedPlayerBPS || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Disconnect Timeout</td><td>${c.clientDisconnectTimeout ? c.clientDisconnectTimeout + 'ms' : '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Max Datagrams</td><td>${c.clientMaxDatagrams || '---'}</td></tr>
        <tr><td style="color:var(--text-muted)">Net Dispatch Thread</td><td>${c.clientNetDispatchThread ? 'Yes' : 'No'}</td></tr>
        <tr><td style="color:var(--text-muted)">Websocket Reconnect Max Delay</td><td>${c.websocketReconnectMaxDelay || '---'}s</td></tr>
        <tr><td style="color:var(--text-muted)">Websocket Friends Refresh</td><td>${c.websocketMaxFriendsRefreshDelay || '---'}s</td></tr>
        <tr><td style="color:var(--text-muted)">Disable Steam Networking</td><td>${c.disableSteamNetworking ? 'Yes' : 'No'}</td></tr>
      </table>
      </div>

    <!-- Audio Config -->
    ${c.audioConfig ? renderSection('Audio Configuration', `
      <div class="grid grid-3">
        ${Object.entries(c.audioConfig).map(([k, v]) => `
          <div style="padding:8px 12px;background:var(--bg-primary);border-radius:var(--radius-sm);border:1px solid var(--border);">
            <div style="font-size:0.75rem;color:var(--text-muted);">${k}</div>
            <div style="font-size:0.88rem;font-weight:500;margin-top:2px;">${v}</div>
          </div>
        `).join('')}
      </div>
    `) : ''}

    <!-- Languages -->
    ${renderSection('Available Languages', `
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
        ${(c.availableLanguages || []).map(l => `<span style="padding:4px 10px;background:var(--bg-primary);border:1px solid var(--border);border-radius:16px;font-size:0.75rem;">${l}</span>`).join('')}
      </div>
      <p style="font-size:0.78rem;color:var(--text-muted);">Language codes: ${(c.availableLanguageCodes || []).join(', ')}</p>
    `)}

    <!-- Constants -->
    ${c.constants ? renderSection('Constants', `
      <div class="grid grid-2">
        ${c.constants.GROUPS ? `
          <div>
            <h4 style="font-size:0.85rem;margin-bottom:8px;">Groups</h4>
            <table>
              <tr><td style="color:var(--text-muted)">Max Capacity</td><td>${c.constants.GROUPS.CAPACITY?.toLocaleString()}</td></tr>
              <tr><td style="color:var(--text-muted)">Max Joined</td><td>${c.constants.GROUPS.MAX_JOINED}</td></tr>
              <tr><td style="color:var(--text-muted)">Max Joined (Plus)</td><td>${c.constants.GROUPS.MAX_JOINED_PLUS}</td></tr>
              <tr><td style="color:var(--text-muted)">Max Owned</td><td>${c.constants.GROUPS.MAX_OWNED}</td></tr>
              <tr><td style="color:var(--text-muted)">Max Roles</td><td>${c.constants.GROUPS.MAX_ROLES}</td></tr>
              <tr><td style="color:var(--text-muted)">Max Management Roles</td><td>${c.constants.GROUPS.MAX_MANAGEMENT_ROLES}</td></tr>
              <tr><td style="color:var(--text-muted)">Max Languages</td><td>${c.constants.GROUPS.MAX_LANGUAGES}</td></tr>
              <tr><td style="color:var(--text-muted)">Max Links</td><td>${c.constants.GROUPS.MAX_LINKS}</td></tr>
            </table>
          </div>
        ` : ''}
        ${c.constants.INSTANCE ? `
          <div>
            <h4 style="font-size:0.85rem;margin-bottom:8px;">Instance Population</h4>
            <table>
              ${Object.entries(c.constants.INSTANCE.POPULATION_BRACKETS || {}).map(([k, v]) => `
                <tr><td style="color:var(--text-muted)">${k}</td><td>${v.min} - ${v.max} players</td></tr>
              `).join('')}
            </table>
          </div>
        ` : ''}
      </div>
    `) : ''}

    <!-- Dynamic World Rows -->
    ${c.dynamicWorldRows ? renderSection('Dynamic World Rows', `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
        ${c.dynamicWorldRows.map(r => `
          <div style="padding:10px 14px;background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-sm);">
            <div style="font-size:0.85rem;font-weight:600;">${r.name}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Sort: ${r.sortHeading} (${r.sortOrder})</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">Platform: ${r.platform}</div>
            ${r.tag ? `<div style="margin-top:4px;"><span class="badge badge-info" style="font-size:0.65rem;">${r.tag}</span></div>` : ''}
          </div>
        `).join('')}
      </div>
    `) : ''}

    <!-- Feature Flags -->
    ${renderSection('Feature Flags', `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px;">
        ${renderFlag('Registration', !c.disableRegistration)}
        ${renderFlag('Two-Factor Auth', !c.disableTwoFactorAuth)}
        ${renderFlag('Community Labs', !c.disableCommunityLabs)}
        ${renderFlag('Udon', !c.disableUdon)}
        ${renderFlag('Event Stream', !c.disableEventStream)}
        ${renderFlag('Avatar Copying', !c.disableAvatarCopying)}
        ${renderFlag('Avatar Gating', !c.disableAvatarGating)}
        ${renderFlag('Feedback Gating', !c.disableFeedbackGating)}
        ${renderFlag('Oculus Subs', !c.disableOculusSubs)}
        ${renderFlag('Gift Drops', !c.disableGiftDrops)}
        ${renderFlag('Captcha', !c.disableCaptcha)}
        ${renderFlag('Steam Networking', !c.disableSteamNetworking)}
        ${renderFlag('Frontend Builds', !c.disableFrontendBuilds)}
        ${renderFlag('Email', !c.disableEmail)}
        ${renderFlag('Upgrade Account', !c.disableUpgradeAccount)}
      </div>
    `)}

    <!-- Allowed URL Lists -->
    ${c.urlList ? renderSection('Allowed Video/Stream URLs (' + c.urlList.length + ')', `
      <div style="display:flex;flex-wrap:wrap;gap:4px;max-height:200px;overflow-y:auto;">
        ${c.urlList.map(u => `<span style="padding:3px 8px;background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;font-size:0.7rem;color:var(--text-secondary);">${u}</span>`).join('')}
      </div>
    `) : ''}

    ${c.imageHostUrlList ? renderSection('Allowed Image Hosts (' + c.imageHostUrlList.length + ')', `
      <div style="display:flex;flex-wrap:wrap;gap:4px;max-height:200px;overflow-y:auto;">
        ${c.imageHostUrlList.map(u => `<span style="padding:3px 8px;background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;font-size:0.7rem;color:var(--text-secondary);">${u}</span>`).join('')}
      </div>
    `) : ''}

    ${c.stringHostUrlList ? renderSection('Allowed String Hosts (' + c.stringHostUrlList.length + ')', `
      <div style="display:flex;flex-wrap:wrap;gap:4px;max-height:200px;overflow-y:auto;">
        ${c.stringHostUrlList.map(u => `<span style="padding:3px 8px;background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;font-size:0.7rem;color:var(--text-secondary);">${u}</span>`).join('')}
      </div>
    `) : ''}

    <!-- Report Categories -->
    ${c.reportCategories ? renderSection('Report Categories', `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px;">
        ${Object.entries(c.reportCategories).sort((a,b) => a[1].order - b[1].order).map(([k, v]) => `
          <div style="padding:8px 12px;background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-sm);">
            <div style="font-size:0.82rem;font-weight:500;">${v.text}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">${v.tooltip || ''}</div>
          </div>
        `).join('')}
      </div>
    `) : ''}

    <!-- Full JSON -->
    </details>

    <details style="margin-top:20px;">
      <summary style="cursor:pointer;color:var(--text-muted);font-size:0.85rem;padding:8px 0;">View Full Raw JSON</summary>
      <div class="json-viewer" style="margin-top:8px;">${JSON.stringify(c, null, 2)}</div>
    </details>
  `;
}

function renderSection(title, content) {
  return `
    <div style="margin-bottom:20px;">
      <h4 style="font-size:0.95rem;font-weight:600;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);">${title}</h4>
      ${content}
    </div>
  `;
}

function renderFlag(name, enabled) {
  return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-sm);">
    <span style="width:8px;height:8px;border-radius:50%;background:${enabled ? 'var(--success)' : 'var(--danger)'};flex-shrink:0;"></span>
    <span style="font-size:0.8rem;">${name}</span>
  </div>`;
}

async function resolveConfigIds(api) {
  // Resolve world IDs
  const worldEls = document.querySelectorAll('.config-world-id[data-id]');
  for (const el of worldEls) {
    const id = el.dataset.id;
    if (!id || !id.startsWith('wrld_')) continue;
    try {
      const world = await api.getWorld(id);
      el.innerHTML = `
        <div style="display:flex;gap:10px;align-items:center;padding:8px 12px;background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;margin:4px 0;" onclick="window.navigate('world-detail','${id}')">
          <img src="${world.thumbnailImageUrl || world.imageUrl || ''}" style="width:56px;height:36px;border-radius:4px;object-fit:cover;background:var(--bg-tertiary);flex-shrink:0;" onerror="this.style.display='none'" />
          <div style="min-width:0;">
            <div style="font-size:0.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${world.name}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">by ${world.authorName || '?'} &middot; ${(world.occupants || 0)} online &middot; ${(world.favorites || 0).toLocaleString()} favs</div>
          </div>
        </div>
      `;
    } catch {
      // Leave as plain ID
    }
  }

  // Resolve avatar IDs
  const avatarEls = document.querySelectorAll('.config-avatar-id[data-id]');
  for (const el of avatarEls) {
    const id = el.dataset.id;
    if (!id || !id.startsWith('avtr_')) continue;
    try {
      const avatar = await api.getAvatar(id);
      el.innerHTML = `
        <div style="display:flex;gap:10px;align-items:center;padding:8px 12px;background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-sm);margin:4px 0;">
          <img src="${avatar.thumbnailImageUrl || avatar.imageUrl || ''}" style="width:36px;height:36px;border-radius:4px;object-fit:cover;background:var(--bg-tertiary);flex-shrink:0;" onerror="this.style.display='none'" />
          <div style="min-width:0;">
            <div style="font-size:0.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${avatar.name}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">by ${avatar.authorName || '?'} &middot; ${avatar.releaseStatus || '?'}</div>
          </div>
        </div>
      `;
    } catch {
      // Leave as plain ID
    }
  }
}
