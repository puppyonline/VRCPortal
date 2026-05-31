export async function renderNotifications(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>Notifications</h2>
      <p>View and manage your VRChat notifications</p>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div class="tabs" id="notif-tabs" style="margin-bottom:0;">
        <div class="tab active" data-tab="v2">Notifications</div>
        <div class="tab" data-tab="v1">Legacy (V1)</div>
      </div>
    </div>
    <div id="notif-results"><div class="loading"><div class="spinner"></div>Loading...</div></div>
  `;

  const loadTab = async (tab) => {
    const results = document.getElementById('notif-results');
    results.innerHTML = '<div class="loading"><div class="spinner"></div>Loading notifications...</div>';
    try {
      let notifications;
      if (tab === 'v1') {
        notifications = await api.getNotifications({ n: 100 });
      } else {
        notifications = await api.getNotificationsV2({ n: 100 });
      }

      if (!notifications || (Array.isArray(notifications) && notifications.length === 0)) {
        results.innerHTML = '<div class="empty-state"><div class="emoji">🔔</div><h3>No notifications</h3></div>';
        return;
      }

      const notifList = Array.isArray(notifications) ? notifications : [notifications];
      results.innerHTML = `
        <p style="color:var(--text-muted);margin-bottom:16px;">${notifList.length} notifications</p>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${notifList.map(n => tab === 'v2' ? renderV2Notification(n) : renderV1Notification(n)).join('')}
        </div>
      `;
      attachHandlers(results, api);
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">${err.status === 401 ? 'Login required. <a href="#login" style="color:var(--accent);">Login</a>' : err.message}</div>`;
    }
  };

  document.querySelectorAll('#notif-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#notif-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadTab(tab.dataset.tab);
    });
  });
  loadTab('v2');
}

function renderV2Notification(n) {
  const data = n.data || {};
  const type = n.type || '';
  const isEvent = type.includes('event');
  const isAnnouncement = type.includes('announcement');

  // Extract group info
  const groupId = data.groupId || data.ownerId || parseGroupFromLink(n.link);
  const groupName = data.groupName || data.ownerName || '';
  const eventTitle = data.title || data.announcementTitle || '';

  // Time formatting
  const time = n.createdAt ? timeAgo(n.createdAt) : '';
  const fullTime = n.createdAt ? new Date(n.createdAt).toLocaleString() : '';

  // Icon
  const icon = isEvent ? '📅' : isAnnouncement ? '📢' : '🔔';
  const categoryColor = isEvent ? 'var(--info)' : isAnnouncement ? 'var(--warning)' : 'var(--accent-hover)';

  return `
    <div class="card" style="padding:0;overflow:hidden;">
      <!-- Image banner if available -->
      ${n.imageUrl ? `<div style="height:80px;overflow:hidden;position:relative;">
        <img src="${n.imageUrl}" style="width:100%;height:100%;object-fit:cover;opacity:0.6;" onerror="this.parentElement.style.display='none'" />
        <div style="position:absolute;inset:0;background:linear-gradient(to top,var(--bg-card) 0%,transparent 100%);"></div>
      </div>` : ''}

      <div style="padding:16px;">
        <!-- Header: icon + group name + time -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
            <span style="font-size:1.3rem;flex-shrink:0;">${icon}</span>
            <div style="min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                ${groupName ? `<strong style="font-size:0.9rem;cursor:pointer;color:var(--accent-hover);" class="notif-group-link" data-groupid="${groupId}">${groupName}</strong>` : ''}
                <span class="badge" style="background:${categoryColor}20;color:${categoryColor};font-size:0.68rem;">${type.replace('group.', '')}</span>
              </div>
              ${eventTitle && eventTitle !== groupName ? `<div style="font-size:0.82rem;color:var(--text-primary);margin-top:2px;font-weight:500;">${eventTitle}</div>` : ''}
            </div>
          </div>
          <span style="font-size:0.72rem;color:var(--text-muted);white-space:nowrap;flex-shrink:0;" title="${fullTime}">${time}</span>
        </div>

        <!-- Message -->
        ${n.message ? `<p style="font-size:0.85rem;line-height:1.6;color:var(--text-secondary);margin-bottom:12px;white-space:pre-line;">${n.message}</p>` : ''}

        <!-- Action buttons -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${groupId ? `<button class="btn btn-sm btn-primary notif-group-btn" data-groupid="${groupId}">${n.linkText || 'View Group'}</button>` : ''}
          ${isEvent && n.link ? `<button class="btn btn-sm btn-secondary notif-event-btn" data-link="${n.link}">View Event</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderV1Notification(n) {
  const time = n.created_at ? timeAgo(n.created_at) : '';
  return `
    <div class="card" style="padding:14px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <span class="badge badge-info">${n.type || 'notification'}</span>
          <strong style="margin-left:8px;">${n.senderUsername || 'System'}</strong>
        </div>
        <span style="font-size:0.72rem;color:var(--text-muted);">${time}</span>
      </div>
      ${n.message ? `<p style="margin-top:8px;font-size:0.88rem;color:var(--text-secondary);">${n.message}</p>` : ''}
    </div>
  `;
}

function parseGroupFromLink(link) {
  if (!link) return null;
  // "group:grp_xxx" or "event:grp_xxx,cal_xxx"
  const match = link.match(/grp_[a-f0-9-]+/);
  return match ? match[0] : null;
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

function attachHandlers(container, api) {
  container.querySelectorAll('.notif-group-link, .notif-group-btn').forEach(el => {
    el.addEventListener('click', () => {
      const gid = el.dataset.groupid;
      if (gid) window.navigate('group-detail', gid);
    });
  });
}
