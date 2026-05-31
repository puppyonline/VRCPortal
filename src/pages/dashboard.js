export async function renderDashboard(container, api) {
  container.innerHTML = `
    <div class="dash">
      <div class="dash-hero">
        <div class="dash-hero-bg"></div>
        <div class="dash-hero-content">
          <h1 class="dash-title">VRChat API Portal</h1>
          <p class="dash-subtitle">Real-time data from the VRChat ecosystem</p>
        </div>
      </div>

      <div class="dash-stats">
        <div class="dash-stat-card dash-stat-users">
          <div class="dash-stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="dash-stat-body">
            <div class="dash-stat-value" id="stat-online"><span class="dash-pulse"></span></div>
            <div class="dash-stat-label">Players Online</div>
          </div>
        </div>

        <div class="dash-stat-card dash-stat-status">
          <div class="dash-stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="dash-stat-body">
            <div class="dash-stat-value" id="stat-status"><span class="dash-pulse"></span></div>
            <div class="dash-stat-label">API Status</div>
          </div>
        </div>

        <div class="dash-stat-card dash-stat-time">
          <div class="dash-stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="dash-stat-body">
            <div class="dash-stat-value" id="stat-time"><span class="dash-pulse"></span></div>
            <div class="dash-stat-label">Server Time</div>
          </div>
        </div>

        <div class="dash-stat-card dash-stat-version">
          <div class="dash-stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <div class="dash-stat-body">
            <div class="dash-stat-value" id="stat-version"><span class="dash-pulse"></span></div>
            <div class="dash-stat-label">Build Version</div>
          </div>
        </div>
      </div>

      <!-- Personalized section (shown when authenticated) -->
      <div id="dash-personal" style="display:none;margin-bottom:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
          <div class="card" style="padding:16px;">
            <h4 style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">Your Friends</h4>
            <div id="dash-friends-stat" style="font-size:1.4rem;font-weight:700;color:var(--success);">—</div>
            <p style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">online now</p>
          </div>
          <div class="card" style="padding:16px;">
            <h4 style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">Your Groups</h4>
            <div id="dash-groups-stat" style="font-size:1.4rem;font-weight:700;color:var(--accent-hover);">—</div>
            <p style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">joined</p>
          </div>
          <div class="card" style="padding:16px;">
            <h4 style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">Notifications</h4>
            <div id="dash-notif-stat" style="font-size:1.4rem;font-weight:700;color:var(--warning);">—</div>
            <p style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">unread</p>
          </div>
        </div>
      </div>

      <div class="dash-grid">
        <div class="dash-card dash-card-explore">
          <div class="dash-card-header">
            <h3>Explore</h3>
            <span class="dash-card-badge">Quick Access</span>
          </div>
          <div class="dash-explore-grid">
            <a href="#users" class="dash-explore-item" onclick="navigate('users');return false;">
              <div class="dash-explore-icon" style="--icon-color: #667eea;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <span>Users</span>
            </a>
            <a href="#worlds" class="dash-explore-item" onclick="navigate('worlds');return false;">
              <div class="dash-explore-icon" style="--icon-color: #f093fb;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <span>Worlds</span>
            </a>
            <a href="#groups" class="dash-explore-item" onclick="navigate('groups');return false;">
              <div class="dash-explore-icon" style="--icon-color: #4facfe;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <span>Groups</span>
            </a>
            <a href="#config" class="dash-explore-item" onclick="navigate('config');return false;">
              <div class="dash-explore-icon" style="--icon-color: #43e97b;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <span>Config</span>
            </a>
            <a href="#health" class="dash-explore-item" onclick="navigate('health');return false;">
              <div class="dash-explore-icon" style="--icon-color: #fa709a;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <span>Health</span>
            </a>
            <a href="https://vrchat.community" target="_blank" class="dash-explore-item">
              <div class="dash-explore-icon" style="--icon-color: #a18cd1;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <span>Docs ↗</span>
            </a>
          </div>
        </div>

        <div class="dash-card dash-card-announcements">
          <div class="dash-card-header">
            <h3>Announcements</h3>
            <span class="dash-card-badge">Live</span>
          </div>
          <div id="dash-announcements" class="dash-announcements-list">
            <div class="dash-loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>

      <div class="dash-footer">
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px 24px;margin-bottom:20px;text-align:left;">
          <h4 style="font-size:0.88rem;margin-bottom:8px;color:var(--warning);">⚠️ VRChat API Usage Disclaimer</h4>
          <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.6;margin-bottom:8px;">VRChat does not officially document or support their API for public use. This portal uses the <a href="https://vrchat.community" target="_blank" style="color:var(--accent-hover);">community-maintained documentation</a> and may break without notice. Use responsibly.</p>
          <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:0.72rem;color:var(--text-muted);">
            <span>✓ No credentials stored</span>
            <span>✓ Rate limited with backoff</span>
            <span>✓ User-Agent: VRChatPortal/1.0.0 ${localStorage.getItem('vrchat_portal_contact_email') || '(not set)'}</span>
            <span>✓ No automated polling</span>
            <span>✓ Responses cached where appropriate</span>
            <span>✓ Content upload disabled</span>
          </div>
          <p style="font-size:0.72rem;color:var(--text-muted);margin-top:8px;">Full guidelines: <a href="https://hello.vrchat.com/creator-guidelines#api-usage" target="_blank" style="color:var(--accent-hover);">hello.vrchat.com/creator-guidelines</a></p>
        </div>
        <p>Data sourced from the <a href="https://vrchat.community" target="_blank">VRChat Community API</a> — unofficial and community-maintained</p>
      </div>
    </div>
  `;

  // Fetch all data
  const [onlineResult, configResult, timeResult] = await Promise.allSettled([
    api.getOnlineUsers(),
    api.getConfig(),
    api.getSystemTime(),
  ]);

  // Animate in online users
  const statOnline = document.getElementById('stat-online');
  if (onlineResult.status === 'fulfilled' && onlineResult.value) {
    const count = Number(onlineResult.value);
    animateNumber(statOnline, count);
  } else {
    statOnline.textContent = '—';
  }

  // API Status
  const statStatus = document.getElementById('stat-status');
  if (configResult.status === 'fulfilled') {
    statStatus.innerHTML = '<span class="dash-status-dot dash-status-live"></span>Operational';
  } else {
    statStatus.innerHTML = '<span class="dash-status-dot dash-status-down"></span>Unreachable';
  }

  // Time
  const statTime = document.getElementById('stat-time');
  if (timeResult.status === 'fulfilled' && timeResult.value) {
    statTime.textContent = new Date(timeResult.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } else {
    statTime.textContent = '—';
  }

  // Version
  const statVersion = document.getElementById('stat-version');
  if (configResult.status === 'fulfilled' && configResult.value) {
    statVersion.textContent = configResult.value.buildVersionTag || '—';
  } else {
    statVersion.textContent = '—';
  }

  // Announcements
  const announcementsEl = document.getElementById('dash-announcements');
  if (configResult.status === 'fulfilled' && configResult.value) {
    const announcements = configResult.value.announcements || [];
    if (announcements.length > 0) {
      announcementsEl.innerHTML = announcements.map((a, i) => `
        <div class="dash-announcement" style="animation-delay: ${i * 0.1}s">
          <div class="dash-announcement-dot"></div>
          <div class="dash-announcement-content">
            <strong>${a.title || 'Notice'}</strong>
            <p>${a.text || ''}</p>
          </div>
        </div>
      `).join('');
    } else {
      announcementsEl.innerHTML = '<div class="dash-empty"><p>No active announcements</p></div>';
    }
  } else {
    announcementsEl.innerHTML = '<div class="dash-empty"><p>Could not load announcements</p></div>';
  }

  // Personalized section (if authenticated)
  if (api.currentUser) {
    const personalEl = document.getElementById('dash-personal');
    personalEl.style.display = 'block';

    // Friends online count
    const friendsStat = document.getElementById('dash-friends-stat');
    friendsStat.textContent = (api.currentUser.onlineFriends?.length || 0).toString();

    // Groups count + notifications (fetch in background)
    Promise.allSettled([
      api.getUserGroups(api.currentUser.id),
      api.getNotificationsV2({ n: 100 }),
    ]).then(([groupsRes, notifsRes]) => {
      const groupsStat = document.getElementById('dash-groups-stat');
      const notifStat = document.getElementById('dash-notif-stat');
      if (groupsRes.status === 'fulfilled' && groupsRes.value) {
        groupsStat.textContent = groupsRes.value.length.toString();
      }
      if (notifsRes.status === 'fulfilled' && notifsRes.value) {
        const unseen = Array.isArray(notifsRes.value) ? notifsRes.value.filter(n => !n.seen).length : 0;
        notifStat.textContent = unseen.toString();
      }
    });
  }
}

function animateNumber(el, target) {
  const duration = 1200;
  const start = performance.now();
  const format = (n) => n.toLocaleString();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(eased * target);
    el.textContent = format(current);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
