export async function renderModeration(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>Player Moderation</h2>
      <p>View your player moderation actions (blocks, mutes, etc.)</p>
    </div>
    <div class="alert alert-info">This page is read-only. Moderation data is private and only shows your own actions.</div>
    <div class="card">
      <div class="card-header"><h3>My Moderations</h3><button class="btn btn-sm btn-primary" id="load-mods-btn">Load</button></div>
      <div id="mod-results"><p style="color:var(--text-muted);">Click Load to fetch your moderation list.</p></div>
    </div>
  `;

  document.getElementById('load-mods-btn').addEventListener('click', async () => {
    const results = document.getElementById('mod-results');
    results.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const mods = await api.getPlayerModerations();
      if (!mods || mods.length === 0) {
        results.innerHTML = '<p style="color:var(--text-muted);">No moderation actions.</p>';
        return;
      }
      results.innerHTML = `
        <p style="color:var(--text-muted);margin-bottom:8px;">${mods.length} actions</p>
        <div style="max-height:500px;overflow-y:auto;">
          <table>
            <thead><tr><th>Type</th><th>Target</th><th>Created</th></tr></thead>
            <tbody>${mods.map(m => `
              <tr>
                <td><span class="badge ${m.type === 'block' ? 'badge-danger' : m.type === 'mute' ? 'badge-warning' : 'badge-info'}">${m.type || '—'}</span></td>
                <td style="font-size:0.8rem;">${m.targetDisplayName || m.targetUserId || '—'}</td>
                <td style="font-size:0.8rem;color:var(--text-muted);">${m.created ? new Date(m.created).toLocaleDateString() : '—'}</td>
              </tr>
            `).join('')}</tbody>
          </table>
        </div>
      `;
    } catch (err) { results.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
  });
}
