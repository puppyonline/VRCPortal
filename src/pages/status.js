const STATUS_BASE = window.electronAPI?.isElectron
  ? 'https://status.vrchat.com/api/v2'
  : '/statusapi/v2';

async function fetchStatus(endpoint) {
  const resp = await fetch(`${STATUS_BASE}/${endpoint}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

function statusColor(status) {
  switch (status) {
    case 'operational': return 'var(--success)';
    case 'degraded_performance': return 'var(--warning)';
    case 'partial_outage': return '#ff8c00';
    case 'major_outage': return 'var(--danger)';
    case 'under_maintenance': return 'var(--accent)';
    default: return 'var(--text-muted)';
  }
}

function statusLabel(status) {
  switch (status) {
    case 'operational': return 'Operational';
    case 'degraded_performance': return 'Degraded';
    case 'partial_outage': return 'Partial Outage';
    case 'major_outage': return 'Major Outage';
    case 'under_maintenance': return 'Maintenance';
    default: return status || 'Unknown';
  }
}

function impactColor(impact) {
  switch (impact) {
    case 'none': return 'var(--text-muted)';
    case 'minor': return 'var(--warning)';
    case 'major': return '#ff8c00';
    case 'critical': return 'var(--danger)';
    default: return 'var(--text-muted)';
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function renderStatus(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>🟢 VRChat Service Status</h2>
      <p>Live data from <a href="https://status.vrchat.com" target="_blank" style="color:var(--accent);">status.vrchat.com</a></p>
    </div>
    <div id="status-content"><div class="loading"><div class="spinner"></div>Loading status data...</div></div>
  `;

  try {
    const [summary, incidents] = await Promise.all([
      fetchStatus('summary.json'),
      fetchStatus('incidents.json'),
    ]);

    const overallStatus = summary.status;
    const components = summary.components || [];
    const recentIncidents = (incidents.incidents || []).slice(0, 10);

    // Group components
    const groups = components.filter(c => c.group === true);
    const children = components.filter(c => c.group === false);

    container.querySelector('#status-content').innerHTML = `
      <!-- Overall Status Banner -->
      <div class="status-banner" style="--banner-color: ${statusColor(overallStatus.indicator === 'none' ? 'operational' : overallStatus.indicator)}">
        <div class="status-banner-dot"></div>
        <div class="status-banner-text">
          <h3>${overallStatus.description || 'Unknown'}</h3>
          <p>Last updated: ${summary.page?.updated_at ? new Date(summary.page.updated_at).toLocaleString() : '—'}</p>
        </div>
      </div>

      <!-- Component Groups -->
      <div class="status-groups">
        ${groups.map(group => {
          const groupChildren = children.filter(c => c.group_id === group.id);
          const allOp = groupChildren.every(c => c.status === 'operational');
          return `
            <div class="status-group-card">
              <div class="status-group-header">
                <div class="status-group-title">
                  <span class="status-indicator" style="background:${statusColor(allOp ? 'operational' : 'degraded_performance')}"></span>
                  <h4>${group.name}</h4>
                </div>
                <span class="badge" style="background:${statusColor(allOp ? 'operational' : 'degraded_performance')}20;color:${statusColor(allOp ? 'operational' : 'degraded_performance')}">${allOp ? 'All Operational' : 'Issues Detected'}</span>
              </div>
              <div class="status-components">
                ${groupChildren.map(c => `
                  <div class="status-component">
                    <span class="status-component-name">${c.name}</span>
                    <span class="status-component-badge" style="color:${statusColor(c.status)}">
                      <span class="status-component-dot" style="background:${statusColor(c.status)}"></span>
                      ${statusLabel(c.status)}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Recent Incidents -->
      <div class="status-incidents-section">
        <h3 style="margin-bottom:16px;">Recent Incidents</h3>
        ${recentIncidents.length === 0 ? '<p style="color:var(--text-muted);">No recent incidents</p>' : ''}
        <div class="status-incidents-list">
          ${recentIncidents.map(inc => {
            const updates = inc.incident_updates || [];
            return `
              <div class="status-incident">
                <div class="status-incident-header">
                  <div>
                    <span class="status-incident-impact" style="background:${impactColor(inc.impact)}20;color:${impactColor(inc.impact)}">${inc.impact || 'none'}</span>
                    <strong>${inc.name}</strong>
                  </div>
                  <span class="status-incident-time">${timeAgo(inc.created_at)}</span>
                </div>
                <div class="status-incident-meta">
                  <span>${inc.status}</span>
                  <span>•</span>
                  <span>${new Date(inc.created_at).toLocaleDateString()}</span>
                  ${inc.resolved_at ? `<span>•</span><span>Resolved in ${Math.round((new Date(inc.resolved_at) - new Date(inc.started_at)) / 60000)}min</span>` : ''}
                </div>
                <div class="status-incident-timeline">
                  ${updates.slice(0, 4).map(u => `
                    <div class="status-timeline-entry">
                      <div class="status-timeline-dot" style="background:${u.status === 'resolved' ? 'var(--success)' : u.status === 'monitoring' ? 'var(--accent)' : u.status === 'identified' ? 'var(--warning)' : 'var(--text-muted)'}"></div>
                      <div class="status-timeline-content">
                        <span class="status-timeline-status">${u.status}</span>
                        <span class="status-timeline-time">${new Date(u.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        <p>${u.body || ''}</p>
                      </div>
                    </div>
                  `).join('')}
                  ${updates.length > 4 ? `<p style="font-size:0.8rem;color:var(--text-muted);padding-left:20px;">+ ${updates.length - 4} more updates</p>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Scheduled Maintenance -->
      ${summary.scheduled_maintenances?.length > 0 ? `
        <div class="status-incidents-section" style="margin-top:24px;">
          <h3 style="margin-bottom:16px;">Scheduled Maintenance</h3>
          ${summary.scheduled_maintenances.map(m => `
            <div class="status-incident">
              <div class="status-incident-header">
                <strong>${m.name}</strong>
                <span class="status-incident-time">${new Date(m.scheduled_for).toLocaleString()}</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  } catch (err) {
    container.querySelector('#status-content').innerHTML = `
      <div class="alert alert-error">Failed to load status data: ${err.message}</div>
      <p style="color:var(--text-muted);">You can check status directly at <a href="https://status.vrchat.com" target="_blank" style="color:var(--accent);">status.vrchat.com</a></p>
    `;
  }
}
