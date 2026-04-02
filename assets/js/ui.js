// assets/js/ui.js

const modalTemplates = {
  loading: `
    <div class="flex flex-col items-center justify-center py-16">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
      <p class="text-gray-400 text-xs font-semibold uppercase tracking-widest">Loading...</p>
    </div>`,

  joinCodeModal: `
    <div class="p-8">
      <h2 class="text-lg font-bold text-gray-900 mb-1">Enter Invite Code</h2>
      <p class="text-xs text-gray-400 mb-6">Join a private workspace with your group's code.</p>
      <input type="text" id="invite_code_input" placeholder="ABC123" maxlength="8"
             class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-mono font-bold text-orange-600 uppercase outline-none focus:border-orange-400 mb-4 transition">
      <button onclick="Groups.joinByCode()" class="w-full bg-orange-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-700 transition">
        Join Workspace
      </button>
    </div>`,

  groupModal: `
    <div class="p-8">
      <h2 class="text-lg font-bold text-gray-900 mb-1">Create Workspace</h2>
      <p class="text-xs text-gray-400 mb-6">Set up a new collaborative group.</p>
      <div class="space-y-3">
        <input type="text" id="group_name" placeholder="Group name" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-400 text-sm font-medium transition">
        <textarea id="description" placeholder="Description (optional)" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none h-20 text-sm font-medium focus:border-orange-400 resize-none transition"></textarea>
        <div class="grid grid-cols-2 gap-3">
          <input type="text" id="subject" placeholder="Course code" class="p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-400 text-sm font-medium transition">
          <select id="category" class="p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium text-gray-700 transition">
            <option value="">Category</option>
            <option value="Computing">Computing & IT</option>
            <option value="Business">Business & Econ</option>
            <option value="Engineering">Engineering</option>
            <option value="Law">Law & Arts</option>
            <option value="Science">Sciences</option>
          </select>
        </div>
        <select id="privacy_setting" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium text-gray-700 transition">
          <option value="public">Public — visible to all</option>
          <option value="private">Private — invite only</option>
        </select>
        <button onclick="Groups.create()" class="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition mt-1">Create Group</button>
      </div>
    </div>`,

  createEventModal: `
    <div class="p-8">
      <h2 class="text-lg font-bold text-gray-900 mb-1">Publish Event</h2>
      <p class="text-xs text-gray-400 mb-6">Broadcast to your campus.</p>
      <div class="space-y-4">
        <div>
          <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Title</label>
          <input type="text" id="event_title" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-400 text-sm font-medium transition">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Date & Time</label>
            <input type="datetime-local" id="event_date" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-400 text-sm font-medium transition">
          </div>
          <div>
            <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Category</label>
            <select id="event_cat" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium text-gray-700 transition">
              <option value="Academic">Academic</option>
              <option value="Social">Social</option>
              <option value="Sports">Sports</option>
            </select>
          </div>
        </div>
        <div>
          <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Location</label>
          <input type="text" id="event_loc" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-400 text-sm font-medium transition">
        </div>
        <div>
          <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">University</label>
          <select id="event_uni_select" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium text-gray-700 transition">
            <option value="KCA University">KCA University</option>
            <option value="JKUAT">JKUAT</option>
            <option value="University of Nairobi">University of Nairobi</option>
            <option value="Kenyatta University">Kenyatta University</option>
            <option value="Strathmore University">Strathmore University</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Description</label>
          <textarea id="event_desc" rows="3" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-400 text-sm font-medium resize-none transition"></textarea>
        </div>
        <button onclick="Events.create()" class="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition">Publish Event</button>
      </div>
    </div>`,
};

