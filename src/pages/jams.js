export async function renderJams(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>🎵 Jams</h2>
      <p>View VRChat World Jams and submissions</p>
    </div>
    <div id="jams-results"><div class="loading"><div class="spinner"></div>Loading jams...</div></div>
    <div class="card" id="jam-detail-card" style="display:none;margin-top:16px;">
      <div class="card-header">
        <h3>Jam Details</h3>
        <button class="btn btn-sm btn-secondary" id="close-jam-detail">✕ Close</button>
      </div>
      <div id="jam-detail"></div>
    </div>
  `;

  try {
    const jams = await api.getJams();

    if (!jams || jams.length === 0) {
      document.getElementById('jams-results').innerHTML = '<div class="empty-state"><div class="emoji">🎵</div><h3>No jams available</h3></div>';
      return;
    }

    document.getElementById('jams-results').innerHTML = `
      <div class="grid grid-2">${jams.map(j => `
        <div class="card" style="cursor:pointer;" data-jamid="${j.id}" class="jam-card-item">
          <h4>${j.title || j.id}</h4>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin:8px 0;">${j.description || ''}</p>
          <div style="display:flex;gap:12px;font-size:0.8rem;color:var(--text-muted);">
            <span>📅 ${j.startDate ? new Date(j.startDate).toLocaleDateString() : '—'}</span>
            <span>→ ${j.endDate ? new Date(j.endDate).toLocaleDateString() : '—'}</span>
            <span>📝 ${j.submissionCount || 0} submissions</span>
          </div>
        </div>
      `).join('')}</div>
    `;

    // Click handlers
    document.querySelectorAll('[data-jamid]').forEach(card => {
      card.addEventListener('click', async () => {
        const jamId = card.dataset.jamid;
        const detailCard = document.getElementById('jam-detail-card');
        const detail = document.getElementById('jam-detail');
        detailCard.style.display = 'block';
        detail.innerHTML = '<div class="loading"><div class="spinner"></div>Loading jam details...</div>';

        try {
          const [jam, submissions] = await Promise.allSettled([
            api.getJam(jamId),
            api.getJamSubmissions(jamId),
          ]);

          let html = '';
          if (jam.status === 'fulfilled') {
            html += `
              <h3>${jam.value.title || jamId}</h3>
              <p style="margin:8px 0;">${jam.value.description || ''}</p>
              <div class="json-viewer" style="margin-bottom:16px;">${JSON.stringify(jam.value, null, 2)}</div>
            `;
          }
          if (submissions.status === 'fulfilled' && submissions.value?.length > 0) {
            html += `
              <h4 style="margin-bottom:8px;">Submissions (${submissions.value.length})</h4>
              <div class="grid grid-3">${submissions.value.slice(0, 12).map(s => `
                <div class="card" style="padding:12px;">
                  <h4 style="font-size:0.9rem;">${s.title || s.contentId || '—'}</h4>
                  <p style="font-size:0.8rem;color:var(--text-muted);">${s.description || ''}</p>
                </div>
              `).join('')}</div>
            `;
          }
          detail.innerHTML = html || '<p style="color:var(--text-muted)">No details available</p>';
        } catch (err) {
          detail.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
        }
      });
    });
  } catch (err) {
    document.getElementById('jams-results').innerHTML = `<div class="alert alert-error">Failed to load jams: ${err.message}</div>`;
  }

  document.getElementById('close-jam-detail')?.addEventListener('click', () => {
    document.getElementById('jam-detail-card').style.display = 'none';
  });
}
