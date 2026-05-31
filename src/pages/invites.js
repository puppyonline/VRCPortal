export async function renderInvites(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>Invites</h2>
      <p>View your invite message templates</p>
    </div>
    <div class="alert alert-info">This page is read-only. Invite messages are configured in VRChat.</div>
    <div class="card">
      <div class="card-header"><h3>My Invite Messages</h3><button class="btn btn-sm btn-primary" id="load-messages-btn">Load</button></div>
      <div id="invite-messages"><p style="color:var(--text-muted);">Click Load to fetch your invite message templates.</p></div>
    </div>
  `;

  document.getElementById('load-messages-btn').addEventListener('click', async () => {
    const el = document.getElementById('invite-messages');
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const userId = api.currentUser?.id;
      if (!userId) { el.innerHTML = '<div class="alert alert-error">Not logged in</div>'; return; }
      const messages = await api.getInviteMessages(userId, 'message');
      if (!messages || messages.length === 0) {
        el.innerHTML = '<p style="color:var(--text-muted);">No invite messages configured.</p>';
        return;
      }
      el.innerHTML = `<div class="grid grid-2">${messages.map((m, i) => `
        <div class="card" style="padding:14px;">
          <h4 style="font-size:0.9rem;">Slot ${i + 1}</h4>
          <p style="font-size:0.85rem;margin-top:4px;">${m.message || '<em>empty</em>'}</p>
          <p style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">Cooldown: ${m.remainingCooldownMinutes || 0}min</p>
        </div>
      `).join('')}</div>`;
    } catch (err) { el.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
  });
}
