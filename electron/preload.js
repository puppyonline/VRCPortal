const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, version) => callback(version)),
  onUpdateDownloading: (callback) => ipcRenderer.on('update-downloading', () => callback()),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, version) => callback(version)),
  // API proxy — all VRChat API calls go through main process for proper cookie handling
  apiRequest: (opts) => ipcRenderer.invoke('api-request', opts),
});
