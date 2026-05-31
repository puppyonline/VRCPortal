/**
 * VRChat API Client - Comprehensive
 * Based on https://vrchat.community API Reference
 * Covers ALL documented endpoints
 *
 * IMPORTANT: This application follows VRChat's Creator Guidelines.
 * https://hello.vrchat.com/creator-guidelines#api-usage
 * - Requests are identified via User-Agent header
 * - Rate limiting with exponential backoff on 429s
 * - No credentials are stored (session cookies only)
 * - No automated/polling requests on fixed intervals
 */

const BASE = window.electronAPI?.isElectron
  ? 'https://api.vrchat.cloud/api/1'
  : '/api/1';

// User-Agent is required by VRChat's Creator Guidelines
// Format: applicationName/Version contactInfo
function getUserAgent() {
  const email = localStorage.getItem('vrchat_portal_contact_email');
  if (!email) return null;
  return `VRChatPortal/1.0.0 ${email}`;
}

function setUserAgentEmail(email) {
  localStorage.setItem('vrchat_portal_contact_email', email.trim());
}

function hasUserAgent() {
  return !!localStorage.getItem('vrchat_portal_contact_email');
}

class VRChatAPI {
  constructor() {
    this.currentUser = null;
    this._backoffUntil = 0;
    this._backoffMs = 1000;
    this._cache = new Map();
  }

  // Simple TTL cache - avoids repeated requests for data that doesn't change often
  _getCached(key, ttlMs) {
    const entry = this._cache.get(key);
    if (entry && Date.now() - entry.time < ttlMs) return entry.data;
    return null;
  }

  _setCache(key, data) {
    this._cache.set(key, { data, time: Date.now() });
  }

  clearCache() {
    this._cache.clear();
  }

  get headers() {
    const ua = getUserAgent();
    const h = { 'Content-Type': 'application/json' };
    if (ua) {
      h['User-Agent'] = ua;
      // Electron main process reads this header for the actual outgoing User-Agent
      h['X-VRC-User-Agent'] = ua;
    }
    return h;
  }

