// assets/js/social.js

const Social = {
  _activeFriendId: null,
  _pollInterval: null,

  init: async function () {
    if (typeof Auth !== "undefined" && !Auth.userData) await Auth.checkSession();
    this.loadFriends();
    this.updateRequestBadge();
  },

  _esc: function (str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  },

  searchStudents: async function (query) {
    const list = document.getElementById("friendsList");
    if (query.length < 2) { this.loadFriends(); return; }
    try {
      const res = await fetch(`api/social/search_users.php?query=${encodeURIComponent(query)}`);
      const result = await res.json();
      if (!result.success) return;
      if (result.data.length === 0) {
        list.innerHTML = `<p class="text-center text-gray-400 text-xs mt-10">No students found</p>`;
        return;
      }
      // For each result, check friendship status
      list.innerHTML = `<p class="text-[9px] font-bold text-orange-500 uppercase px-2 mb-2 tracking-widest">Results</p>`;
      for (const u of result.data) {
        const fRes = await fetch(`api/social/check_friendship.php?target_id=${u.user_id}`).then(r=>r.json());
        const status = fRes.success ? fRes.data.status : 'none';
        const fId    = fRes.success ? fRes.data.friendship_id : null;
        let actionBtn = '';
        if (status === 'accepted') {
          actionBtn = `<button onclick="Social.removeFriend(${fId})" class="text-[10px] bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-50 hover:text-red-500 transition shrink-0 ml-2">Remove</button>`;
        } else if (status === 'pending') {
          actionBtn = `<span class="text-[10px] text-gray-400 font-semibold ml-2 shrink-0">Pending</span>`;
        } else {
          actionBtn = `<button onclick="Social.sendRequest(${u.user_id})" class="text-[10px] bg-gray-900 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-600 transition shrink-0 ml-2">Add</button>`;
        }
        list.innerHTML += `
          <div class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm mb-2">
            <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onclick="Social.showUserProfile(${u.user_id}, '${this._esc(u.full_name)}', '${this._esc(u.university)}')">
              <div class="w-9 h-9 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">${u.full_name[0]}</div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-800 truncate">${this._esc(u.full_name)}</p>
                <p class="text-[10px] text-gray-400 truncate">${this._esc(u.university)}</p>
              </div>
            </div>
            ${actionBtn}
          </div>`;
      }
    } catch (e) { console.error(e); }
  },

  showUserProfile: async function (userId, name, university) {
    const overlay = document.getElementById("modalOverlay");
    const body    = document.getElementById("modalBody");
    if (!overlay || !body) return;

    body.innerHTML = `<div class="p-8 text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div></div>`;
    overlay.classList.remove("hidden"); overlay.classList.add("flex");
    const wrapper = body.closest(".bg-white");
    if (wrapper) wrapper.className = "bg-white rounded-2xl shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 duration-200";

    try {
      const res = await fetch(`api/profile/get_profile.php?user_id=${userId}`);
      const result = await res.json();
      const p = result.success ? result.data : {};

      const links = p.links || [];
      const linksHtml = links.length
        ? links.map(l => `<a href="${l}" target="_blank" class="text-xs text-orange-600 hover:underline truncate block">${l}</a>`).join('')
        : '<p class="text-xs text-gray-400">No links added</p>';

      const fRes = await fetch(`api/social/check_friendship.php?target_id=${userId}`).then(r=>r.json());
      const status = fRes.success ? fRes.data.status : 'none';
      const fId    = fRes.success ? fRes.data.friendship_id : null;

      let actionBtn = '';
      if (status === 'accepted') {
        actionBtn = `<button onclick="Social.removeFriend(${fId}); UI.closeModal();" class="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-red-50 hover:text-red-500 transition">Remove Friend</button>`;
      } else if (status === 'pending') {
        actionBtn = `<button disabled class="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-semibold">Request Pending</button>`;
      } else {
        actionBtn = `<button onclick="Social.sendRequest(${userId}); UI.closeModal();" class="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition">Add Friend</button>`;
      }

      body.innerHTML = `
        <div class="p-8">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold text-2xl">${name[0]}</div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">${this._esc(name)}</h3>
              <p class="text-xs text-gray-400">${this._esc(p.university || university)}</p>
              ${p.programme ? `<p class="text-xs text-orange-600 font-semibold mt-0.5">${this._esc(p.programme || p.github_url || '')}</p>` : ''}
            </div>
          </div>
          ${p.bio ? `<p class="text-sm text-gray-600 mb-4 leading-relaxed">${this._esc(p.bio)}</p>` : ''}
          ${links.length ? `<div class="mb-5"><p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Links</p>${linksHtml}</div>` : ''}
          <div class="flex gap-3">
            ${actionBtn}
            <button onclick="UI.closeModal()" class="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100 transition">Close</button>
          </div>
        </div>`;
    } catch (e) {
      body.innerHTML = `<div class="p-8 text-center text-red-400 text-sm">Failed to load profile.</div>`;
    }
  },

  sendRequest: async function (receiverId) {
    try {
      const res = await fetch("api/social/send_request.php", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      const result = await res.json();
      alert(result.message);
      if (result.success) { document.getElementById("peerSearch").value = ""; this.loadFriends(); }
    } catch (e) { alert("Connection error."); }
  },

  removeFriend: async function (friendshipId) {
    if (!confirm("Remove this friend?")) return;
    try {
      const res = await fetch("api/social/remove_friend.php", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });
      const result = await res.json();
      if (result.success) this.loadFriends();
      else alert(result.message);
    } catch (e) { console.error(e); }
  },

  loadFriends: async function () {
    const list = document.getElementById("friendsList");
    if (!list) return;
    try {
      const res = await fetch("api/social/get_friends.php");
      const result = await res.json();
      if (!result.success) return;
      if (result.data.length === 0) {
        list.innerHTML = `<div class="px-4 py-10 text-center"><p class="text-xs font-semibold text-gray-400 mb-1">No connections yet</p><p class="text-[10px] text-gray-300">Search for classmates above.</p></div>`;
        return;
      }
      list.innerHTML = result.data.map(f => `
        <div class="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-100 transition-all shadow-sm mb-2"
             onclick="Social.openPrivateChat(${f.friend_id}, '${this._esc(f.full_name)}')">
          <div class="w-9 h-9 bg-orange-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">${f.full_name[0]}</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">${this._esc(f.full_name)}</p>
            <p class="text-[10px] text-gray-400 truncate">${this._esc(f.university)}</p>
          </div>
          <button onclick="event.stopPropagation(); Social.showUserProfile(${f.friend_id}, '${this._esc(f.full_name)}', '${this._esc(f.university)}')"
                  class="p-1.5 text-gray-300 hover:text-orange-500 transition shrink-0">
            <i class="ri-information-line text-base"></i>
          </button>
        </div>`).join("");
    } catch (e) { console.error(e); }
  },

  loadPendingRequests: async function () {
    UI.openModal("loading");
    try {
      const res = await fetch("api/social/get_pending_requests.php");
      const result = await res.json();
      const body = document.getElementById("modalBody");
      if (!result.success) return;
      if (result.data.length === 0) {
        body.innerHTML = `<div class="text-center py-12 px-6"><i class="ri-notification-off-line text-4xl text-gray-200 block mb-3"></i><h2 class="text-base font-bold text-gray-800">Inbox Zero</h2><p class="text-gray-400 text-xs mt-1 mb-6">No pending requests.</p><button class="py-2.5 px-6 bg-gray-100 rounded-xl font-semibold text-xs text-gray-600" onclick="UI.closeModal()">Close</button></div>`;
        return;
      }
      body.innerHTML = `
        <div class="p-6">
          <h2 class="text-base font-bold text-gray-900 mb-4">Friend Requests</h2>
          <div class="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
            ${result.data.map(r => `
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div class="flex items-center gap-3 cursor-pointer" onclick="Social.showUserProfile(${r.user_id || 0}, '${this._esc(r.full_name)}', '${this._esc(r.university)}')">
                  <div class="w-9 h-9 bg-orange-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">${r.full_name[0]}</div>
                  <div><p class="text-sm font-semibold text-gray-800">${this._esc(r.full_name)}</p><p class="text-[10px] text-gray-400">${this._esc(r.university)}</p></div>
                </div>
                <div class="flex gap-2">
                  <button onclick="Social.handleRequest(${r.friendship_id}, 'accepted')" class="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-700 transition">Accept</button>
                  <button onclick="Social.handleRequest(${r.friendship_id}, 'blocked')" class="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">Ignore</button>
                </div>
              </div>`).join("")}
          </div>
        </div>`;
    } catch (e) { console.error(e); }
  },

  handleRequest: async function (friendshipId, status) {
    try {
      const res = await fetch("api/social/handle_request.php", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, status }),
      });
      const result = await res.json();
      if (result.success) { this.loadPendingRequests(); this.loadFriends(); this.updateRequestBadge(); }
    } catch (e) { alert("Error."); }
  },

  updateRequestBadge: async function () {
    try {
      const res = await fetch("api/social/get_pending_requests.php");
      const result = await res.json();
      const badge = document.getElementById("requestCount");
      if (!badge) return;
      if (result.success && result.data.length > 0) {
        badge.textContent = result.data.length; badge.classList.remove("hidden");
      } else { badge.classList.add("hidden"); }
    } catch (e) {}
  },

  openPrivateChat: function (friendId, name) {
    if (this._pollInterval) { clearInterval(this._pollInterval); this._pollInterval = null; }
    this._activeFriendId = friendId;
    const chatArea = document.getElementById("privateChatArea");
    if (!chatArea) return;

    chatArea.innerHTML = `
      <div class="flex flex-col w-full h-full overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex items-center gap-3 shrink-0 bg-white">
          <div class="w-9 h-9 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-sm">${name[0]}</div>
          <div>
            <h3 class="font-bold text-gray-900 text-base cursor-pointer hover:text-orange-600 transition"
                onclick="Social.showUserProfile(${friendId}, '${this._esc(name)}', '')">${this._esc(name)}</h3>
            <p class="text-[10px] text-gray-400">Click name to view profile</p>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto no-scrollbar bg-gray-50/30" id="privateChatScrollContainer">
          <div class="p-5 space-y-3" id="privateChatFeed">
            <p class="text-center text-xs text-gray-300 mt-10 animate-pulse">Loading...</p>
          </div>
        </div>
        <div class="p-4 bg-white border-t border-gray-100 shrink-0">
          <form onsubmit="event.preventDefault(); Social.sendPrivateMessage(${friendId});" class="flex gap-2 items-center">
            <button type="button" onclick="document.getElementById('privateMsgFile').click()" class="p-2 text-gray-400 hover:text-orange-600 transition shrink-0">
              <i class="ri-attachment-2 text-lg"></i>
            </button>
            <input type="file" id="privateMsgFile" class="hidden" onchange="Social.sendFileMessage(${friendId}, this)">
            <input type="text" id="privateMsgInput" placeholder="Message ${this._esc(name)}..."
                   class="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl outline-none text-sm focus:bg-white focus:ring-1 focus:ring-orange-300 transition">
            <button type="submit" class="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center hover:bg-orange-700 transition shrink-0">
              <i class="ri-send-plane-2-fill text-base"></i>
            </button>
          </form>
        </div>
      </div>`;

    this.loadPrivateMessages(friendId);
    this._pollInterval = setInterval(() => {
      if (this._activeFriendId === friendId) this.loadPrivateMessages(friendId, true);
    }, 5000);
  },

  sendFileMessage: async function (friendId, input) {
    if (!input.files[0]) return;
    const fd = new FormData();
    fd.append("resourceFile", input.files[0]);
    fd.append("isDM", "true");
    try {
      const res = await fetch("api/collaboration/upload_resource.php", { method: "POST", body: fd });
      const uploadResult = await res.json();
      if (uploadResult.success) {
        await fetch("api/communication/chat.php", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId: friendId, messageText: `📎 ${input.files[0].name}`, attachment: uploadResult.data.url }),
        });
        this.loadPrivateMessages(friendId);
      } else { alert(uploadResult.message || "Upload failed."); }
      input.value = "";
    } catch (e) { alert("Upload error."); }
  },

  loadPrivateMessages: async function (friendId, silent = false) {
    const feed = document.getElementById("privateChatFeed");
    const sc   = document.getElementById("privateChatScrollContainer");
    if (!feed || !sc) return;
    const wasAtBottom = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 60;
    try {
      const res = await fetch(`api/communication/chat.php?friendId=${friendId}`);
      const result = await res.json();
      const myId = Auth.userData ? Auth.userData.user_id : null;
      if (!result.success) return;
      if (result.data.length === 0) {
        if (!silent) feed.innerHTML = `<p class="text-center text-gray-400 text-xs mt-10">No messages yet. Say hello!</p>`;
        return;
      }
      feed.innerHTML = result.data.map(m => {
        const isMe = m.sender_id == myId;
        const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "";
        const isAttachment = m.attachment && m.attachment.length > 0;
        const content = isAttachment
          ? `<div class="flex items-center gap-2"><i class="ri-file-line text-sm opacity-70"></i><a href="${m.attachment}" target="_blank" class="underline font-semibold text-sm">${this._esc(m.message_text)}</a></div>`
          : `<p class="text-sm leading-relaxed">${this._esc(m.message_text)}</p>`;
        return `
          <div class="flex flex-col ${isMe ? "items-end" : "items-start"}">
            <div class="px-4 py-2.5 rounded-2xl max-w-[75%] ${isMe ? "bg-orange-600 text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"}">
              ${content}
            </div>
            <span class="text-[9px] text-gray-300 mt-0.5 px-1">${time}</span>
          </div>`;
      }).join("");
      if (!silent || wasAtBottom) setTimeout(() => sc.scrollTo({top:sc.scrollHeight,behavior:"smooth"}), 80);
    } catch (e) { console.error(e); }
  },

  sendPrivateMessage: async function (receiverId) {
    const input = document.getElementById("privateMsgInput");
    const text = input.value.trim();
    if (!text) return;
    try {
      const res = await fetch("api/communication/chat.php", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, messageText: text }),
      });
      const result = await res.json();
      if (result.success) { input.value = ""; this.loadPrivateMessages(receiverId); }
    } catch (e) { console.error(e); }
  },
};
