export async function renderFiles(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>📁 Files</h2>
      <p>Browse your uploaded files (avatars, worlds, icons)</p>
    </div>
    <div class="search-bar">
      <input type="text" id="file-search" class="form-control" placeholder="Filter by tag (e.g. icon, gallery)..." />
      <button class="btn btn-primary" id="file-load-btn">📂 Load Files</button>
    </div>
    <div id="files-results"><div class="empty-state"><div class="emoji">📁</div><h3>Click Load Files to browse</h3><p>Lists files associated with your account</p></div></div>
    <div class="card" id="file-detail-card" style="display:none;margin-top:16px;">
      <div class="card-header"><h3>File Details</h3><button class="btn btn-sm btn-secondary" id="close-file-detail">✕ Close</button></div>
      <div id="file-detail"></div>
    </div>
  `;

  const loadFiles = async () => {
    const results = document.getElementById('files-results');
    const tag = document.getElementById('file-search').value.trim();
    results.innerHTML = '<div class="loading"><div class="spinner"></div>Loading files...</div>';
    try {
      const params = { n: 50 };
      if (tag) params.tag = tag;
      const files = await api.getFiles(params);
      if (!files || files.length === 0) {
        results.innerHTML = '<div class="empty-state"><div class="emoji">📁</div><h3>No files found</h3></div>';
        return;
      }
      results.innerHTML = `
        <p style="color:var(--text-muted);margin-bottom:12px;">${files.length} files</p>
        <table>
          <thead><tr><th>Name</th><th>Extension</th><th>MIME</th><th>Size</th><th>Versions</th></tr></thead>
          <tbody>${files.map(f => `
            <tr style="cursor:pointer;" data-fileid="${f.id}">
              <td style="font-size:0.85rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name || f.id}</td>
              <td><span class="badge badge-info">${f.extension || '—'}</span></td>
              <td style="font-size:0.8rem;color:var(--text-muted);">${f.mimeType || '—'}</td>
              <td style="font-size:0.8rem;">${f.versions?.[f.versions.length-1]?.file?.sizeInBytes ? (f.versions[f.versions.length-1].file.sizeInBytes / 1024).toFixed(1) + ' KB' : '—'}</td>
              <td>${f.versions?.length || 0}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      `;
      results.querySelectorAll('tr[data-fileid]').forEach(row => {
        row.addEventListener('click', () => showFileDetail(row.dataset.fileid));
      });
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
    }
  };

  const showFileDetail = async (fileId) => {
    const card = document.getElementById('file-detail-card');
    const detail = document.getElementById('file-detail');
    card.style.display = 'block';
    detail.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const file = await api.getFile(fileId);
      detail.innerHTML = `
        <table style="margin-bottom:16px;">
          <tr><td style="color:var(--text-muted)">ID</td><td style="font-size:0.85rem;">${file.id}</td></tr>
          <tr><td style="color:var(--text-muted)">Name</td><td>${file.name}</td></tr>
          <tr><td style="color:var(--text-muted)">Owner</td><td style="font-size:0.85rem;">${file.ownerId}</td></tr>
          <tr><td style="color:var(--text-muted)">MIME Type</td><td>${file.mimeType}</td></tr>
          <tr><td style="color:var(--text-muted)">Extension</td><td>${file.extension}</td></tr>
          <tr><td style="color:var(--text-muted)">Versions</td><td>${file.versions?.length || 0}</td></tr>
        </table>
        <h4 style="margin-bottom:8px;">Raw JSON</h4>
        <div class="json-viewer">${JSON.stringify(file, null, 2)}</div>
      `;
    } catch (err) {
      detail.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
    }
  };

  document.getElementById('file-load-btn').addEventListener('click', loadFiles);
  document.getElementById('close-file-detail').addEventListener('click', () => {
    document.getElementById('file-detail-card').style.display = 'none';
  });
}
