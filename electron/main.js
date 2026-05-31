const { app, BrowserWindow, session, ipcMain, dialog, protocol, net } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const url = require('url');

// User-Agent for VRChat API compliance
const APP_USER_AGENT = 'VRChatPortal/1.0.0';

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Register custom protocol for serving the app
protocol.registerSchemesAsPrivileged([{
  scheme: 'vrchat-portal',
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    corsEnabled: true,
  }
}]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: 'VRChat Portal',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0a0e17',
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f1419',
      symbolColor: '#94a3b8',
      height: 36,
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    show: false,
  });

  // Show window when ready to avoid white flash
  win.once('ready-to-show', () => {
    win.show();
    // Check for updates after window is shown
    checkForUpdates(win);
  });

  // F12 opens DevTools
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      win.webContents.toggleDevTools();
    }
  });

  // Load the built app
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadURL('vrchat-portal://app/index.html');
  }

  return win;
}

// Auto-update logic
function checkForUpdates(win) {
  if (process.env.VITE_DEV_SERVER_URL) return; // Skip in dev

  autoUpdater.checkForUpdates().catch(() => {});

  autoUpdater.on('update-available', (info) => {
    // Notify renderer that an update is available
    win.webContents.send('update-available', info.version);

    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Update Available',
      message: `VRChat Portal v${info.version} is available.`,
      detail: 'Would you like to download it now? The update will be installed when you close the app.',
      buttons: ['Download', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate();
        win.webContents.send('update-downloading');
      }
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    win.webContents.send('update-downloaded', info.version);

    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Update Ready',
      message: `VRChat Portal v${info.version} has been downloaded.`,
      detail: 'Restart now to apply the update?',
      buttons: ['Restart', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    // Silently fail — don't bother the user if update check fails
    console.log('Auto-update error:', err.message);
  });
}

// IPC handler for manual update check from renderer
ipcMain.handle('check-for-updates', () => {
  return autoUpdater.checkForUpdates().catch(() => null);
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Proxy API requests via IPC — main process handles all HTTP to VRChat
// This ensures cookies are properly managed by Electron's session
ipcMain.handle('api-request', async (event, { url: reqUrl, method, headers, body }) => {
  try {
    const fetchHeaders = { ...headers };
    // Set proper User-Agent
    if (fetchHeaders['X-VRC-User-Agent']) {
      fetchHeaders['User-Agent'] = fetchHeaders['X-VRC-User-Agent'];
      delete fetchHeaders['X-VRC-User-Agent'];
    }
    if (!fetchHeaders['User-Agent']) {
      fetchHeaders['User-Agent'] = APP_USER_AGENT;
    }

    const options = {
      method: method || 'GET',
      headers: fetchHeaders,
    };
    if (body && method !== 'GET' && method !== 'HEAD') {
      options.body = body;
    }

    const response = await net.fetch(reqUrl, options);
    const responseBody = await response.text();
    
    // Extract response headers
    const respHeaders = {};
    response.headers.forEach((value, key) => {
      respHeaders[key] = value;
    });

    return {
      ok: response.ok,
      status: response.status,
      headers: respHeaders,
      body: responseBody,
    };
  } catch (err) {
    return { ok: false, status: 0, headers: {}, body: JSON.stringify({ error: { message: err.message } }) };
  }
});

// Keep the webRequest interceptor for status API (non-cookie, simple GET)
function setupAPIProxy() {
  const filter = { urls: ['https://status.vrchat.com/*'] };
  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    const headers = details.responseHeaders;
    if (headers) {
      headers['access-control-allow-origin'] = ['*'];
      headers['access-control-allow-methods'] = ['GET'];
    }
    callback({ responseHeaders: headers });
  });
}

app.whenReady().then(() => {
  // Register custom protocol to serve dist files
  protocol.handle('vrchat-portal', (request) => {
    let filePath = request.url.replace('vrchat-portal://app/', '');
    // Handle URL with hash/query
    filePath = filePath.split('?')[0].split('#')[0];
    if (!filePath || filePath === '/') filePath = 'index.html';
    const fullPath = path.join(__dirname, '..', 'dist', filePath);
    return net.fetch(url.pathToFileURL(fullPath).toString());
  });

  setupAPIProxy();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
