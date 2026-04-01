// assets/js/groups.js

const Groups = {
  allPublicGroups: [],
  activeGroupId: null,
  _pollInterval: null,

  init: async function () {
    if (typeof Auth !== "undefined" && !Auth.userData) {
      await Auth.checkSession();
    }
    this.loadSidebar();
  },

  create: async function () {
    const groupData = {
      groupName: document.getElementById("group_name").value.trim(),
      description: document.getElementById("description").value.trim(),
      subject: document.getElementById("subject").value.trim(),
      category: document.getElementById("category").value,
      privacy: document.getElementById("privacy_setting").value,
    };
    if (!groupData.groupName || !groupData.category) {
      alert("Group name and category are required.");
      return;
    }
    try {
      const res = await fetch("api/collaboration/create_group.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });
      const result = await res.json();
      if (result.success) {
        UI.closeModal();
        this.loadSidebar();
      } else {
        alert(result.message);
      }
    } catch (e) {
      alert("Connection error.");
    }
  },

  loadSidebar: async function () {
    const sidebar = document.getElementById("groupsSidebar");
    if (!sidebar) return;
    try {
      const res = await fetch("api/collaboration/get_my_groups.php");
      const result = await res.json();
      if (result.success) {
        if (result.data.length === 0) {
          sidebar.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <i class="ri-group-line text-xl text-gray-400"></i>
              </div>
              <p class="text-xs font-semibold text-gray-400 mb-1">No groups yet</p>
              <p class="text-[10px] text-gray-300">Create one or explore public groups below.</p>
            </div>`;
          return;
        }
        sidebar.innerHTML = result.data.map((g) => `
          <div onclick="Groups.openWorkspace(${g.group_id}, '${g.group_name.replace(/'/g,"\\'")}', '${g.privacy_setting}')"
               class="p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm mb-2">
            <div class="flex justify-between items-start mb-1">
              <h4 class="font-semibold text-gray-800 truncate text-sm flex-1">${g.group_name}</h4>
              <span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-semibold uppercase ml-1 shrink-0">${g.subject || "GEN"}</span>
            </div>
            <div class="flex justify-between items-center mt-1">
              <p class="text-[11px] text-gray-400">${g.category}</p>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${g.privacy_setting === 'private' ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400'}">${g.privacy_setting === 'private' ? '🔒 Private' : 'Public'}</span>
            </div>
          </div>`).join("");
      }
    } catch (e) {
      sidebar.innerHTML = `<p class="text-red-400 text-xs text-center mt-4">Failed to load groups.</p>`;
    }
  },

  explore: async function () {
    const sidebar = document.getElementById("groupsSidebar");
    sidebar.innerHTML = `
      <div class="px-2 mb-3">
        <div class="flex items-center gap-2 mb-3">
          <button onclick="Groups.loadSidebar()" class="text-orange-600 text-[10px] font-semibold hover:underline">← Back</button>
          <span class="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Explore</span>
        </div>
        <input type="text" id="groupSearch" placeholder="Search by name..." onkeyup="Groups.filterExplore(this.value)"
               class="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs outline-none focus:border-orange-400">
      </div>
      <div id="exploreList"><p class="text-center text-xs text-gray-400 mt-4">Loading...</p></div>`;
    try {
      const res = await fetch("api/collaboration/get_public_groups.php");
      const result = await res.json();
      if (result.success) {
        this.allPublicGroups = result.data;
        this.renderExplore(result.data);
      }
    } catch (e) { console.error(e); }
  },

  filterExplore: function (q) {
    const f = this.allPublicGroups.filter(g =>
      g.group_name.toLowerCase().includes(q.toLowerCase()) ||
      (g.subject && g.subject.toLowerCase().includes(q.toLowerCase()))
    );
    this.renderExplore(f);
  },

  renderExplore: function (groups) {
    const list = document.getElementById("exploreList");
    if (!list) return;
    if (groups.length === 0) {
      list.innerHTML = `<p class="text-xs text-gray-400 text-center mt-4">No groups found.</p>`;
      return;
    }
    list.innerHTML = groups.map(g => `
      <div class="p-3 bg-white border border-gray-100 rounded-xl shadow-sm mb-2 mx-1">
        <div class="flex justify-between items-start mb-1">
          <h4 class="font-semibold text-gray-800 text-sm truncate">${g.group_name}</h4>
          <span class="text-[9px] bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded font-semibold uppercase">${g.subject || "GEN"}</span>
        </div>
        <p class="text-[11px] text-gray-400 mb-2 line-clamp-2">${g.description || "Study together."}</p>
        <button onclick="Groups.join(${g.group_id})" class="w-full py-1.5 bg-gray-900 text-white text-[11px] font-semibold rounded-lg hover:bg-orange-600 transition">Join Group</button>
      </div>`).join("");
  },

  join: async function (groupId) {
    try {
      const res = await fetch("api/collaboration/join_group.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const result = await res.json();
      alert(result.message);
      if (result.success) this.loadSidebar();
    } catch (e) { alert("Error joining group."); }
  },

  joinByCode: async function () {
    const code = document.getElementById("invite_code_input").value.trim().toUpperCase();
    if (!code) return alert("Enter an invite code.");
    try {
      const res = await fetch("api/collaboration/join_by_code.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await res.json();
      alert(result.message);
      if (result.success) { UI.closeModal(); this.loadSidebar(); }
    } catch (e) { alert("Error."); }
  },

  leaveGroup: async function (groupId) {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      const res = await fetch("api/collaboration/leave_group.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const result = await res.json();
      alert(result.message);
      if (result.success) {
        UI.closeModal();
        this._stopPolling();
        this.activeGroupId = null;
        const content = document.getElementById("activeGroupContent");
        if (content) content.innerHTML = `<div class="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40"><i class="ri-side-bar-line text-5xl text-gray-200 mb-4"></i><h3 class="text-base font-semibold text-gray-400">Select a workspace to begin</h3></div>`;
        this.loadSidebar();
      }
    } catch (e) { alert("Error leaving group."); }
  },

  openWorkspace: function (groupId, name, privacy) {
    this._stopPolling();
    this.activeGroupId = groupId;
    const contentArea = document.getElementById("activeGroupContent");

    // Escape name for safe use in template literals inside onclick attrs
    const safeName = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    contentArea.innerHTML = `
      <div class="flex flex-col w-full h-full overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
          <div class="cursor-pointer" onclick="Groups.showInfo(${groupId}, '${privacy}')">
            <h3 class="font-bold text-gray-900 text-base tracking-tight leading-none">${name}</h3>
            <p class="text-[10px] text-orange-500 font-semibold mt-0.5">View info & members</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="Groups.viewTasks(${groupId})" class="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-100 transition">Tasks</button>
            <button onclick="Groups.loadResources(${groupId})" class="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition">Files</button>
            <button onclick="Groups.startMeeting(${groupId})" class="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-600 transition">Meet</button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto no-scrollbar bg-gray-50/30" id="chatScrollContainer">
          <div class="p-5 space-y-3" id="chatFeed">
            <p class="text-center text-[10px] text-gray-300 font-semibold uppercase tracking-widest mt-10 animate-pulse">Loading messages...</p>
          </div>
        </div>
        <div class="p-4 bg-white border-t border-gray-100 shrink-0">
          <form onsubmit="event.preventDefault(); Groups.sendMessage(${groupId});" class="flex gap-2 items-center">
            <button type="button" onclick="document.getElementById('groupFileInput').click()" class="p-2 text-gray-400 hover:text-orange-600 transition shrink-0">
              <i class="ri-attachment-2 text-lg"></i>
            </button>
            <input type="file" id="groupFileInput" class="hidden" onchange="Groups.uploadFile(${groupId}, this)">
            <input type="text" id="messageInput" placeholder="Message the group..."
                   class="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl outline-none text-sm focus:bg-white focus:ring-1 focus:ring-orange-300 transition">
            <button type="submit" class="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center hover:bg-orange-700 transition shrink-0">
              <i class="ri-send-plane-2-fill text-base"></i>
            </button>
          </form>
        </div>
      </div>`;

    this.loadMessages(groupId);
    this._pollInterval = setInterval(() => {
      if (this.activeGroupId === groupId) this.loadMessages(groupId, true);
    }, 5000);
  },

  _stopPolling: function () {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  },

  _escapeHtml: function (str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  loadMessages: async function (groupId, silent = false) {
    const feed = document.getElementById("chatFeed");
    const scrollContainer = document.getElementById("chatScrollContainer");
    if (!feed || !scrollContainer) return;

    const wasAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 60;

    try {
      const res = await fetch(`api/communication/chat.php?groupId=${groupId}`);
      const result = await res.json();
      const myId = Auth.userData ? Auth.userData.user_id : null;

      if (result.success) {
        if (result.data.length === 0) {
          if (!silent) feed.innerHTML = `<p class="text-center text-gray-400 text-xs mt-10 font-semibold">No messages yet. Say hello!</p>`;
          return;
        }

        feed.innerHTML = result.data.map((msg) => {
          // System messages
          if (msg.is_system == 1) {
            // Detect meeting links - render them nicely
            if (msg.message_text.includes('meet.google.com') || msg.message_text.includes('Join Meeting')) {
              const urlMatch = msg.message_text.match(/href='([^']+)'/);
              const url = urlMatch ? urlMatch[1] : '#';
              return `
                <div class="flex justify-center my-3">
                  <div class="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex items-center gap-3 max-w-xs">
                    <i class="ri-video-chat-line text-orange-600 text-lg"></i>
                    <div>
                      <p class="text-xs font-semibold text-gray-700">Study session started</p>
                      <a href="${url}" target="_blank" class="text-xs font-bold text-orange-600 hover:underline">Join Meeting →</a>
                    </div>
                  </div>
                </div>`;
            }
            return `<div class="flex justify-center my-2"><span class="bg-white text-gray-400 text-[10px] font-semibold py-1 px-3 rounded-full border border-gray-100">${this._escapeHtml(msg.message_text)}</span></div>`;
          }

          const isMe = msg.sender_id == myId;
          // Check if it's a file link message from PHP
          const isFileMsg = msg.message_text && msg.message_text.includes("Shared a file:");
          let bubbleContent;
          if (isFileMsg) {
            const nameMatch = msg.message_text.match(/>([^<]+)<\/a>/);
            const urlMatch = msg.message_text.match(/href='([^']+)'/);
            const fname = nameMatch ? nameMatch[1] : "File";
            const furl = urlMatch ? urlMatch[1] : "#";
            bubbleContent = `<div class="flex items-center gap-2"><i class="ri-file-line text-sm opacity-70"></i><a href="${furl}" target="_blank" class="underline font-semibold text-sm">${this._escapeHtml(fname)}</a></div>`;
          } else {
            bubbleContent = `<p class="text-sm leading-relaxed">${this._escapeHtml(msg.message_text)}</p>`;
          }

          const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '';

          return `
            <div class="flex flex-col ${isMe ? "items-end" : "items-start"}">
              ${!isMe ? `<span class="text-[10px] font-semibold text-gray-400 mb-1 px-1">${this._escapeHtml(msg.full_name)}</span>` : ''}
              <div class="px-4 py-2.5 rounded-2xl max-w-[75%] ${isMe ? "bg-orange-600 text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"}">
                ${bubbleContent}
              </div>
              <span class="text-[9px] text-gray-300 mt-0.5 px-1">${time}</span>
            </div>`;
        }).join("");

        if (!silent || wasAtBottom) {
          setTimeout(() => {
            scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: "smooth" });
          }, 80);
        }
      }
    } catch (e) { console.error(e); }
  },

  sendMessage: async function (groupId) {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (!text) return;
    try {
      const res = await fetch("api/communication/chat.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, messageText: text }),
      });
      const result = await res.json();
      if (result.success) {
        input.value = "";
        this.loadMessages(groupId);
      }
    } catch (e) { console.error(e); }
  },

  uploadFile: async function (groupId, input) {
    if (!input.files[0]) return;
    const formData = new FormData();
    formData.append("resourceFile", input.files[0]);
    formData.append("groupId", groupId);
    try {
      const res = await fetch("api/collaboration/upload_resource.php", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success) this.loadMessages(groupId);
      else alert(result.message || "Upload failed.");
      input.value = "";
    } catch (e) { alert("Upload failed."); }
  },

  loadResources: async function (groupId) {
    UI.openModal("loading");
    try {
      const res = await fetch(`api/collaboration/get_resources.php?groupId=${groupId}`);
      const result = await res.json();
      if (result.success) {
        document.getElementById("modalBody").innerHTML = `
          <div class="p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">Group Files</h2>
            <div class="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
              ${result.data.length === 0
                ? '<p class="text-center text-gray-400 py-10 text-sm">No files shared yet.</p>'
                : result.data.map(file => `
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase">${file.file_type || "FILE"}</div>
                      <div>
                        <p class="text-sm font-semibold text-gray-800 truncate max-w-[160px]">${file.file_name}</p>
                        <p class="text-[10px] text-gray-400">by ${file.full_name}</p>
                      </div>
                    </div>
                    <a href="${file.file_path}" target="_blank" class="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"><i class="ri-download-line text-base"></i></a>
                  </div>`).join("")}
            </div>
            <button class="w-full mt-5 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition" onclick="UI.closeModal()">Close</button>
          </div>`;
      }
    } catch (e) { console.error(e); }
  },

  viewTasks: async function (groupId) {
    UI.openModal("loading");
    try {
      const [taskRes, memberRes] = await Promise.all([
        fetch(`api/collaboration/tasks.php?groupId=${groupId}`).then(r => r.json()),
        fetch(`api/collaboration/get_group_details.php?groupId=${groupId}`).then(r => r.json()),
      ]);

      const myId = Auth.userData ? Auth.userData.user_id : null;
      const myRecord = memberRes.data.members.find(m => m.user_id == myId);
      const isAdmin = myRecord && (myRecord.role === "admin" || myRecord.role === "owner");

      let html = `<div class="p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-5">Group Tasks</h2>`;

      if (isAdmin) {
        html += `
          <div class="bg-orange-50 p-4 rounded-xl mb-5 border border-orange-100">
            <p class="text-[10px] font-bold text-orange-500 uppercase mb-3 tracking-widest">Assign New Task</p>
            <input type="text" id="newTaskName" placeholder="Task description..." class="w-full p-3 text-sm rounded-lg bg-white border border-gray-200 mb-2 outline-none focus:border-orange-400">
            <div class="flex gap-2">
              <select id="taskAssignee" class="flex-1 p-3 text-xs rounded-lg bg-white border border-gray-200 outline-none">
                <option value="">Everyone</option>
                ${memberRes.data.members.map(m => `<option value="${m.user_id}">${m.full_name}</option>`).join("")}
              </select>
              <button onclick="Groups.createTask(${groupId})" class="bg-orange-600 text-white px-5 rounded-lg text-xs font-bold hover:bg-orange-700 transition">Assign</button>
            </div>
          </div>`;
      }

      html += `<div class="space-y-2 max-h-80 overflow-y-auto no-scrollbar">`;
      if (taskRes.data.length === 0) {
        html += `<p class="text-center text-gray-400 text-sm py-8">No tasks yet.</p>`;
      } else {
        html += taskRes.data.map(t => {
          const isAssignee = t.assigned_to == myId || !t.assigned_to;
          const canUpload = isAssignee && t.status !== "completed";
          return `
            <div class="p-3 bg-white border border-gray-100 rounded-xl ${t.status === "completed" ? "opacity-50" : ""}">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <input type="checkbox" ${t.status === "completed" ? "checked" : ""} ${!isAdmin ? "disabled" : `onclick="Groups.toggleTask(${t.task_id}, ${groupId})"`}
                         class="w-4 h-4 rounded accent-orange-600 cursor-pointer">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold ${t.status === "completed" ? "line-through text-gray-400" : "text-gray-800"} truncate">${t.task_name}</p>
                    <p class="text-[10px] text-gray-400">→ ${t.full_name || "Everyone"}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  ${t.task_attachment ? `<a href="${t.task_attachment}" target="_blank" class="text-[10px] text-orange-600 font-semibold hover:underline">View proof</a>` : ""}
                  ${canUpload ? `<button onclick="Groups.triggerProofUpload(${t.task_id}, ${groupId})" class="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-semibold hover:bg-orange-50 hover:text-orange-600 transition">Upload proof</button>` : ""}
                </div>
              </div>
            </div>`;
        }).join("");
      }
      html += `</div></div>`;
      document.getElementById("modalBody").innerHTML = html;
    } catch (e) {
      console.error(e);
      UI.closeModal();
    }
  },

  triggerProofUpload: function (taskId, groupId) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.onchange = async () => {
      if (!inp.files[0]) return;
      const fd = new FormData();
      fd.append("resourceFile", inp.files[0]);
      fd.append("groupId", groupId);
      try {
        const res = await fetch("api/collaboration/upload_resource.php", { method: "POST", body: fd });
        const uploadResult = await res.json();
        if (uploadResult.success) {
          await fetch("api/collaboration/tasks.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "upload_proof", taskId, groupId, fileUrl: uploadResult.data.url }),
          });
          this.viewTasks(groupId);
        } else {
          alert(uploadResult.message || "Upload failed.");
        }
      } catch (e) { alert("Upload error."); }
    };
    inp.click();
  },

  createTask: async function (groupId) {
    const taskName = document.getElementById("newTaskName").value.trim();
    const assignedTo = document.getElementById("taskAssignee").value;
    if (!taskName) return alert("Enter a task description.");
    try {
      await fetch("api/collaboration/tasks.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", groupId, taskName, assignedTo }),
      });
      this.viewTasks(groupId);
    } catch (e) { console.error(e); }
  },

  toggleTask: async function (taskId, groupId) {
    try {
      await fetch("api/collaboration/tasks.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", taskId, groupId }),
      });
      this.viewTasks(groupId);
    } catch (e) { console.error(e); }
  },

  showInfo: async function (groupId, privacy) {
    UI.openModal("loading");
    try {
      const res = await fetch(`api/collaboration/get_group_details.php?groupId=${groupId}`);
      const result = await res.json();
      if (!result.success) return;

      const g = result.data.group;
      const members = result.data.members;
      const myId = Auth.userData ? Auth.userData.user_id : null;

      let membersHtml = "";
      for (const m of members) {
        const score = await this.getCollaborativeScore(m.user_id, groupId);
        const filledStars = Math.round(score);
        const starsHtml = [1,2,3,4,5].map(n => `<i class="ri-star-${n <= filledStars ? 'fill text-orange-400' : 'line text-gray-200'} text-xs"></i>`).join('');
        const isMe = m.user_id == myId;
        membersHtml += `
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold">${m.full_name[0]}</div>
              <div>
                <p class="text-sm font-semibold text-gray-800">${m.full_name}</p>
                <div class="flex items-center gap-1 mt-0.5">
                  ${starsHtml}
                  <span class="text-[10px] text-gray-400 ml-1">${score}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.role === 'owner' ? 'bg-gray-900 text-white' : m.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}">${m.role}</span>
              ${!isMe ? `<button onclick="Groups.openRatingModal(${m.user_id}, '${m.full_name.replace(/'/g,"\\'")}', ${groupId})" class="p-1 text-gray-400 hover:text-orange-500 transition" title="Rate ${m.full_name}"><i class="ri-star-line text-base"></i></button>` : ''}
            </div>
          </div>`;
      }

      const inviteSection = privacy === 'private'
        ? `<div class="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-2">Invite Code</p>
            <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
              <p class="font-mono font-bold text-orange-600 text-lg tracking-widest">${g.invite_code}</p>
              <button onclick="Groups.copyCode('${g.invite_code}')" class="text-xs text-orange-600 font-semibold bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition">Copy</button>
            </div>
          </div>` : '';

      document.getElementById("modalBody").innerHTML = `
        <div class="p-6">
          <div class="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
            <div class="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold text-xl">${g.group_name[0]}</div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">${g.group_name}</h2>
              <p class="text-xs text-gray-400">${g.category} • ${g.privacy_setting}</p>
            </div>
          </div>
          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Members (${members.length})</p>
          <div class="space-y-2 max-h-52 overflow-y-auto no-scrollbar">${membersHtml}</div>
          ${inviteSection}
          <button onclick="Groups.leaveGroup(${groupId})" class="w-full mt-4 py-3 border border-red-200 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 transition">Leave Group</button>
        </div>`;
    } catch (e) { console.error(e); }
  },

  openRatingModal: function (targetId, name, groupId) {
    const safeName = String(name).replace(/'/g, "\\'");
    document.getElementById("modalBody").innerHTML = `
      <div class="p-8 text-center">
        <div class="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i class="ri-medal-line text-2xl text-orange-600"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-1">Rate ${name}</h3>
        <p class="text-xs text-gray-400 mb-6">Tap a star to give your collaboration score</p>
        <div class="flex justify-center gap-3 mb-2" id="ratingStarsRow">
          ${[1,2,3,4,5].map(n => `
            <button
              onmouseover="Groups._hoverStar(${n})"
              onmouseout="Groups._hoverStar(0)"
              onclick="Groups._selectStar(${n}, ${targetId}, ${groupId})"
              id="rstar_${n}"
              class="text-4xl text-gray-200 hover:scale-110 transition-transform focus:outline-none">
              <i class="ri-star-fill"></i>
            </button>`).join("")}
        </div>
        <p id="ratingLabel" class="text-xs text-gray-400 mb-6 h-4"></p>
        <button onclick="UI.closeModal()" class="text-xs text-gray-400 hover:text-gray-700 font-semibold uppercase tracking-widest transition">Cancel</button>
      </div>`;
  },

  _ratingLabels: ["", "Poor", "Fair", "Good", "Great", "Excellent"],
  _selectedStar: 0,

  _hoverStar: function (n) {
    const active = n || this._selectedStar;
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`rstar_${i}`);
      if (el) el.style.color = i <= active ? "#ea580c" : "#e5e7eb";
    }
    const label = document.getElementById("ratingLabel");
    if (label) label.textContent = n ? this._ratingLabels[n] : (this._selectedStar ? this._ratingLabels[this._selectedStar] : "");
  },

  _selectStar: async function (n, targetId, groupId) {
    this._selectedStar = n;
    this._hoverStar(n);
    try {
      const res = await fetch("api/profile/handle_rating.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: targetId, rating_value: n, group_id: groupId }),
      });
      const result = await res.json();
      if (result.success) {
        setTimeout(() => {
          UI.closeModal();
          this.showInfo(groupId, this.activeGroupPrivacy || 'public');
        }, 600);
      } else {
        alert(result.message);
      }
    } catch (e) { console.error(e); }
  },

  getCollaborativeScore: async function (targetId, groupId) {
    try {
      const res = await fetch(`api/profile/handle_rating.php?target_id=${targetId}&group_id=${groupId}`);
      const result = await res.json();
      return result.success ? result.data.average : "0.0";
    } catch (e) { return "0.0"; }
  },

  copyCode: function (code) {
    navigator.clipboard.writeText(code).then(() => alert("Invite code copied!"));
  },

  startMeeting: async function (groupId) {
    if (!confirm("Start a study session? A meeting link will be posted to the chat.")) return;
    try {
      const res = await fetch("api/collaboration/generate_meet.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const result = await res.json();
      if (result.success) {
        // Open in new tab AND post to chat
        window.open(result.data.url, "_blank");
        this.loadMessages(groupId);
      }
    } catch (e) { console.error(e); }
  },
};
