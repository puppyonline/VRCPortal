export async function renderPrints(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>Prints</h2>
      <p>Your VRChat camera photos</p>
    </div>
    <div id="prints-gallery"><div class="loading"><div class="spinner"></div>Loading prints...</div></div>
    <div id="print-lightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:none;align-items:center;justify-content:center;cursor:pointer;padding:20px;">
      <img id="print-lightbox-img" style="max-width:90%;max-height:90%;border-radius:var(--radius-lg);object-fit:contain;" />
      <div id="print-lightbox-info" style="position:absolute;bottom:24px;left:50%;transform:translateX(-50%);text-align:center;color:white;"></div>
    </div>
  `;

  try {
    const prints = await api.getUserPrints({ n: 60 });
    const gallery = document.getElementById('prints-gallery');

    if (!prints || prints.length === 0) {
      gallery.innerHTML = '<div class="empty-state"><div class="emoji">📷</div><h3>No prints found</h3><p>Take photos in VRChat with the camera to see them here</p></div>';
      return;
    }

    gallery.innerHTML = `
      <p style="color:var(--text-muted);margin-bottom:16px;">${prints.length} prints</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;" id="prints-grid">
        ${prints.map((p, i) => {
          const img = p.files?.image || p.imageUrl || p.thumbnailImageUrl || '';
          const name = p.note || p.worldName || '';
          const date = p.createdAt || p.timestamp;
          return `
            <div class="print-thumb" data-idx="${i}" style="position:relative;border-radius:var(--radius);overflow:hidden;cursor:pointer;aspect-ratio:16/9;background:var(--bg-tertiary);">
              <img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover;transition:transform 0.2s;" onmouseenter="this.style.transform='scale(1.05)'" onmouseleave="this.style.transform='scale(1)'" onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:1.5rem;\\'>📷</div>'" />
              ${name ? `<div style="position:absolute;bottom:0;left:0;right:0;padding:6px 8px;background:linear-gradient(transparent,rgba(0,0,0,0.8));font-size:0.7rem;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Lightbox
    const lightbox = document.getElementById('print-lightbox');
    const lbImg = document.getElementById('print-lightbox-img');
    const lbInfo = document.getElementById('print-lightbox-info');

    gallery.querySelectorAll('.print-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.dataset.idx);
        const p = prints[idx];
        const img = p.files?.image || p.imageUrl || p.thumbnailImageUrl || '';
        lbImg.src = img;
        lbInfo.innerHTML = `
          <p style="font-size:0.9rem;font-weight:500;">${p.note || p.worldName || 'Print'}</p>
          ${p.worldName && p.note ? `<p style="font-size:0.78rem;opacity:0.7;">${p.worldName}</p>` : ''}
          <p style="font-size:0.72rem;opacity:0.5;margin-top:4px;">${p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</p>
        `;
        lightbox.style.display = 'flex';
      });
    });

    lightbox.addEventListener('click', () => { lightbox.style.display = 'none'; });

  } catch (err) {
    document.getElementById('prints-gallery').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}
