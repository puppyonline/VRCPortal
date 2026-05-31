export async function renderLogin(container, api) {
  const isLoggedIn = api.currentUser && api.currentUser.id;

  container.innerHTML = `
    <div class="page-header">
      <h2>🔑 Authentication</h2>
      <p>Log in to access authenticated API endpoints</p>
    </div>

    <!-- Prominent VRChat Guidelines Warning -->
    <div class="alert alert-error" style="border-left:4px solid var(--danger);padding:18px 22px;margin-bottom:20px;">
      <strong style="display:block;margin-bottom:8px;font-size:0.95rem;">🚨 VRChat API Credential Guidelines</strong>
      <p style="font-size:0.85rem;line-height:1.7;margin-bottom:10px;">VRChat's Creator Guidelines state: <em>"Do not request log-in information from users in any situation. You should never ask for or store someone's VRChat credentials."</em></p>
      <p style="font-size:0.85rem;line-height:1.7;margin-bottom:10px;">VRChat acknowledges this creates challenges since they do not offer OAuth. This tool is designed for <strong>personal, self-hosted use only</strong> — you are authenticating your own account directly with VRChat's servers from your own device.</p>
      <ul style="font-size:0.82rem;line-height:1.8;padding-left:18px;margin-bottom:10px;">
        <li><strong>Credentials are never stored</strong> — not in localStorage, cookies, files, or memory beyond the single request.</li>
        <li><strong>No server-side component</strong> — this runs entirely in your browser. The Vite proxy only forwards requests to VRChat.</li>
        <li><strong>Session is cookie-based</strong> — VRChat sets an auth cookie directly in your browser. This app never reads or stores it.</li>
        <li><strong>You are authenticating yourself, from your own device and IP</strong> — not acting on behalf of another user.</li>
      </ul>
      <p style="font-size:0.8rem;color:var(--danger);font-weight:500;">⚠️ Never use this tool to authenticate other people's accounts. Never deploy this publicly where others would enter their credentials.</p>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-top:8px;">Full guidelines: <a href="https://hello.vrchat.com/creator-guidelines#api-usage" target="_blank" style="color:var(--danger);text-decoration:underline;">hello.vrchat.com/creator-guidelines</a></p>
    </div>

    <div class="grid grid-2">
      <div class="card" id="login-card" ${isLoggedIn ? 'style="display:none;"' : ''}>
        <h3 style="margin-bottom:16px;">Direct Authentication</h3>
        <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:16px;">Your credentials are sent directly to <code style="background:var(--bg-primary);padding:2px 6px;border-radius:3px;">api.vrchat.cloud</code> — this app does not intercept, log, or store them.</p>
        <form id="login-form">
          <div class="form-group">
            <label for="username">Username or Email</label>
            <input type="text" id="username" class="form-control" placeholder="Your VRChat username or email" autocomplete="username" />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" class="form-control" placeholder="Your VRChat password" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Authenticate with VRChat</button>
          <p style="font-size:0.72rem;color:var(--text-muted);margin-top:8px;text-align:center;">Credentials are used for this single request only and immediately discarded.</p>
        </form>
        <div id="login-result" style="margin-top:16px;"></div>
      </div>
      <div class="card" id="2fa-card" style="display:none;">
        <h3 style="margin-bottom:16px;">Two-Factor Authentication</h3>
        <p style="color:var(--text-secondary);margin-bottom:16px;">Enter your 2FA code to complete login.</p>
        <form id="2fa-form">
          <div class="form-group">
            <label for="2fa-code">2FA Code</label>
            <input type="text" id="2fa-code" class="form-control" placeholder="Enter 6-digit code" maxlength="6" />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select id="2fa-type" class="form-control">
              <option value="totp">TOTP (Authenticator App)</option>
              <option value="email">Email OTP</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Verify</button>
        </form>
        <div id="2fa-result" style="margin-top:16px;"></div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:16px;">Session Status</h3>
        <div id="session-status">
          ${isLoggedIn
            ? `<div class="alert alert-success">✓ Logged in as <strong>${api.currentUser.displayName}</strong></div>
               <p style="font-size:0.85rem;color:var(--text-secondary);">ID: ${api.currentUser.id}</p>`
            : '<div class="alert alert-info">Not logged in. Authenticate to access protected endpoints.</div>'}
        </div>
        <button class="btn btn-danger btn-sm" id="logout-btn" style="margin-top:16px;${isLoggedIn ? '' : 'display:none;'}">Logout</button>
      </div>
    </div>
  `;

  const checkSession = async () => {
    const statusEl = document.getElementById('session-status');
    const logoutBtn = document.getElementById('logout-btn');
    const loginCard = document.getElementById('login-card');
    try {
      const user = await api.getCurrentUser();
      if (user && user.id) {
        statusEl.innerHTML = `
          <div class="alert alert-success">✓ Logged in as <strong>${user.displayName}</strong></div>
          <p style="font-size:0.85rem;color:var(--text-secondary);">ID: ${user.id}</p>
          <p style="font-size:0.85rem;color:var(--text-secondary);">Status: ${user.status || 'unknown'}</p>
        `;
        logoutBtn.style.display = 'inline-flex';
        loginCard.style.display = 'none';
        window.setAuthenticated(true, user);
      }
    } catch {
      statusEl.innerHTML = '<div class="alert alert-info">Not logged in. Authenticate to access protected endpoints.</div>';
      logoutBtn.style.display = 'none';
      loginCard.style.display = 'block';
      window.setAuthenticated(false);
    }
  };

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const result = document.getElementById('login-result');

    if (!username || !password) {
      result.innerHTML = '<div class="alert alert-error">Please enter both fields.</div>';
      return;
    }

    result.innerHTML = '<div class="loading"><div class="spinner"></div>Authenticating...</div>';

    try {
      const data = await api.login(username, password);
      if (data.requiresTwoFactorAuth) {
        result.innerHTML = '<div class="alert alert-info">2FA required. Please enter your code.</div>';
        document.getElementById('2fa-card').style.display = 'block';
      } else {
        result.innerHTML = `<div class="alert alert-success">✓ Logged in as ${data.displayName}</div>`;
        window.setAuthenticated(true, data);
        checkSession();
      }
    } catch (err) {
      result.innerHTML = `<div class="alert alert-error">Login failed: ${err.message}</div>`;
    }
  });

  document.getElementById('2fa-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('2fa-code').value;
    const type = document.getElementById('2fa-type').value;
    const result = document.getElementById('2fa-result');
    if (!code) { result.innerHTML = '<div class="alert alert-error">Please enter a code.</div>'; return; }
    result.innerHTML = '<div class="loading"><div class="spinner"></div>Verifying...</div>';
    try {
      await api.verify2FA(code, type);
      result.innerHTML = '<div class="alert alert-success">✓ 2FA verified!</div>';
      document.getElementById('2fa-card').style.display = 'none';
      checkSession();
    } catch (err) {
      result.innerHTML = `<div class="alert alert-error">Verification failed: ${err.message}</div>`;
    }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await api.logout(); } catch {}
    api.currentUser = null;
    window.setAuthenticated(false);
    checkSession();
  });
}
