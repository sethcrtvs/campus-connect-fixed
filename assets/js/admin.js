// assets/js/admin.js — Uni Admin Portal

const AdminUI = {
  currentResourceFilter: 'pending',

  init: function () {
    this.show('overview');
    this.loadStats();
    this.loadPendingResources();
  },

  show: function (view) {
    ['overview','events','resources'].forEach(v => {
      document.getElementById(`view-${v}`).classList.toggle('hidden', v !== view);
      const btn = document.getElementById(`btn-${v}`);
      if (btn) btn.classList.toggle('active', v === view);
    });
    if (view === 'events')    this.loadEvents();
    if (view === 'resources') this.loadResources('pending');
  },

  toast: function (msg) {
    const t = document.getElementById('toast');
    t.querySelector('div').textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
  },

  closeModal: function () {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('modalOverlay').classList.remove('flex');
  },

  openModal: function (html) {
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.add('flex');
  },

  loadStats: async function () {
    try {
      const [rRes, eRes] = await Promise.all([
        fetch(`api/admin/stats.php`).then(r => r.json()),
      ]);
      // Stats loaded inline with resource/event calls
    } catch (e) {}

    // Pending count
    fetch('api/admin/get_resources.php?filter=pending')
      .then(r => r.json()).then(r => {
        if (r.success) document.getElementById('statPending').textContent = r.data.length;
      });
    fetch(`api/events/get_events.php?scope=current`)
      .then(r => r.json()).then(r => {
        if (r.success) document.getElementById('statEvents').textContent = r.data.length;
      });
    fetch('api/admin/stats.php')
      .then(r => r.json()).then(r => {
        if (r.success) document.getElementById('statStudents').textContent = r.data.students;
      }).catch(() => {});

    this.loadPendingResources();
  },

  loadPendingResources: async function () {
    const list = document.getElementById('pendingList');
    if (!list) return;
    try {
      const res = await fetch('api/admin/get_resources.php?filter=pending');
      const result = await res.json();
      if (!result.success || result.data.length === 0) {
        list.innerHTML = `<p class="text-sm text-gray-400 py-4">No pending resources. All caught up!</p>`;
        return;
      }
      list.innerHTML = result.data.map(r => this._resourceCard(r)).join('');
    } catch (e) { console.error(e); }
  },

  loadResources: async function (filter) {
    this.currentResourceFilter = filter;
    document.getElementById('tab-pending').className = `px-4 py-2 rounded-lg text-xs font-bold transition ${filter === 'pending' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`;
    document.getElementById('tab-all').className = `px-4 py-2 rounded-lg text-xs font-bold transition ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`;

    const list = document.getElementById('adminResourcesList');
    list.innerHTML = `<p class="text-xs text-gray-400 animate-pulse">Loading...</p>`;
    try {
      const res = await fetch(`api/admin/get_resources.php?filter=${filter}`);
      const result = await res.json();
      if (!result.success || result.data.length === 0) {
        list.innerHTML = `<p class="text-sm text-gray-400 py-4">No resources found.</p>`;
        return;
      }
      list.innerHTML = result.data.map(r => this._resourceCard(r)).join('');
    } catch (e) { console.error(e); }
  },

  _resourceCard: function (r) {
    return `
      <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase shrink-0">${r.file_extension || 'FILE'}</div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">${r.title}</p>
            <p class="text-[10px] text-gray-400">${r.faculty} · by ${r.uploader}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 ml-4">
          ${!r.is_verified ? `<button onclick="AdminUI.verify(${r.resource_id})" class="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition">Verify</button>` : `<span class="text-[10px] text-green-600 font-semibold">✓ Verified</span>`}
          <a href="${r.file_path}" target="_blank" class="p-2 text-gray-400 hover:text-orange-600 transition"><i class="ri-eye-line text-base"></i></a>
          <button onclick="AdminUI.deleteResource(${r.resource_id})" class="p-2 text-gray-300 hover:text-red-500 transition"><i class="ri-delete-bin-line text-base"></i></button>
        </div>
      </div>`;
  },

  verify: async function (id) {
    try {
      const res = await fetch('api/admin/verify.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `resource_id=${id}`
      });
      const result = await res.json();
      if (result.success) {
        showNotification('Resource verified!', 'success');
        this.loadResources(this.currentResourceFilter);
        this.loadPendingResources();
        document.getElementById('statPending') && this.loadStats();
      } else {
        alert(result.message);
      }
    } catch (e) { console.error(e); }
  },

  deleteResource: async function (id) {
    if (!confirm('Delete this resource permanently?')) return;
    try {
      const res = await fetch('api/resources/delete_resource.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `resource_id=${id}`
      });
      const result = await res.json();
      if (result.success) { showNotification('Resource deleted.', 'success'); this.loadResources(this.currentResourceFilter); }
      else alert(result.message);
    } catch (e) { console.error(e); }
  },

  loadEvents: async function () {
    const list = document.getElementById('adminEventsList');
    list.innerHTML = `<p class="text-xs text-gray-400 animate-pulse">Loading...</p>`;
    try {
      const res = await fetch('api/events/get_events.php?scope=current');
      const result = await res.json();
      if (!result.success || result.data.length === 0) {
        list.innerHTML = `<p class="text-sm text-gray-400 py-4">No upcoming events.</p>`;
        return;
      }
      list.innerHTML = result.data.map(e => {
        const d = new Date(e.event_date);
        return `
          <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div class="flex items-center gap-4">
              <div class="text-center w-10">
                <p class="text-lg font-black text-gray-900 leading-none">${d.getDate()}</p>
                <p class="text-[9px] font-bold text-orange-600 uppercase">${d.toLocaleString('default',{month:'short'})}</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-800">${e.title}</p>
                <p class="text-[10px] text-gray-400">${e.location} · ${e.category}</p>
              </div>
            </div>
            <span class="text-[10px] bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-semibold">${e.university}</span>
          </div>`;
      }).join('');
    } catch (e) { console.error(e); }
  },

  openCreateEvent: function () {
    this.openModal(`
      <div class="p-8">
        <h2 class="text-lg font-bold text-gray-900 mb-5">Publish Event</h2>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-semibold text-gray-500 mb-1 block">Title</label>
            <input type="text" id="ae_title" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-400 text-sm transition">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-gray-500 mb-1 block">Date & Time</label>
              <input type="datetime-local" id="ae_date" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm transition">
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
              <select id="ae_cat" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm transition">
                <option value="Academic">Academic</option>
                <option value="Social">Social</option>
                <option value="Sports">Sports</option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-500 mb-1 block">Location</label>
            <input type="text" id="ae_loc" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-400 text-sm transition">
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
            <textarea id="ae_desc" rows="3" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-400 text-sm resize-none transition"></textarea>
          </div>
          <button onclick="AdminUI.createEvent()" class="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition">Publish Event</button>
        </div>
      </div>`);
  },

  createEvent: async function () {
    const title    = document.getElementById('ae_title').value.trim();
    const date     = document.getElementById('ae_date').value;
    const location = document.getElementById('ae_loc').value.trim();
    const desc     = document.getElementById('ae_desc').value.trim();
    const category = document.getElementById('ae_cat').value;

    if (!title || !date || !location) { alert('Fill in title, date, and location.'); return; }

    try {
      const res = await fetch('api/events/create_event.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, event_date: date, location, description: desc, category, university: window.adminUni })
      });
      const result = await res.json();
      if (result.success) { this.closeModal(); showNotification('Event published!', 'success'); this.loadEvents(); }
      else alert(result.message);
    } catch (e) { alert('Connection error.'); }
  },
};
