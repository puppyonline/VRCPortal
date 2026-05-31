export async function renderProps(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>🧸 Props</h2>
      <p>Browse and manage your VRChat props</p>
    </div>
    <div class="card">
      <div class="card-header"><h3>My Props</h3><button class="btn btn-sm btn-primary" id="load-props-btn">🧸 Load Props</button></div>
      <div id="props-results"><div class="empty-state"><div class="emoji">🧸</div><h3>Click Load Props</h3><p>Lists props you've created or own</p></div></div>
    </div>
    <div class="card" id="prop-detail-card" style="display:none;margin-top:16px;">
      <div class="card-header"><h3>Prop Details</h3><button class="btn btn-sm btn-secondary" id="close-prop-detail">✕ Close</button></div>
      <div id="prop-detail"></div>
    </div>
  `;

  document.getElementById('load-props-btn').addEventListener('click', async () => {
    const results = document.getElementById('props-results');
    results.innerHTML = '<div class="loading"><div class="spinner"></div>Loading props...</div>';
    try {
      const props = await api.listProps({ n: 50 });
      if (!props || props.length === 0) {
        results.innerHTML = '<div class="empty-state"><div class="emoji">🧸</div><h3>No props found</h3></div>';
        return;
      }
      results.innerHTML = `
        <p style="color:var(--text-muted);margin-bottom:12px;">${props.length} props</p>
        <div class="grid grid-3">${props.map(p => `
          <div class="world-card" data-propid="${p.id}" style="cursor:pointer;">
            <img src="${p.thumbnailImageUrl || p.imageUrl || ''}" alt="${p.name}" style="height:120px;" onerror="this.style.background='var(--bg-tertiary)'" />
            <div class="world-info">
              <h4>${p.name || 'Unnamed Prop'}</h4>
              <p>${p.description || 'No description'}</p>
            </div>
            <div class="world-meta">
              <span>👤 ${p.authorName || '—'}</span>
              <span>📅 ${p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        `).join('')}</div>
      `;
      results.querySelectorAll('[data-propid]').forEach(card => {
        card.addEventListener('click', async () => {
          const detail = document.getElementById('prop-detail');
          const detailCard = document.getElementById('prop-detail-card');
          detailCard.style.display = 'block';
          detail.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
          try {
            const prop = await api.getProp(card.dataset.propid);
            detail.innerHTML = `
              <div class="detail-header">
                <img src="${prop.thumbnailImageUrl || prop.imageUrl || ''}" alt="${prop.name}" style="width:120px;height:120px;" onerror="this.style.display='none'" />
                <div class="detail-info">
                  <h2>${prop.name}</h2>
                  <p>by ${prop.authorName || 'Unknown'}</p>
                  <p style="font-size:0.85rem;color:var(--text-muted);">ID: ${prop.id}</p>
                </div>
              </div>
              ${prop.description ? `<p style="margin-bottom:16px;">${prop.description}</p>` : ''}
              <div class="grid grid-3" style="margin-bottom:16px;">
                <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${prop.releaseStatus || '—'}</div><div class="stat-label">Status</div></div>
                <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${prop.version || '—'}</div><div class="stat-label">Version</div></div>
                <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${prop.created_at ? new Date(prop.created_at).toLocaleDateString() : '—'}</div><div class="stat-label">Created</div></div>
              </div>
              <h4 style="margin-bottom:8px;">Tags</h4>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
                ${(prop.tags || []).map(t => `<span class="badge badge-info">${t}</span>`).join('') || '<span style="color:var(--text-muted)">No tags</span>'}
              </div>
              <div class="json-viewer">${JSON.stringify(prop, null, 2)}</div>
            `;
          } catch (err) { detail.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
        });
      });
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });

  document.getElementById('close-prop-detail').addEventListener('click', () => {
    document.getElementById('prop-detail-card').style.display = 'none';
  });
}
