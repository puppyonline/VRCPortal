export async function renderEconomy(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>💰 Economy</h2>
      <p>Subscriptions, token bundles, balance, store, and licenses</p>
    </div>
    <div class="tabs" id="econ-tabs">
      <div class="tab active" data-tab="overview">Overview</div>
      <div class="tab" data-tab="subscriptions">Subscriptions</div>
      <div class="tab" data-tab="tokens">Token Bundles</div>
      <div class="tab" data-tab="purchases">Purchases</div>
      <div class="tab" data-tab="store">Store</div>
      <div class="tab" data-tab="licenses">Licenses</div>
      <div class="tab" data-tab="tilia">Tilia</div>
    </div>
    <div id="econ-results"><div class="loading"><div class="spinner"></div>Loading...</div></div>
  `;

  const loadTab = async (tab) => {
    const results = document.getElementById('econ-results');
    results.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      switch (tab) {
        case 'overview': {
          const [balance, earnings, sub, account, creditsEligible, subEligible] = await Promise.allSettled([
            api.getBalance(), api.getBalanceEarnings(), api.getCurrentSubscriptions(), api.getEconomyAccount(),
            api.getUserCreditsEligible(), api.getUserSubscriptionEligible()
          ]);
          results.innerHTML = `
            <div class="grid grid-3" style="margin-bottom:20px;">
              <div class="stat-card"><div class="stat-value">${balance.status === 'fulfilled' ? (balance.value?.balance ?? '—') : '—'}</div><div class="stat-label">Balance</div></div>
              <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${sub.status === 'fulfilled' && sub.value?.[0] ? sub.value[0].displayName || sub.value[0].tier : 'None'}</div><div class="stat-label">Subscription</div></div>
              <div class="stat-card"><div class="stat-value" style="font-size:1rem;">${account.status === 'fulfilled' ? (account.value?.id ? '✓ Active' : '—') : '—'}</div><div class="stat-label">Economy Account</div></div>
            </div>
            <div class="grid grid-2" style="margin-bottom:20px;">
              ${earnings.status === 'fulfilled' ? `<div class="card"><h4 style="margin-bottom:8px;">Earnings</h4><div class="json-viewer" style="max-height:200px;">${JSON.stringify(earnings.value, null, 2)}</div></div>` : ''}
              ${creditsEligible.status === 'fulfilled' || subEligible.status === 'fulfilled' ? `<div class="card"><h4 style="margin-bottom:8px;">Eligibility</h4>
                <table>
                  ${creditsEligible.status === 'fulfilled' ? `<tr><td style="color:var(--text-muted)">Credits Eligible</td><td>${JSON.stringify(creditsEligible.value)}</td></tr>` : ''}
                  ${subEligible.status === 'fulfilled' ? `<tr><td style="color:var(--text-muted)">Subscription Eligible</td><td>${JSON.stringify(subEligible.value)}</td></tr>` : ''}
                </table>
              </div>` : ''}
            </div>
            ${balance.status === 'fulfilled' ? `<div class="card"><h4 style="margin-bottom:8px;">Balance Data</h4><div class="json-viewer">${JSON.stringify(balance.value, null, 2)}</div></div>` : ''}
            ${sub.status === 'fulfilled' ? `<div class="card" style="margin-top:12px;"><h4 style="margin-bottom:8px;">Subscription Data</h4><div class="json-viewer">${JSON.stringify(sub.value, null, 2)}</div></div>` : ''}
            ${account.status === 'fulfilled' ? `<div class="card" style="margin-top:12px;"><h4 style="margin-bottom:8px;">Economy Account</h4><div class="json-viewer">${JSON.stringify(account.value, null, 2)}</div></div>` : ''}
          `;
          break;
        }
        case 'subscriptions': {
          const subs = await api.getSubscriptions();
          if (!subs || subs.length === 0) { results.innerHTML = '<div class="empty-state"><div class="emoji">💰</div><h3>No subscription data</h3></div>'; return; }
          results.innerHTML = `<div class="grid grid-3">${subs.map(s => `
            <div class="card"><h4>${s.displayName || s.id}</h4><p style="font-size:0.85rem;color:var(--text-secondary);margin:8px 0;">${s.description || ''}</p>
            <table><tr><td style="color:var(--text-muted)">Amount</td><td>$${((s.amount || 0) / 100).toFixed(2)}</td></tr>
            <tr><td style="color:var(--text-muted)">Period</td><td>${s.period || '—'}</td></tr>
            <tr><td style="color:var(--text-muted)">Tier</td><td>${s.tier || '—'}</td></tr></table></div>
          `).join('')}</div>`;
          break;
        }
        case 'tokens': {
          const bundles = await api.getTokenBundles();
          if (!bundles || bundles.length === 0) { results.innerHTML = '<div class="empty-state"><div class="emoji">🪙</div><h3>No token bundles</h3></div>'; return; }
          results.innerHTML = `<div class="grid grid-3">${bundles.map(b => `
            <div class="card" style="text-align:center;">
              ${b.imageUrl ? `<img src="${b.imageUrl}" style="width:48px;height:48px;margin:0 auto 8px;display:block;" onerror="this.style.display='none'" />` : ''}
              <h4>${b.displayName || b.id}</h4>
              <div style="font-size:1.3rem;font-weight:700;color:var(--accent);margin:8px 0;">${b.tokens || '—'}</div>
              <p style="font-size:0.85rem;color:var(--text-muted);">tokens</p>
            </div>
          `).join('')}</div>`;
          break;
        }
        case 'purchases': {
          const [purchases, bulkGifts, steamTx] = await Promise.allSettled([
            api.getProductPurchases(), api.getBulkGiftPurchases(), api.getSteamTransactions()
          ]);
          results.innerHTML = `
            <div class="grid grid-2" style="margin-bottom:16px;">
              <div class="card">
                <h4 style="margin-bottom:8px;">Product Purchases</h4>
                ${purchases.status === 'fulfilled' ? `<div class="json-viewer" style="max-height:300px;">${JSON.stringify(purchases.value, null, 2)}</div>` : `<p style="color:var(--text-muted);">Could not load purchases</p>`}
              </div>
              <div class="card">
                <h4 style="margin-bottom:8px;">Bulk Gift Purchases</h4>
                ${bulkGifts.status === 'fulfilled' ? `<div class="json-viewer" style="max-height:300px;">${JSON.stringify(bulkGifts.value, null, 2)}</div>` : `<p style="color:var(--text-muted);">Could not load bulk gifts</p>`}
              </div>
            </div>
            <div class="card">
              <h4 style="margin-bottom:8px;">Steam Transactions</h4>
              ${steamTx.status === 'fulfilled' ? `<div class="json-viewer" style="max-height:300px;">${JSON.stringify(steamTx.value, null, 2)}</div>` : `<p style="color:var(--text-muted);">Could not load Steam transactions</p>`}
            </div>
          `;
          break;
        }
        case 'store': {
          const [store, shelves] = await Promise.allSettled([api.getStore(), api.getStoreShelves()]);
          results.innerHTML = `
            ${store.status === 'fulfilled' ? `<div class="card"><h4 style="margin-bottom:8px;">Store</h4><div class="json-viewer">${JSON.stringify(store.value, null, 2)}</div></div>` : '<div class="alert alert-error">Could not load store</div>'}
            ${shelves.status === 'fulfilled' ? `<div class="card" style="margin-top:12px;"><h4 style="margin-bottom:8px;">Store Shelves</h4><div class="json-viewer">${JSON.stringify(shelves.value, null, 2)}</div></div>` : ''}
          `;
          break;
        }
        case 'licenses': {
          const licenses = await api.getActiveLicenses();
          results.innerHTML = `<div class="card"><h4 style="margin-bottom:8px;">Active Licenses</h4><div class="json-viewer">${JSON.stringify(licenses, null, 2)}</div></div>`;
          break;
        }
        case 'tilia': {
          const [status, tos] = await Promise.allSettled([api.getTiliaStatus(), api.getTiliaTos()]);
          results.innerHTML = `
            <div class="grid grid-2">
              <div class="card"><h4 style="margin-bottom:8px;">Tilia Status</h4><div class="json-viewer">${JSON.stringify(status.status === 'fulfilled' ? status.value : status.reason, null, 2)}</div></div>
              <div class="card"><h4 style="margin-bottom:8px;">Tilia TOS</h4><div class="json-viewer">${JSON.stringify(tos.status === 'fulfilled' ? tos.value : tos.reason, null, 2)}</div></div>
            </div>
          `;
          break;
        }
      }
    } catch (err) {
      results.innerHTML = `<div class="alert alert-error">${err.status === 401 ? 'Login required. <a href="#login" style="color:var(--accent);">Login</a>' : err.message}</div>`;
    }
  };

  document.querySelectorAll('#econ-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#econ-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadTab(tab.dataset.tab);
    });
  });
  loadTab('overview');
}
