import { api, hasUserAgent, setUserAgentEmail } from './api.js';

// Detect Electron and add body class for titlebar styling
if (window.electronAPI?.isElectron) {
  document.body.classList.add('is-electron');
}

import { renderDashboard } from './pages/dashboard.js';
import { renderConfig } from './pages/config.js';
import { renderHealth } from './pages/health.js';
import { renderStatus } from './pages/status.js';
import { renderLogin } from './pages/login.js';
import { renderProfile } from './pages/profile.js';
import { renderUsers } from './pages/users.js';
import { renderWorlds } from './pages/worlds.js';
import { renderWorldDetail } from './pages/world-detail.js';
import { renderGroupDetail } from './pages/group-detail.js';
import { renderUserDetail } from './pages/user-detail.js';
import { renderAvatars } from './pages/avatars.js';
import { renderGroups } from './pages/groups.js';
import { renderInstances } from './pages/instances.js';
import { renderFriends } from './pages/friends.js';
import { renderFavorites } from './pages/favorites.js';
import { renderNotifications } from './pages/notifications.js';
import { renderEconomy } from './pages/economy.js';
import { renderInventory } from './pages/inventory.js';
import { renderJams } from './pages/jams.js';
import { renderCalendar } from './pages/calendar.js';
import { renderModeration } from './pages/moderation.js';
import { renderFiles } from './pages/files.js';
import { renderInvites } from './pages/invites.js';
import { renderPrints } from './pages/prints.js';
import { renderProps } from './pages/props.js';

const pages = {
  dashboard: renderDashboard,
  config: renderConfig,
  health: renderHealth,
  status: renderStatus,
  login: renderLogin,
  profile: renderProfile,
  users: renderUsers,
  worlds: renderWorlds,
  avatars: renderAvatars,
  groups: renderGroups,
  instances: renderInstances,
  friends: renderFriends,
  favorites: renderFavorites,
  notifications: renderNotifications,
  economy: renderEconomy,
  inventory: renderInventory,
  jams: renderJams,
  calendar: renderCalendar,
  moderation: renderModeration,
  files: renderFiles,
  invites: renderInvites,
  prints: renderPrints,
  props: renderProps,
};

const authRequiredPages = new Set([
  'profile', 'friends', 'favorites', 'notifications', 'invites',
  'avatars', 'instances', 'inventory', 'files', 'prints', 'props',
  'economy', 'jams', 'calendar', 'moderation'
]);

let isAuthenticated = false;

function updateAuthUI() {
  document.querySelectorAll('.auth-required').forEach(section => {
    section.style.display = isAuthenticated ? 'block' : 'none';
  });
  const loginLink = document.querySelector('[data-page="login"] span');
  if (loginLink) loginLink.textContent = isAuthenticated ? 'Logged In' : 'Login';
  const mobileIndicator = document.getElementById('mobile-auth-indicator');
  if (mobileIndicator) {
    mobileIndicator.innerHTML = isAuthenticated
      ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--success);display:inline-block;"></span>'
      : '';
  }
}

// Navigate with optional parameter (e.g. navigate('world-detail', 'wrld_xxx'))
function navigate(page, param) {
  // ENFORCE: Block navigation if User-Agent email not set
  if (!hasUserAgent()) {
    showSetupScreen();
    return;
  }

  // Handle parameterized detail pages
  if (page === 'world-detail' && param) {
    window.location.hash = `world-detail/${param}`;
    const content = document.getElementById('content');
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    renderWorldDetail(content, api, param);
    return;
  }
  if (page === 'group-detail' && param) {
    window.location.hash = `group-detail/${param}`;
    const content = document.getElementById('content');
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    renderGroupDetail(content, api, param);
    return;
  }
  if (page === 'user-detail' && param) {
    window.location.hash = `user-detail/${param}`;
    const content = document.getElementById('content');
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    renderUserDetail(content, api, param);
    return;
  }

  // Auth guard
  if (authRequiredPages.has(page) && !isAuthenticated) page = 'login';

  const content = document.getElementById('content');
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  if (pages[page]) {
    pages[page](content, api);
  } else {
    content.innerHTML = `<div class="empty-state"><div class="emoji">🚧</div><h3>Page not found</h3></div>`;
  }
  window.location.hash = page;
}

