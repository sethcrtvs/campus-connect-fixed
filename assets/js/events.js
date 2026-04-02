// assets/js/events.js

const Events = {
  allEvents: [],
  myInterests: new Set(),
  _timers: [],

  init: async function () {
    if (typeof Auth !== "undefined" && !Auth.userData) await Auth.checkSession();
    this.loadEvents();
  },

  openCreateModal: function () {
    const authorized = ["uni_admin", "super_admin"];
    if (window.userRole && authorized.includes(window.userRole.toLowerCase())) {
      UI.openModal("createEventModal");
    } else {
      showNotification("Access denied. Only admins can publish events.", "error");
    }
  },

  loadEvents: async function (scope = "current") {
    const grid = document.getElementById("eventsGrid");
    if (!grid) return;
    this._timers.forEach(clearInterval); this._timers = [];
    grid.innerHTML = `<p class="col-span-full text-center text-gray-400 text-xs mt-20 animate-pulse">Loading events...</p>`;
    try {
      const res = await fetch(`api/events/get_events.php?scope=${scope}`);
      const result = await res.json();
      if (result.success) {
        this.allEvents = result.data;
        // Populate myInterests from DB response (is_interested is 1 if user is interested)
        this.myInterests = new Set(
          result.data.filter(e => parseInt(e.is_interested) === 1).map(e => String(e.event_id))
        );
        if (result.data.length === 0) {
          grid.innerHTML = `<div class="col-span-full text-center py-20 opacity-30"><i class="ri-calendar-todo-line text-5xl block mb-3"></i><p class="text-sm font-semibold">No upcoming events</p></div>`;
          return;
        }
        this.renderGrid(result.data);
      } else {
        grid.innerHTML = `<p class="col-span-full text-center text-red-400 text-sm mt-10">${result.message || "Could not load events."}</p>`;
      }
    } catch (e) {
      grid.innerHTML = `<p class="col-span-full text-center text-red-400 text-sm mt-10">Connection error. Please try again.</p>`;
    }
  },

  renderGrid: function (events) {
    const grid = document.getElementById("eventsGrid");
    if (!grid) return;
    grid.innerHTML = events.map(e => {
      const d = new Date(e.event_date);
      const day   = d.getDate();
      const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
      const time  = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const count = parseInt(e.interest_count) || 0;
      const interested = this.myInterests.has(String(e.event_id));
      return `
        <div id="event_${e.event_id}" class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
          <div class="flex justify-between items-start mb-4">
            <span class="bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-lg uppercase">${e.category}</span>
            <div class="text-right">
              <span class="block text-xl font-bold text-gray-900 leading-none">${day}</span>
              <span class="text-[10px] font-bold text-orange-600 uppercase">${month}</span>
            </div>
          </div>
          <h4 class="text-sm font-bold text-gray-900 leading-snug mb-2 line-clamp-2">${e.title}</h4>
          <div class="flex items-center gap-1.5 text-gray-500 mb-3">
            <i class="ri-map-pin-2-line text-orange-500 text-xs"></i>
            <p class="text-xs font-medium truncate">${e.location} · ${time}</p>
          </div>
          <p class="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1">${e.description || ""}</p>
          <div class="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
            <div>
              <p class="text-[9px] text-gray-400 font-semibold uppercase tracking-widest">Starts in</p>
              <p id="timer_${e.event_id}" class="text-xs font-bold text-gray-900 mt-0.5 tabular-nums">–</p>
            </div>
            <button onclick="Events.toggleInterest(${e.event_id}, this)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${interested ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}"
                    data-interested="${interested}">
              <i class="ri-heart-${interested ? 'fill' : 'line'} text-sm"></i>
              <span id="icount_${e.event_id}">${count}</span>
            </button>
          </div>
        </div>`;
    }).join("");
    events.forEach(e => this._startCountdown(e.event_id, e.event_date));
  },

  toggleInterest: async function (eventId, btn) {
    try {
      const res = await fetch("api/events/toggle_interest.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const result = await res.json();
      if (!result.success) return;

      const interested = result.data.interested;
      const count      = result.data.count;

      if (interested) this.myInterests.add(String(eventId));
      else            this.myInterests.delete(String(eventId));

      btn.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${interested ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`;
      btn.querySelector("i").className = `ri-heart-${interested ? 'fill' : 'line'} text-sm`;
      document.getElementById(`icount_${eventId}`).textContent = count;
    } catch (e) { console.error(e); }
  },

  _startCountdown: function (id, dateStr) {
    const target = new Date(dateStr).getTime();
    const el = document.getElementById(`timer_${id}`);
    if (!el) return;
    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) { el.textContent = "Happening now"; return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      el.textContent = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
    };
    update();
    this._timers.push(setInterval(update, 60000));
  },

  create: async function () {
    const title    = document.getElementById("event_title")?.value.trim();
    const date     = document.getElementById("event_date")?.value;
    const location = document.getElementById("event_loc")?.value.trim();
    const desc     = document.getElementById("event_desc")?.value.trim();
    const category = document.getElementById("event_cat")?.value;
    const uniEl    = document.getElementById("event_uni_select");
    const university = uniEl ? uniEl.value : (window.userUni || "");

    if (!title || !date || !location) {
      showNotification("Please fill in title, date, and location.", "error");
      return;
    }
    try {
      const res = await fetch("api/events/create_event.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc, event_date: date, location, university, category }),
      });
      const result = await res.json();
      if (result.success) { UI.closeModal(); this.loadEvents(); }
      else showNotification(result.message, "error");
    } catch (e) { showNotification("Failed to connect.", "error"); }
  },

  filterByUniversity: function (v) { this.loadEvents(v); },
  filterByCategory: function (c) {
    const filtered = c === "all" ? this.allEvents : this.allEvents.filter(e => e.category.toLowerCase() === c.toLowerCase());
    this.renderGrid(filtered);
  },
};