  async request(endpoint, options = {}) {
    // ENFORCE: Block all API calls if no User-Agent email is configured
    if (!hasUserAgent()) {
      throw { status: 0, message: 'User-Agent email not configured. Please complete setup first.', data: null };
    }

    // Rate limit backoff: wait if we've been told to slow down
    const now = Date.now();
    if (now < this._backoffUntil) {
      const waitMs = this._backoffUntil - now;
      await new Promise(r => setTimeout(r, waitMs));
    }

    const url = `${BASE}${endpoint}`;
    const config = { credentials: 'include', headers: this.headers, ...options };

    try {
      let response;

      if (window.electronAPI?.isElectron) {
        // In Electron: route through main process IPC for proper cookie handling
        const result = await window.electronAPI.apiRequest({
          url,
          method: config.method || 'GET',
          headers: config.headers || {},
          body: config.body || null,
        });

        if (result.status === 429) {
          const retryAfter = result.headers['retry-after'];
          this._backoffMs = Math.min(this._backoffMs * 2, 60000);
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this._backoffMs;
          this._backoffUntil = Date.now() + waitTime;
          throw { status: 429, message: `Rate limited. Retrying in ${Math.ceil(waitTime / 1000)}s...`, data: null };
        }

        this._backoffMs = 1000;
        const data = result.body ? JSON.parse(result.body) : null;
        if (!result.ok) {
          throw { status: result.status, message: data?.error?.message || data?.message || `HTTP ${result.status}`, data };
        }
        return data;

      } else {
        // In browser: use fetch directly (Vite proxy handles CORS)
        response = await fetch(url, config);

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          this._backoffMs = Math.min(this._backoffMs * 2, 60000);
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this._backoffMs;
          this._backoffUntil = Date.now() + waitTime;
          throw { status: 429, message: `Rate limited. Retrying in ${Math.ceil(waitTime / 1000)}s...`, data: null };
        }

        this._backoffMs = 1000;
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw { status: response.status, message: data?.error?.message || data?.message || `HTTP ${response.status}`, data };
        }
        return data;
      }
    } catch (error) {
      if (error.status) throw error;
      throw { status: 0, message: error.message || 'Network error', data: null };
    }
  }

  // ==================== Authentication ====================
  async login(username, password) {
    if (!hasUserAgent()) {
      throw { status: 0, message: 'User-Agent email not configured. Please complete setup first.', data: null };
    }
    const creds = btoa(`${username}:${password}`);
    const headers = { ...this.headers, 'Authorization': `Basic ${creds}` };
    const url = `${BASE}/auth/user`;

    if (window.electronAPI?.isElectron) {
      const result = await window.electronAPI.apiRequest({
        url,
        method: 'GET',
        headers,
        body: null,
      });
      const data = result.body ? JSON.parse(result.body) : null;
      if (!result.ok) throw { status: result.status, message: data?.error?.message || 'Login failed', data };
      this.currentUser = data;
      return data;
    } else {
      const response = await fetch(url, {
        credentials: 'include',
        headers,
      });
      const data = await response.json();
      if (!response.ok) throw { status: response.status, message: data?.error?.message || 'Login failed', data };
      this.currentUser = data;
      return data;
    }
  }
  async verify2FA(code, type = 'totp') {
    const ep = type === 'totp' ? '/auth/twofactorauth/totp/verify' : '/auth/twofactorauth/emailotp/verify';
    return this.request(ep, { method: 'POST', body: JSON.stringify({ code }) });
  }
  async verify2FARecovery(code) { return this.request('/auth/twofactorauth/otp/verify', { method: 'POST', body: JSON.stringify({ code }) }); }
  async verify2FAPending(code) { return this.request('/auth/twofactorauth/totp/pending/verify', { method: 'POST', body: JSON.stringify({ code }) }); }
  async getCurrentUser() { return this.request('/auth/user'); }
  async verifyAuthToken() { return this.request('/auth'); }
  async logout() { return this.request('/logout', { method: 'PUT' }); }
  async checkUserExists(params) { return this.request(`/auth/exists?${new URLSearchParams(params)}`); }
  async getPermissions() { return this.request('/auth/permissions'); }
  async cancelPending2FA() { return this.request('/auth/twofactorauth/totp/pending', { method: 'DELETE' }); }
  async enable2FA() { return this.request('/auth/twofactorauth/totp', { method: 'POST' }); }
  async disable2FA() { return this.request('/auth/twofactorauth/totp', { method: 'DELETE' }); }
  async get2FARecoveryCodes() { return this.request('/auth/twofactorauth/otp'); }
  async getGlobalAvatarModerations() { return this.request('/auth/user/avatarmoderations'); }
  async createGlobalAvatarModeration(data) { return this.request('/auth/user/avatarmoderations', { method: 'POST', body: JSON.stringify(data) }); }
  async deleteGlobalAvatarModeration(avatarId) { return this.request(`/auth/user/avatarmoderations/${avatarId}`, { method: 'DELETE' }); }
  async getModerationReports(params = {}) { return this.request(`/auth/user/moderationreports?${new URLSearchParams(params)}`); }
  async submitModerationReport(data) { return this.request('/auth/user/moderationreports', { method: 'POST', body: JSON.stringify(data) }); }
  async deleteModerationReport(reportId) { return this.request(`/auth/user/moderationreports/${reportId}`, { method: 'DELETE' }); }
  async verifyLoginPlace() { return this.request('/auth/user/loginplace/verify'); }
  async confirmEmail(token) { return this.request(`/auth/user/confirmemail?token=${encodeURIComponent(token)}`); }
  async resendEmailConfirmation() { return this.request('/auth/user/resendEmail', { method: 'POST' }); }

  // ==================== System / Misc ====================
  async getConfig() {
    const cached = this._getCached('config', 300000); // 5 min cache
    if (cached) return cached;
    const data = await this.request('/config');
    this._setCache('config', data);
    return data;
  }
  async getHealth() {
    try {
      const r = await fetch('/api/1/health', { credentials: 'include' });
      if (!r.ok) return { ok: (await fetch('/api/1/config', { credentials: 'include' })).ok };
      return await r.json();
    } catch { return { ok: false }; }
  }
  async getOnlineUsers() {
    const cached = this._getCached('onlineUsers', 60000); // 1 min cache
    if (cached) return cached;
    const data = await this.request('/visits');
    this._setCache('onlineUsers', data);
    return data;
  }
  async getSystemTime() { return this.request('/time'); }
  async getInfoPush() { try { return await this.request('/infoPush'); } catch { return []; } }
  async getAssignedPermissions() {
    const cached = this._getCached('permissions', 600000); // 10 min cache
    if (cached) return cached;
    const data = await this.request('/auth/permissions');
    this._setCache('permissions', data);
    return data;
  }
  async getPermission(permissionId) { return this.request(`/permissions/${permissionId}`); }
  async getCSS() { return this.request('/css/app.css'); }
  async getJavaScript() { return this.request('/js/app.js'); }

  // ==================== Users ====================
  async searchUsers(query, n = 20, offset = 0) { return this.request(`/users?search=${encodeURIComponent(query)}&n=${n}&offset=${offset}`); }
  async getUser(userId) { return this.request(`/users/${userId}`); }
  async getUserByName(username) { return this.request(`/users/${encodeURIComponent(username)}/name`); }
  async updateUser(userId, data) { return this.request(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async getUserGroups(userId) { return this.request(`/users/${userId}/groups`); }
  async getUserGroupRequests() { return this.request('/users/groups/requested'); }
  async getUserNotes(params = {}) { return this.request(`/users/notes?${new URLSearchParams({ n: 50, ...params })}`); }
  async getUserNote(noteId) { return this.request(`/users/notes/${noteId}`); }
  async updateUserNote(userId, note) { return this.request(`/users/${userId}/note`, { method: 'POST', body: JSON.stringify({ note }) }); }
  async getUserFeedback(userId) { return this.request(`/users/${userId}/feedback`); }
  async getUserRepresentedGroup(userId) { return this.request(`/users/${userId}/groups/represented`); }
  async getUserMutuals(userId) { return this.request(`/users/${userId}/mutuals`); }
  async getUserMutualFriends(userId) { return this.request(`/users/${userId}/mutuals/friends`); }
  async getUserMutualGroups(userId) { return this.request(`/users/${userId}/mutuals/groups`); }
  async getUserAllGroupPermissions() { return this.request('/users/groups/permissions'); }
  async getUserGroupBlocks() { return this.request('/users/groups/blocked'); }
  async getUserGroupInvited() { return this.request('/users/groups/invited'); }
  async getUserGroupInstances(params = {}) { return this.request(`/users/groups/instances?${new URLSearchParams(params)}`); }
  async getUserGroupInstancesForGroup(groupId, params = {}) { return this.request(`/users/groups/${groupId}/instances?${new URLSearchParams(params)}`); }
  async addUserTags(userId, tags) { return this.request(`/users/${userId}/addTags`, { method: 'POST', body: JSON.stringify({ tags }) }); }
  async removeUserTags(userId, tags) { return this.request(`/users/${userId}/removeTags`, { method: 'POST', body: JSON.stringify({ tags }) }); }
  async updateUserBadge(userId, badgeId) { return this.request(`/users/${userId}/badge`, { method: 'PUT', body: JSON.stringify({ badgeId }) }); }
  async checkUserPersistenceExists(params = {}) { return this.request(`/users/persistence/exists?${new URLSearchParams(params)}`); }
  async deleteUserPersistence(params = {}) { return this.request(`/users/persistence?${new URLSearchParams(params)}`, { method: 'DELETE' }); }
  async deleteAllUserPersistenceData() { return this.request('/users/persistence/all', { method: 'DELETE' }); }

  // ==================== Worlds ====================
  async searchWorlds(params = {}) { return this.request(`/worlds?${new URLSearchParams({ n: 20, offset: 0, ...params })}`); }
  async getWorld(worldId) { return this.request(`/worlds/${worldId}`); }
  async createWorld(data) { throw { status: 403, message: 'Content upload is disabled per VRChat Creator Guidelines' }; }
  async updateWorld(worldId, data) { return this.request(`/worlds/${worldId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteWorld(worldId) { return this.request(`/worlds/${worldId}`, { method: 'DELETE' }); }
  async getActiveWorlds(params = {}) { return this.request(`/worlds/active?${new URLSearchParams({ n: 20, offset: 0, ...params })}`); }
  async getRecentWorlds(params = {}) { return this.request(`/worlds/recent?${new URLSearchParams({ n: 20, offset: 0, ...params })}`); }
  async getFavoritedWorlds(params = {}) { return this.request(`/worlds/favorites?${new URLSearchParams({ n: 20, offset: 0, ...params })}`); }
  async getWorldInstance(worldId, instanceId) { return this.request(`/worlds/${worldId}/${instanceId}`); }
  async getWorldMetadata(worldId) { return this.request(`/worlds/${worldId}/metadata`); }
  async getWorldPublishStatus(worldId) { return this.request(`/worlds/${worldId}/publish`); }
  async publishWorld(worldId) { return this.request(`/worlds/${worldId}/publish`, { method: 'PUT' }); }
  async unpublishWorld(worldId) { return this.request(`/worlds/${worldId}/publish`, { method: 'DELETE' }); }

  // ==================== Avatars ====================
  async searchAvatars(params = {}) { return this.request(`/avatars?${new URLSearchParams({ n: 20, offset: 0, ...params })}`); }
  async getAvatar(avatarId) { return this.request(`/avatars/${avatarId}`); }
  async getOwnAvatar(userId) { return this.request(`/users/${userId}/avatar`); }
  async createAvatar(data) { throw { status: 403, message: 'Content upload is disabled per VRChat Creator Guidelines' }; }
  async updateAvatar(avatarId, data) { return this.request(`/avatars/${avatarId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteAvatar(avatarId) { return this.request(`/avatars/${avatarId}`, { method: 'DELETE' }); }
  async selectAvatar(avatarId) { return this.request(`/avatars/${avatarId}/select`, { method: 'PUT' }); }
  async selectFallbackAvatar(avatarId) { return this.request(`/avatars/${avatarId}/selectFallback`, { method: 'PUT' }); }
  async getFavoritedAvatars(params = {}) { return this.request(`/avatars/favorites?${new URLSearchParams({ n: 20, offset: 0, ...params })}`); }
  async getLicensedAvatars(params = {}) { return this.request(`/avatars/licensed?${new URLSearchParams({ n: 20, offset: 0, ...params })}`); }
  async getAvatarStyles() {
    const cached = this._getCached('avatarStyles', 600000); // 10 min
    if (cached) return cached;
    const data = await this.request('/avatars/styles');
    this._setCache('avatarStyles', data);
    return data;
  }
  async getImpostorQueueStats() { return this.request('/avatars/impostors/queue/stats'); }
  async deleteImpostor(avatarId) { return this.request(`/avatars/${avatarId}/impostor`, { method: 'DELETE' }); }
  async enqueueImpostor(avatarId) { return this.request(`/avatars/${avatarId}/impostor`, { method: 'POST' }); }

  // ==================== Friends ====================
  async getFriends(params = {}) { return this.request(`/auth/user/friends?${new URLSearchParams({ n: 50, offset: 0, ...params })}`); }
  async getFriendStatus(userId) { return this.request(`/user/${userId}/friendStatus`); }
  async sendFriendRequest(userId) { return this.request(`/user/${userId}/friendRequest`, { method: 'POST' }); }
  async deleteFriendRequest(userId) { return this.request(`/user/${userId}/friendRequest`, { method: 'DELETE' }); }
  async unfriend(userId) { return this.request(`/auth/user/friends/${userId}`, { method: 'DELETE' }); }
  async sendBoop(userId) { return this.request(`/user/${userId}/boop`, { method: 'POST' }); }

  // ==================== Favorites ====================
  async getFavorites(params = {}) { return this.request(`/favorites?${new URLSearchParams({ n: 50, offset: 0, ...params })}`); }
  async addFavorite(type, favoriteId, tags) { return this.request('/favorites', { method: 'POST', body: JSON.stringify({ type, favoriteId, tags }) }); }
  async removeFavorite(favoriteId) { return this.request(`/favorites/${favoriteId}`, { method: 'DELETE' }); }
  async getFavoriteGroups(params = {}) { return this.request(`/favorite/groups?${new URLSearchParams({ n: 50, offset: 0, ...params })}`); }
  async getFavoriteGroup(groupType, groupName) { return this.request(`/favorite/group/${groupType}/${groupName}/0`); }
  async updateFavoriteGroup(groupType, groupName, data) { return this.request(`/favorite/group/${groupType}/${groupName}/0`, { method: 'PUT', body: JSON.stringify(data) }); }
  async clearFavoriteGroup(groupType, groupName) { return this.request(`/favorite/group/${groupType}/${groupName}/0`, { method: 'DELETE' }); }
  async getFavoriteLimits() { return this.request('/favorites/limits'); }

  // ==================== Groups ====================
  async searchGroups(query, params = {}) { return this.request(`/groups?${new URLSearchParams({ n: 20, offset: 0, ...params, query })}`); }
  async getGroup(groupId) { return this.request(`/groups/${groupId}`); }
  async createGroup(data) { return this.request('/groups', { method: 'POST', body: JSON.stringify(data) }); }
  async updateGroup(groupId, data) { return this.request(`/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteGroup(groupId) { return this.request(`/groups/${groupId}`, { method: 'DELETE' }); }
  async getGroupMembers(groupId, params = {}) { return this.request(`/groups/${groupId}/members?${new URLSearchParams({ n: 20, offset: 0, ...params })}`); }
  async getGroupMember(groupId, userId) { return this.request(`/groups/${groupId}/members/${userId}`); }
  async searchGroupMembers(groupId, query) { return this.request(`/groups/${groupId}/members/search?query=${encodeURIComponent(query)}`); }
  async updateGroupMember(groupId, userId, data) { return this.request(`/groups/${groupId}/members/${userId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async kickGroupMember(groupId, userId) { return this.request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }); }
  async addGroupMemberRole(groupId, userId, roleId) { return this.request(`/groups/${groupId}/members/${userId}/roles/${roleId}`, { method: 'PUT' }); }
  async removeGroupMemberRole(groupId, userId, roleId) { return this.request(`/groups/${groupId}/members/${userId}/roles/${roleId}`, { method: 'DELETE' }); }
  async getGroupRoles(groupId) { return this.request(`/groups/${groupId}/roles`); }
  async createGroupRole(groupId, data) { return this.request(`/groups/${groupId}/roles`, { method: 'POST', body: JSON.stringify(data) }); }
  async updateGroupRole(groupId, roleId, data) { return this.request(`/groups/${groupId}/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteGroupRole(groupId, roleId) { return this.request(`/groups/${groupId}/roles/${roleId}`, { method: 'DELETE' }); }
  async getGroupPermissions(groupId) { return this.request(`/groups/${groupId}/permissions`); }
  async getGroupInstances(groupId) { return this.request(`/groups/${groupId}/instances`); }
  async getGroupAnnouncement(groupId) { return this.request(`/groups/${groupId}/announcement`); }
  async createGroupAnnouncement(groupId, data) { return this.request(`/groups/${groupId}/announcement`, { method: 'POST', body: JSON.stringify(data) }); }
  async deleteGroupAnnouncement(groupId) { return this.request(`/groups/${groupId}/announcement`, { method: 'DELETE' }); }
  async getGroupAuditLogs(groupId, params = {}) { return this.request(`/groups/${groupId}/auditLogs?${new URLSearchParams({ n: 20, ...params })}`); }
  async getGroupAuditLogEntryTypes() { return this.request('/groups/auditLogs/types'); }
  async getGroupBans(groupId, params = {}) { return this.request(`/groups/${groupId}/bans?${new URLSearchParams({ n: 20, offset: 0, ...params })}`); }
  async banGroupMember(groupId, userId) { return this.request(`/groups/${groupId}/bans`, { method: 'POST', body: JSON.stringify({ userId }) }); }
  async unbanGroupMember(groupId, userId) { return this.request(`/groups/${groupId}/bans/${userId}`, { method: 'DELETE' }); }
  async getGroupGalleryImages(groupId, galleryId, params = {}) { return this.request(`/groups/${groupId}/galleries/${galleryId}?${new URLSearchParams({ n: 20, ...params })}`); }
  async addGroupGalleryImage(groupId, galleryId, data) { return this.request(`/groups/${groupId}/galleries/${galleryId}/images`, { method: 'POST', body: JSON.stringify(data) }); }
  async deleteGroupGalleryImage(groupId, galleryId, imageId) { return this.request(`/groups/${groupId}/galleries/${galleryId}/images/${imageId}`, { method: 'DELETE' }); }
  async createGroupGallery(groupId, data) { return this.request(`/groups/${groupId}/galleries`, { method: 'POST', body: JSON.stringify(data) }); }
  async updateGroupGallery(groupId, galleryId, data) { return this.request(`/groups/${groupId}/galleries/${galleryId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteGroupGallery(groupId, galleryId) { return this.request(`/groups/${groupId}/galleries/${galleryId}`, { method: 'DELETE' }); }
  async getGroupInvites(groupId) { return this.request(`/groups/${groupId}/invites`); }
  async createGroupInvite(groupId, userId) { return this.request(`/groups/${groupId}/invites`, { method: 'POST', body: JSON.stringify({ userId }) }); }
  async deleteGroupInvite(groupId, userId) { return this.request(`/groups/${groupId}/invites/${userId}`, { method: 'DELETE' }); }
  async declineGroupInvite(groupId) { return this.request(`/groups/${groupId}/invites`, { method: 'PUT' }); }
  async getGroupRequests(groupId) { return this.request(`/groups/${groupId}/requests`); }
  async respondGroupJoinRequest(groupId, userId, action) { return this.request(`/groups/${groupId}/requests/${userId}`, { method: 'PUT', body: JSON.stringify({ action }) }); }
  async cancelGroupJoinRequest(groupId) { return this.request(`/groups/${groupId}/requests`, { method: 'DELETE' }); }
  async joinGroup(groupId) { return this.request(`/groups/${groupId}/join`, { method: 'POST' }); }
  async leaveGroup(groupId) { return this.request(`/groups/${groupId}/leave`, { method: 'POST' }); }
  async blockGroup(groupId) { return this.request(`/groups/${groupId}/block`, { method: 'POST' }); }
  async getGroupPosts(groupId, params = {}) { return this.request(`/groups/${groupId}/posts?${new URLSearchParams({ n: 20, ...params })}`); }
  async createGroupPost(groupId, data) { return this.request(`/groups/${groupId}/posts`, { method: 'POST', body: JSON.stringify(data) }); }
  async updateGroupPost(groupId, postId, data) { return this.request(`/groups/${groupId}/posts/${postId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteGroupPost(groupId, postId) { return this.request(`/groups/${groupId}/posts/${postId}`, { method: 'DELETE' }); }
  async getGroupRoleTemplates() {
    const cached = this._getCached('groupRoleTemplates', 600000); // 10 min
    if (cached) return cached;
    const data = await this.request('/groups/roles/templates');
    this._setCache('groupRoleTemplates', data);
    return data;
  }
  async getGroupTransferability(groupId) { return this.request(`/groups/${groupId}/transfer`); }
  async initiateGroupTransfer(groupId, userId) { return this.request(`/groups/${groupId}/transfer`, { method: 'POST', body: JSON.stringify({ userId }) }); }
  async cancelGroupTransfer(groupId) { return this.request(`/groups/${groupId}/transfer`, { method: 'DELETE' }); }
  async updateGroupRepresentation(groupId, data) { return this.request(`/groups/${groupId}/representation`, { method: 'PUT', body: JSON.stringify(data) }); }

  // ==================== Instances ====================
  async getInstance(worldId, instanceId) { return this.request(`/instances/${worldId}:${instanceId}`); }
  async getInstanceByShortName(shortName) { return this.request(`/instances/s/${shortName}`); }
  async getShortName(instanceId) { return this.request(`/instances/${instanceId}/shortName`); }
  async getRecentLocations(params = {}) { return this.request(`/instances/recent?${new URLSearchParams({ n: 20, ...params })}`); }
  async createInstance(data) { return this.request('/instances', { method: 'POST', body: JSON.stringify(data) }); }
  async closeInstance(worldId, instanceId) { return this.request(`/instances/${worldId}:${instanceId}`, { method: 'DELETE' }); }

  // ==================== Notifications ====================
  async getNotifications(params = {}) { return this.request(`/auth/user/notifications?${new URLSearchParams({ n: 50, offset: 0, ...params })}`); }
  async getNotification(notifId) { return this.request(`/auth/user/notifications/${notifId}`); }
  async getNotificationsV2(params = {}) { return this.request(`/notifications?${new URLSearchParams({ n: 50, ...params })}`); }
  async getNotificationV2(notifId) { return this.request(`/notifications/${notifId}`); }
  async markNotificationRead(notifId) { return this.request(`/auth/user/notifications/${notifId}/see`, { method: 'PUT' }); }
  async deleteNotification(notifId) { return this.request(`/auth/user/notifications/${notifId}/hide`, { method: 'PUT' }); }
  async clearNotifications() { return this.request('/auth/user/notifications/clear', { method: 'PUT' }); }
  async acceptFriendRequest(notifId) { return this.request(`/auth/user/notifications/${notifId}/accept`, { method: 'PUT' }); }
  async acknowledgeNotificationV2(notifId) { return this.request(`/notifications/${notifId}/acknowledge`, { method: 'POST' }); }
  async deleteNotificationV2(notifId) { return this.request(`/notifications/${notifId}`, { method: 'DELETE' }); }
  async deleteAllNotificationV2s() { return this.request('/notifications', { method: 'DELETE' }); }
  async replyNotificationV2(notifId, data) { return this.request(`/notifications/${notifId}/reply`, { method: 'POST', body: JSON.stringify(data) }); }
  async respondNotificationV2(notifId, data) { return this.request(`/notifications/${notifId}/respond`, { method: 'POST', body: JSON.stringify(data) }); }

  // ==================== Economy ====================
  async getSubscriptions() {
    const cached = this._getCached('subscriptions', 600000); // 10 min
    if (cached) return cached;
    const data = await this.request('/subscriptions');
    this._setCache('subscriptions', data);
    return data;
  }
  async getCurrentSubscriptions() { return this.request('/auth/user/subscription'); }
  async getRecentSubscription() { return this.request('/auth/user/subscription/recent'); }
  async getBalance() { return this.request('/user/balance'); }
  async getBalanceEarnings() { return this.request('/user/balance/earnings'); }
  async getTokenBundles() {
    const cached = this._getCached('tokenBundles', 600000); // 10 min
    if (cached) return cached;
    const data = await this.request('/tokenBundles');
    this._setCache('tokenBundles', data);
    return data;
  }
  async getEconomyAccount() { return this.request('/economy/account'); }
  async getActiveLicenses() { return this.request('/user/licenses'); }
  async getLicenseGroup(licenseGroupId) { return this.request(`/licenseGroups/${licenseGroupId}`); }
  async getProductListing(listingId) { return this.request(`/listing/${listingId}`); }
  async getProductListingAlternate(listingId) { return this.request(`/listing/${listingId}/alt`); }
  async getUserProductListings(userId) { return this.request(`/users/${userId}/listings`); }
  async getProductPurchases(params = {}) { return this.request(`/user/purchases?${new URLSearchParams(params)}`); }
  async getBulkGiftPurchases(params = {}) { return this.request(`/user/purchases/bulk?${new URLSearchParams(params)}`); }
  async purchaseProductListing(listingId, data = {}) { return this.request(`/listing/${listingId}/purchase`, { method: 'POST', body: JSON.stringify(data) }); }
  async getSteamTransactions() { return this.request('/Steam/transactions'); }
  async getSteamTransaction(transactionId) { return this.request(`/Steam/transactions/${transactionId}`); }
  async getTiliaStatus() { return this.request('/tilia/status'); }
  async getTiliaTos() { return this.request('/tilia/tos'); }
  async updateTiliaTos(data) { return this.request('/tilia/tos', { method: 'PUT', body: JSON.stringify(data) }); }
  async getStoreShelves() { return this.request('/store/shelves'); }
  async getStore() { return this.request('/store'); }
  async getUserCreditsEligible() { return this.request('/user/credits/eligible'); }
  async getUserSubscriptionEligible() { return this.request('/user/subscription/eligible'); }

  // ==================== Inventory ====================
  async getInventory(params = {}) { return this.request(`/inventory?${new URLSearchParams({ n: 60, offset: 0, ...params })}`); }
  async getInventoryByType(type, params = {}) { return this.request(`/inventory?${new URLSearchParams({ n: 60, offset: 0, types: type, ...params })}`); }
  async getInventoryCollections() { return this.request('/inventory/collections'); }
  async getInventoryDrops(params = {}) { return this.request(`/inventory/drops?${new URLSearchParams({ n: 60, ...params })}`); }
  async getInventoryTemplate(templateId) { return this.request(`/inventory/templates/${templateId}`); }
  async getOwnInventoryItem(itemId) { return this.request(`/inventory/${itemId}`); }
  async getUserInventoryItem(userId, itemId) { return this.request(`/users/${userId}/inventory/${itemId}`); }
  async consumeOwnInventoryItem(itemId) { return this.request(`/inventory/${itemId}/consume`, { method: 'PUT' }); }
  async deleteOwnInventoryItem(itemId) { return this.request(`/inventory/${itemId}`, { method: 'DELETE' }); }
  async equipOwnInventoryItem(itemId) { return this.request(`/inventory/${itemId}/equip`, { method: 'PUT' }); }
  async unequipOwnInventorySlot(slot) { return this.request(`/inventory/slots/${slot}`, { method: 'DELETE' }); }
  async updateOwnInventoryItem(itemId, data) { return this.request(`/inventory/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async shareInventoryItemDirect(itemId, data) { return this.request(`/inventory/${itemId}/share`, { method: 'POST', body: JSON.stringify(data) }); }
  async shareInventoryItemPedestal(itemId) { return this.request(`/inventory/${itemId}/share/pedestal`); }
  async spawnInventoryItem(itemId) { return this.request(`/inventory/${itemId}/spawn`); }

  // ==================== Files ====================
  async getFiles(params = {}) { return this.request(`/files?${new URLSearchParams({ n: 20, ...params })}`); }
  async getFile(fileId) { return this.request(`/file/${fileId}`); }
  async createFile(data) { throw { status: 403, message: 'Content upload is disabled per VRChat Creator Guidelines' }; }
  async deleteFile(fileId) { return this.request(`/file/${fileId}`, { method: 'DELETE' }); }
  async createFileVersion(fileId, data) { throw { status: 403, message: 'Content upload is disabled per VRChat Creator Guidelines' }; }
  async deleteFileVersion(fileId, versionId) { return this.request(`/file/${fileId}/${versionId}`, { method: 'DELETE' }); }
  async downloadFileVersion(fileId, versionId) { return this.request(`/file/${fileId}/${versionId}`); }
  async getFileDataUploadStatus(fileId, versionId, fileType) { return this.request(`/file/${fileId}/${versionId}/${fileType}/status`); }
  async startFileDataUpload(fileId, versionId, fileType) { throw { status: 403, message: 'Content upload is disabled per VRChat Creator Guidelines' }; }
  async finishFileDataUpload(fileId, versionId, fileType, data) { throw { status: 403, message: 'Content upload is disabled per VRChat Creator Guidelines' }; }
  async getFileAnalysis(fileId, versionId) { return this.request(`/file/${fileId}/${versionId}/analysis`); }
  async getFileAnalysisSecurity(fileId, versionId) { return this.request(`/file/${fileId}/${versionId}/analysis/security`); }
  async getFileAnalysisStandard(fileId, versionId) { return this.request(`/file/${fileId}/${versionId}/analysis/standard`); }
  async getContentAgreementStatus() { return this.request('/file/agreement'); }
  async submitContentAgreement(data) { return this.request('/file/agreement', { method: 'POST', body: JSON.stringify(data) }); }

  // ==================== Invite ====================
  async getInviteMessages(userId, messageType = 'message') { return this.request(`/message/${userId}/${messageType}`); }
  async getInviteMessage(userId, messageType, slot) { return this.request(`/message/${userId}/${messageType}/${slot}`); }
  async updateInviteMessage(userId, messageType, slot, data) { return this.request(`/message/${userId}/${messageType}/${slot}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async resetInviteMessage(userId, messageType, slot) { return this.request(`/message/${userId}/${messageType}/${slot}`, { method: 'DELETE' }); }
  async inviteUser(userId, data) { return this.request(`/invite/${userId}`, { method: 'POST', body: JSON.stringify(data) }); }
  async inviteUserWithPhoto(userId, data) { return this.request(`/invite/${userId}/photo`, { method: 'POST', body: JSON.stringify(data) }); }
  async inviteMyselfTo(worldId, instanceId) { return this.request(`/invite/myself/to/${worldId}:${instanceId}`, { method: 'POST' }); }
  async requestInvite(userId) { return this.request(`/requestInvite/${userId}`, { method: 'POST' }); }
  async requestInviteWithPhoto(userId, data) { return this.request(`/requestInvite/${userId}/photo`, { method: 'POST', body: JSON.stringify(data) }); }
  async respondInvite(notifId, data) { return this.request(`/invite/${notifId}/response`, { method: 'POST', body: JSON.stringify(data) }); }
  async respondInviteWithPhoto(notifId, data) { return this.request(`/invite/${notifId}/response/photo`, { method: 'POST', body: JSON.stringify(data) }); }

  // ==================== Jams ====================
  async getJams() { return this.request('/jams'); }
  async getJam(jamId) { return this.request(`/jams/${jamId}`); }
  async getJamSubmissions(jamId) { return this.request(`/jams/${jamId}/submissions`); }

  // ==================== Calendar ====================
  async getCalendarEvents(params = {}) { return this.request(`/events?${new URLSearchParams({ n: 20, offset: 0, ...params })}`); }
  async getFeaturedCalendarEvents() { return this.request('/events/featured'); }
  async getFollowedCalendarEvents(params = {}) { return this.request(`/events/followed?${new URLSearchParams({ n: 20, ...params })}`); }
  async discoverCalendarEvents(params = {}) { return this.request(`/events/discover?${new URLSearchParams({ n: 20, ...params })}`); }
  async searchCalendarEvents(query, params = {}) { return this.request(`/events/search?${new URLSearchParams({ n: 20, query, ...params })}`); }
  async getGroupCalendarEvents(groupId, params = {}) { return this.request(`/groups/${groupId}/events?${new URLSearchParams({ n: 20, ...params })}`); }
  async getGroupCalendarEvent(groupId, eventId) { return this.request(`/groups/${groupId}/events/${eventId}`); }
  async getGroupNextCalendarEvent(groupId) { return this.request(`/groups/${groupId}/events/next`); }
  async createGroupCalendarEvent(groupId, data) { return this.request(`/groups/${groupId}/events`, { method: 'POST', body: JSON.stringify(data) }); }
  async updateGroupCalendarEvent(groupId, eventId, data) { return this.request(`/groups/${groupId}/events/${eventId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteGroupCalendarEvent(groupId, eventId) { return this.request(`/groups/${groupId}/events/${eventId}`, { method: 'DELETE' }); }
  async followCalendarEvent(groupId, eventId) { return this.request(`/groups/${groupId}/events/${eventId}/follow`, { method: 'POST' }); }
  async getCalendarEventICS(groupId, eventId) { return this.request(`/groups/${groupId}/events/${eventId}/ics`); }

  // ==================== Player Moderation ====================
  async getPlayerModerations() { return this.request('/auth/user/playermoderations'); }
  async moderateUser(data) { return this.request('/auth/user/playermoderations', { method: 'POST', body: JSON.stringify(data) }); }
  async unmoderateUser(data) { return this.request('/auth/user/unplayermoderate', { method: 'PUT', body: JSON.stringify(data) }); }
  async clearAllPlayerModerations() { return this.request('/auth/user/playermoderations', { method: 'DELETE' }); }

  // ==================== Prints ====================
  async getUserPrints(params = {}) {
    const userId = this.currentUser?.id;
    if (!userId) throw { status: 401, message: 'Not logged in' };
    return this.request(`/prints/user/${userId}?${new URLSearchParams({ n: 20, ...params })}`);
  }
  async getPrint(printId) { return this.request(`/prints/${printId}`); }
  async editPrint(printId, data) { return this.request(`/prints/${printId}`, { method: 'POST', body: JSON.stringify(data) }); }
  async deletePrint(printId) { return this.request(`/prints/${printId}`, { method: 'DELETE' }); }
  async uploadPrint(data) { throw { status: 403, message: 'Content upload is disabled per VRChat Creator Guidelines' }; }

  // ==================== Props ====================
  async listProps(params = {}) { return this.request(`/props?${new URLSearchParams({ n: 20, ...params })}`); }
  async getProp(propId) { return this.request(`/props/${propId}`); }
  async createProp(data) { throw { status: 403, message: 'Content upload is disabled per VRChat Creator Guidelines' }; }
  async updateProp(propId, data) { return this.request(`/props/${propId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  async deleteProp(propId) { return this.request(`/props/${propId}`, { method: 'DELETE' }); }
  async getPropPublishStatus(propId) { return this.request(`/props/${propId}/publish`); }
  async publishProp(propId) { return this.request(`/props/${propId}/publish`, { method: 'PUT' }); }
  async unpublishProp(propId) { return this.request(`/props/${propId}/publish`, { method: 'DELETE' }); }
}

export const api = new VRChatAPI();
export { getUserAgent, setUserAgentEmail, hasUserAgent };
export default api;