function setAuthenticated(authenticated, user = null) {
  isAuthenticated = authenticated;
  api.currentUser = user;
  updateAuthUI();
}

// Parse hash for detail pages
function parseHash() {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('world-detail/')) {
    return { page: 'world-detail', param: hash.replace('world-detail/', '') };
  }
  if (hash.startsWith('group-detail/')) {
    return { page: 'group-detail', param: hash.replace('group-detail/', '') };
  }
  if (hash.startsWith('user-detail/')) {
    return { page: 'user-detail', param: hash.replace('user-detail/', '') };
  }
  return { page: hash || 'dashboard', param: null };
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => { e.preventDefault(); navigate(link.dataset.page); closeMobileSidebar(); });
});

window.addEventListener('hashchange', () => {
  const { page, param } = parseHash();
  navigate(page, param);
});

// Mobile sidebar toggle
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');

function openMobileSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
  overlay.style.display = 'block';
}

function closeMobileSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  setTimeout(() => { if (!overlay.classList.contains('active')) overlay.style.display = 'none'; }, 300);
}

if (menuToggle) menuToggle.addEventListener('click', openMobileSidebar);
if (overlay) overlay.addEventListener('click', closeMobileSidebar);

// First-run setup: require User-Agent contact email per VRChat guidelines
function showSetupScreen() {
  const content = document.getElementById('content');
  // Hide sidebar during setup and center content on full screen
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('mobile-header').style.display = 'none';
  content.style.marginLeft = '0';
  content.style.display = 'flex';
  content.style.alignItems = 'center';
  content.style.justifyContent = 'center';
  content.style.maxWidth = 'none';
  content.innerHTML = `
    <div style="max-width:560px;width:100%;text-align:center;padding:20px;">
      <div style="font-size:3rem;margin-bottom:16px;">🌐</div>
      <h1 style="font-size:1.6rem;font-weight:700;margin-bottom:8px;">Welcome to VRChat Portal</h1>
      <p style="color:var(--text-secondary);margin-bottom:28px;">Before you begin, VRChat requires all API applications to identify themselves with a contact email.</p>

      <div class="card" style="text-align:left;">
        <h3 style="margin-bottom:12px;">Setup: Contact Email</h3>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">Per <a href="https://hello.vrchat.com/creator-guidelines#api-usage" target="_blank" style="color:var(--accent-hover);">VRChat's Creator Guidelines</a>, applications must identify themselves using a User-Agent header in the format:<br><code style="background:var(--bg-primary);padding:3px 8px;border-radius:4px;margin-top:6px;display:inline-block;">VRChatPortal/1.0.0 your@email.com</code></p>
        <div class="form-group">
          <label for="setup-email">Your Contact Email</label>
          <input type="email" id="setup-email" class="form-control" placeholder="you@example.com" required />
        </div>
        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:16px;">This is stored locally in your browser only. It is sent to VRChat as part of the User-Agent header so they can contact you if there's an issue with your usage. It is never sent anywhere else.</p>
        <button class="btn btn-primary" id="setup-save" style="width:100%;">Save & Continue</button>
        <div id="setup-error" style="margin-top:12px;"></div>
      </div>
    </div>
  `;

  document.getElementById('setup-save').addEventListener('click', () => {
    const email = document.getElementById('setup-email').value.trim();
    if (!email || !email.includes('@')) {
      document.getElementById('setup-error').innerHTML = '<div class="alert alert-error">Please enter a valid email address.</div>';
      return;
    }
    setUserAgentEmail(email);
    // Restore sidebar and reload the app
    document.getElementById('sidebar').style.display = '';
    document.getElementById('mobile-header').style.display = '';
    content.style.marginLeft = '';
    content.style.display = '';
    content.style.alignItems = '';
    content.style.justifyContent = '';
    content.style.maxWidth = '';
    initApp();
  });

  document.getElementById('setup-email').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('setup-save').click();
  });
}

async function initApp() {
  if (!hasUserAgent()) {
    showSetupScreen();
    return;
  }

  await checkAuth();
  const { page, param } = parseHash();
  navigate(page, param);
}

async function checkAuth() {
  try {
    const user = await api.getCurrentUser();
    if (user && user.id) setAuthenticated(true, user);
  } catch { setAuthenticated(false); }
}

initApp();

window.navigate = navigate;
window.api = api;
window.setAuthenticated = setAuthenticated;
