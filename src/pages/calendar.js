export async function renderCalendar(container, api) {
  container.innerHTML = `
    <div class="page-header">
      <h2>Calendar Events</h2>
      <p>VRChat calendar events</p>
    </div>
    <div class="alert alert-warning" style="margin-bottom:20px;">
      <strong>Calendar API Unavailable</strong>
      <p style="margin-top:4px;font-size:0.85rem;">VRChat's calendar event endpoints are currently not returning data. Event notifications from your groups still appear in the Notifications page. This page will be updated when the API becomes accessible again.</p>
    </div>
    <div class="card">
      <h3 style="margin-bottom:12px;">Group Event Notifications</h3>
      <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:12px;">Your group event announcements are available in the <a href="#notifications" style="color:var(--accent-hover);">Notifications</a> page. Look for notifications with the type <span class="badge badge-info">event.created</span>.</p>
      <button class="btn btn-primary btn-sm" onclick="window.navigate('notifications')">Go to Notifications</button>
    </div>
  `;
}