const UI = {
  showView: async (view) => {
    const home = document.getElementById("homeView");
    const workspace = document.getElementById("activeWorkspace");
    if (!home || !workspace) return;

    const user = await Auth.checkSession();
    if (!user && localStorage.getItem("pending_verification_email")) {
      window.location.href = "verify.html"; return;
    }
    if (!user && view !== "home") {
      window.location.href = "login.html"; return;
    }

    document.querySelectorAll(".nav-link").forEach(btn => btn.classList.remove("active"));
    const btn = document.getElementById(`btn-${view}`);
    if (btn) btn.classList.add("active");

    workspace.innerHTML = "";

    if (view === "home" || view === "dashboard") {
      home.classList.remove("hidden");
      workspace.classList.add("hidden");
      return;
    }

    home.classList.add("hidden");
    workspace.classList.remove("hidden");

    if (view === "groups" && typeof Groups !== "undefined") {
      workspace.innerHTML = `
        <div class="flex h-[85vh] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mx-4">
          <div class="w-64 border-r border-gray-100 flex flex-col bg-gray-50/50 shrink-0">
            <div class="px-4 py-3 border-b border-gray-100 bg-white flex justify-between items-center">
              <h2 class="text-sm font-bold text-gray-900">My Groups</h2>
              <button onclick="UI.openModal('groupModal')" class="w-7 h-7 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-lg transition" title="New group">
                <i class="ri-add-line text-base"></i>
              </button>
            </div>
            <div id="groupsSidebar" class="flex-1 overflow-y-auto no-scrollbar p-3"></div>
            <div class="p-3 border-t border-gray-100 bg-white space-y-2">
              <button onclick="Groups.explore()" class="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition">Explore Public</button>
              <button onclick="UI.openModal('joinCodeModal')" class="w-full py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-semibold hover:border-orange-400 hover:text-orange-600 transition">Join by Code</button>
            </div>
          </div>
          <div id="activeGroupContent" class="flex-1 flex flex-col bg-white min-w-0">
            <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
              <i class="ri-chat-3-line text-4xl text-gray-200 mb-3"></i>
              <p class="text-sm font-semibold text-gray-400">Select a group to start</p>
            </div>
          </div>
        </div>`;
      Groups.init();
    }

    if (view === "messages" && typeof Social !== "undefined") {
      workspace.innerHTML = `
        <div class="flex h-[85vh] overflow-hidden mx-4">
          <div class="w-72 border border-gray-100 rounded-2xl flex flex-col bg-white shadow-lg mr-4 shrink-0">
            <div class="px-4 py-3 border-b border-gray-100">
              <div class="flex justify-between items-center mb-3">
                <h2 class="text-sm font-bold text-gray-900">Messages</h2>
                <button onclick="Social.loadPendingRequests()" class="relative p-1.5 text-gray-400 hover:text-orange-600 transition">
                  <i class="ri-user-add-line text-base"></i>
                  <span id="requestCount" class="hidden absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">0</span>
                </button>
              </div>
              <div class="relative">
                <i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input type="text" id="peerSearch" placeholder="Find classmates..." onkeyup="Social.searchStudents(this.value)"
                       class="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-orange-200 transition">
              </div>
            </div>
            <div id="friendsList" class="flex-1 overflow-y-auto no-scrollbar p-3"></div>
          </div>
          <div id="privateChatArea" class="flex-1 flex flex-col bg-white border border-gray-100 rounded-2xl shadow-lg min-w-0">
            <div class="flex-1 flex flex-col items-center justify-center">
              <i class="ri-chat-private-line text-4xl text-orange-200 mb-3"></i>
              <p class="text-sm font-semibold text-gray-400">Select a friend to chat</p>
            </div>
          </div>
        </div>`;
      Social.init();
    }

    if (view === "resources" && typeof Resources !== "undefined") {
      Resources.init(window.userRole);
    }

    if (view === "events" && typeof Events !== "undefined") {
      workspace.innerHTML = `
        <div class="flex h-[85vh] overflow-hidden mx-4">
          <div class="w-56 border border-gray-100 rounded-2xl flex flex-col bg-white shadow-lg mr-4 shrink-0">
            <div class="px-4 py-3 border-b border-gray-100">
              <div class="flex justify-between items-center mb-3">
                <h2 class="text-sm font-bold text-gray-900">Events</h2>
                <button onclick="Events.openCreateModal()" class="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Create event">
                  <i class="ri-add-line text-base"></i>
                </button>
              </div>
              <select onchange="Events.filterByUniversity(this.value)"
                      class="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-700 outline-none focus:bg-white transition">
                <option value="current">My University</option>
                <option value="global">All Universities</option>
              </select>
            </div>
            <div class="p-3">
              <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">Filter by category</p>
              <div class="space-y-0.5">
                ${["all","Academic","Social","Sports"].map(c => `
                  <button onclick="Events.filterByCategory('${c}')"
                          class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition">
                    ${c === 'all' ? 'All Categories' : c}
                  </button>`).join("")}
              </div>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto no-scrollbar bg-white rounded-2xl shadow-lg border border-gray-100 p-6 min-w-0">
            <div id="eventsGrid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></div>
          </div>
        </div>`;
      Events.init();
    }
  },


  showNotification: (message, type = "info") => {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      alert(message);
    }
  },
  openModal: (type, data = {}) => {
    const body = document.getElementById("modalBody");
    const overlay = document.getElementById("modalOverlay");
    if (!body || !overlay) return;
    if (typeof modalTemplates !== "undefined" && modalTemplates[type]) {
      body.innerHTML = typeof modalTemplates[type] === "function" ? modalTemplates[type](data) : modalTemplates[type];
      overlay.classList.remove("hidden");
      overlay.classList.add("flex");
      const wrapper = body.closest(".bg-white");
      if (wrapper) wrapper.className = "bg-white rounded-2xl shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 duration-200";
    }
  },

  closeModal: () => {
    const overlay = document.getElementById("modalOverlay");
    if (overlay) { overlay.classList.add("hidden"); overlay.classList.remove("flex"); }
  },
};
