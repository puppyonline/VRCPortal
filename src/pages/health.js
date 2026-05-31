export async function renderHealth(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>💚 Health Check</h2>
      <p>Monitor VRChat API connectivity and response times</p>
    </div>
    <div class="grid grid-3" id="health-grid">
      <div class="card" id="health-status">
        <h3>API Reachable</h3>
        <div class="loading"><div class="spinner"></div>Checking...</div>
      </div>
      <div class="card" id="system-time">
        <h3>System Time</h3>
        <div class="loading"><div class="spinner"></div>Fetching...</div>
      </div>
      <div class="card" id="online-count">
        <h3>Online Users</h3>
        <div class="loading"><div class="spinner"></div>Counting...</div>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-header">
        <h3>Endpoint Status Tests</h3>
        <button class="btn btn-sm btn-primary" id="run-tests">▶ Run All Tests</button>
      </div>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px;">Tests only public endpoints that don't require authentication.</p>
      <div id="test-results"></div>
    </div>
  `;

  // Load health data
  try {
    const config = await api.getConfig();
    document.getElementById('health-status').innerHTML = `
      <h3>API Reachable</h3>
      <div style="margin-top:12px;font-size:2rem;text-align:center;">✅</div>
      <p style="text-align:center;margin-top:8px;color:var(--success)">API responding</p>
      <p style="text-align:center;font-size:0.8rem;color:var(--text-muted);">${config.buildVersionTag || ''}</p>
    `;
  } catch {
    document.getElementById('health-status').innerHTML = `
      <h3>API Reachable</h3>
      <div style="margin-top:12px;font-size:2rem;text-align:center;">⚠️</div>
      <p style="text-align:center;margin-top:8px;color:var(--warning)">Could not reach API</p>
    `;
  }

  try {
    const time = await api.getSystemTime();
    document.getElementById('system-time').innerHTML = `
      <h3>System Time</h3>
      <div style="margin-top:12px;text-align:center;">
        <div style="font-size:1.3rem;font-weight:600;">${new Date(time).toLocaleTimeString()}</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">${new Date(time).toLocaleDateString()}</div>
      </div>
    `;
  } catch {
    document.getElementById('system-time').innerHTML = `<h3>System Time</h3><p style="color:var(--text-muted);margin-top:12px;text-align:center;">Unavailable</p>`;
  }

  try {
    const count = await api.getOnlineUsers();
    document.getElementById('online-count').innerHTML = `
      <h3>Online Users</h3>
      <div style="margin-top:12px;text-align:center;">
        <div style="font-size:2rem;font-weight:700;color:var(--accent);">${(count || 0).toLocaleString()}</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">currently online</div>
      </div>
    `;
  } catch {
    document.getElementById('online-count').innerHTML = `<h3>Online Users</h3><p style="color:var(--text-muted);margin-top:12px;text-align:center;">Unavailable</p>`;
  }

  // Endpoint tests - only public endpoints
  document.getElementById('run-tests').addEventListener('click', async () => {
    const results = document.getElementById('test-results');
    const endpoints = [
      { name: 'GET /config', fn: () => api.getConfig() },
      { name: 'GET /time', fn: () => api.getSystemTime() },
      { name: 'GET /visits', fn: () => api.getOnlineUsers() },
      { name: 'GET /infoPush', fn: () => api.getInfoPush() },
      { name: 'GET /worlds?n=1', fn: () => api.searchWorlds({ n: 1, search: 'a' }) },
      { name: 'GET /users?n=1', fn: () => api.searchUsers('test', 1) },
    ];

    results.innerHTML = '<div class="loading"><div class="spinner"></div>Running tests...</div>';

    const testResults = [];
    for (const ep of endpoints) {
      const start = performance.now();
      try {
        await ep.fn();
        const ms = Math.round(performance.now() - start);
        testResults.push({ name: ep.name, status: 'ok', ms });
      } catch (err) {
        const ms = Math.round(performance.now() - start);
        testResults.push({ name: ep.name, status: 'error', ms, error: err.message || `HTTP ${err.status}` });
      }
    }

    results.innerHTML = `
      <table>
        <thead><tr><th>Endpoint</th><th>Status</th><th>Latency</th><th>Details</th></tr></thead>
        <tbody>
          ${testResults.map(r => `
            <tr>
              <td><code>${r.name}</code></td>
              <td><span class="badge ${r.status === 'ok' ? 'badge-success' : 'badge-danger'}">${r.status === 'ok' ? '✓ OK' : '✗ FAIL'}</span></td>
              <td>${r.ms}ms</td>
              <td style="font-size:0.8rem;color:var(--text-muted);">${r.error || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  });
}
