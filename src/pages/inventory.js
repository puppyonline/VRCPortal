const ITEM_TYPES = [
  { id: 'all', label: 'All Items', icon: '🎒' },
  { id: 'sticker', label: 'Stickers', icon: '🏷️' },
  { id: 'emoji', label: 'Emojis', icon: '😀' },
  { id: 'prop', label: 'Props', icon: '🧸' },
  { id: 'droneskin', label: 'Drone Skins', icon: '🛸' },
  { id: 'portalskin', label: 'Portal Skins', icon: '🌀' },
  { id: 'warpeffect', label: 'Warp Effects', icon: '✨' },
  { id: 'bundle', label: 'Bundles', icon: '📦' },
];

export async function renderInventory(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>🎒 Inventory</h2>
      <p>Browse your stickers, emojis, props, skins, and more</p>
    </div>
    <div class="tabs" id="inv-tabs" style="flex-wrap:wrap;">
      ${ITEM_TYPES.map((t, i) => `<div class="tab ${i === 0 ? 'active' : ''}" data-tab="${t.id}">${t.icon} ${t.label}</div>`).join('')}
      <div class="tab" data-tab="collections">📂 Collections</div>
      <div class="tab" data-tab="drops">🎁 Drops</div>
    </div>
    <div id="inv-controls" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
      <select id="inv-sort" class="form-control" style="max-width:160px;">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="newest_created">Newest Created</option>
        <option value="oldest_created">Oldest Created</option>
      </select>
      <input type="text" id="inv-tag-filter" class="form-control" style="max-width:200px;" placeholder="Filter by tag..." />
      <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary);cursor:pointer;">
        <input type="checkbox" id="inv-archived" /> Show Archived
      </label>
      <span id="inv-tag-chips" style="display:flex;gap:4px;flex-wrap:wrap;"></span>
    </div>
    <div id="inv-results"><div class="loading"><div class="spinner"></div>Loading...</div></div>
  `;

  let currentTab = 'all';
  let allTags = new Set();

  function renderItemGrid(items) {
    if (!items || items.length === 0) return '<div class="empty-state"><div class="emoji">🎒</div><h3>No items</h3></div>';

    // Collect all tags for the chip display
    items.forEach(item => (item.tags || []).forEach(t => allTags.add(t)));
    updateTagChips();

    return `
      <p style="color:var(--text-muted);margin-bottom:12px;">${items.length} items</p>
      <div class="grid grid-3">${items.map(item => {
        const img = item.imageUrl || item.metadata?.imageUrl || '';
        const typeIcon = ITEM_TYPES.find(t => t.id === item.itemType)?.icon || '📦';
        const tagHtml = (item.tags || []).slice(0, 4).map(t => `<span style="font-size:0.62rem;color:var(--text-muted);background:var(--bg-tertiary);padding:1px 5px;border-radius:4px;">${t}</span>`).join('');
        const collHtml = (item.collections || []).slice(0, 2).map(c => `<span style="font-size:0.62rem;color:var(--accent);background:rgba(29,161,242,0.1);padding:1px 5px;border-radius:4px;">${c}</span>`).join('');
        return `
        <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
          ${img ? `<img src="${img}" style="width:100%;height:100px;object-fit:contain;background:var(--bg-tertiary);padding:8px;" onerror="this.style.display='none'" />` : `<div style="width:100%;height:100px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-size:2rem;">${typeIcon}</div>`}
          <div style="padding:10px 12px;">
            <h4 style="font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name || 'Unnamed'}</h4>
            ${item.description ? `<p style="font-size:0.72rem;color:var(--text-secondary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.description}</p>` : ''}
            <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;">
              <span class="badge badge-warning" style="font-size:0.62rem;">${item.itemTypeLabel || item.itemType || '?'}</span>
              ${item.quantifiable ? '<span class="badge badge-info" style="font-size:0.62rem;">Stackable</span>' : ''}
              ${item.isArchived ? '<span class="badge badge-danger" style="font-size:0.62rem;">Archived</span>' : ''}
              ${item.equipSlot ? `<span class="badge badge-success" style="font-size:0.62rem;">${item.equipSlot}</span>` : ''}
            </div>
            ${tagHtml || collHtml ? `<div style="display:flex;gap:3px;margin-top:4px;flex-wrap:wrap;">${collHtml}${tagHtml}</div>` : ''}
          </div>
        </div>`;
      }).join('')}</div>
    `;
  }

  function updateTagChips() {
    const chips = document.getElementById('inv-tag-chips');
    if (!chips || allTags.size === 0) return;
    const sorted = [...allTags].sort();
    chips.innerHTML = sorted.slice(0, 12).map(t =>
      `<span class="inv-tag-chip" data-tag="${t}" style="font-size:0.7rem;padding:2px 8px;border-radius:10px;background:var(--bg-tertiary);color:var(--text-secondary);cursor:pointer;transition:all 0.1s;">${t}</span>`
    ).join('') + (sorted.length > 12 ? `<span style="font-size:0.7rem;color:var(--text-muted);">+${sorted.length - 12} more</span>` : '');
    chips.querySelectorAll('.inv-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('inv-tag-filter').value = chip.dataset.tag;
        loadTab(currentTab);
      });
    });
  }

  const loadTab = async (tab) => {
    currentTab = tab;
    const results = document.getElementById('inv-results');
    const controls = document.getElementById('inv-controls');
    const sort = document.getElementById('inv-sort').value;
    const tagFilter = document.getElementById('inv-tag-filter').value.trim().toLowerCase();
    const showArchived = document.getElementById('inv-archived').checked;

    // Hide controls for collections/drops
    controls.style.display = (tab === 'collections' || tab === 'drops') ? 'none' : 'flex';

    results.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      if (tab === 'collections') {
        const collections = await api.getInventoryCollections();
        if (!collections || (Array.isArray(collections) && collections.length === 0)) {
          results.innerHTML = '<div class="empty-state"><div class="emoji">📂</div><h3>No collections</h3></div>';
          return;
        }
        results.innerHTML = `
          <p style="color:var(--text-muted);margin-bottom:12px;">${collections.length} collections</p>
          <div class="grid grid-4">${collections.map(name => `
            <div style="padding:16px;background:var(--bg-primary);border:1px solid var(--border);border-radius:10px;text-align:center;cursor:pointer;" class="coll-chip" data-coll="${name}">
              <div style="font-size:1.5rem;margin-bottom:6px;">📂</div>
              <h4 style="font-size:0.88rem;text-transform:capitalize;">${name}</h4>
            </div>
          `).join('')}</div>
        `;
        // Click collection to filter items by that collection tag
        results.querySelectorAll('.coll-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            document.getElementById('inv-tag-filter').value = chip.dataset.coll;
            document.querySelectorAll('#inv-tabs .tab').forEach(t => t.classList.remove('active'));
            document.querySelector('#inv-tabs .tab[data-tab="all"]').classList.add('active');
            loadTab('all');
          });
        });
      } else if (tab === 'drops') {
        const drops = await api.getInventoryDrops({ n: 60 });
        let items = drops;
        if (drops && !Array.isArray(drops)) items = drops.data || drops.items || Object.values(drops).find(v => Array.isArray(v)) || [];
        if (!items || items.length === 0) { results.innerHTML = '<div class="empty-state"><div class="emoji">🎁</div><h3>No drops</h3></div>'; return; }
        results.innerHTML = renderItemGrid(items);
      } else {
        // Inventory items
        const params = { n: 100, order: sort };
        if (tab !== 'all') params.types = tab;
        if (showArchived) params.archived = true;
        if (tagFilter) params.tags = tagFilter;

        const response = await api.getInventory(params);
        let items = [];
        if (response && response.data) items = response.data;
        else if (Array.isArray(response)) items = response;
        else if (response) items = Object.values(response).find(v => Array.isArray(v)) || [];

        // Client-side tag filter as backup (in case API doesn't filter)
        if (tagFilter && items.length > 0) {
          const filtered = items.filter(item => {
            const itemTags = [...(item.tags || []), ...(item.collections || [])].map(t => t.toLowerCase());
            return itemTags.some(t => t.includes(tagFilter));
          });
          if (filtered.length > 0 && filtered.length < items.length) items = filtered;
        }

        // Filter archived client-side if needed
        if (!showArchived) {
          items = items.filter(item => !item.isArchived);
        }

        if (items.length === 0) {
          results.innerHTML = `<div class="empty-state"><div class="emoji">${ITEM_TYPES.find(t => t.id === tab)?.icon || '🎒'}</div><h3>No ${ITEM_TYPES.find(t => t.id === tab)?.label || 'items'}</h3>${tagFilter ? '<p>Try clearing the tag filter</p>' : ''}</div>`;
          return;
        }
        results.innerHTML = renderItemGrid(items);
      }
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">${err.status === 401 ? 'Login required. <a href="#login" style="color:var(--accent);">Login</a>' : err.message}</div>`;
    }
  };

  // Tab clicks
  document.querySelectorAll('#inv-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#inv-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      allTags.clear();
      loadTab(tab.dataset.tab);
    });
  });

  // Sort/filter changes
  document.getElementById('inv-sort').addEventListener('change', () => loadTab(currentTab));
  document.getElementById('inv-archived').addEventListener('change', () => loadTab(currentTab));
  document.getElementById('inv-tag-filter').addEventListener('keypress', (e) => { if (e.key === 'Enter') loadTab(currentTab); });
  // Clear filter on empty
  document.getElementById('inv-tag-filter').addEventListener('input', (e) => { if (!e.target.value) loadTab(currentTab); });

  loadTab('all');
}
