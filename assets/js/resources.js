/**
 * assets/js/resources.js
 */
const Resources = {
  allData: [],
  currentRole: "student",
  currentUserId: null,

  init: async (role, userId) => {
    Resources.currentRole    = role   || "student";
    Resources.currentUserId  = userId || (Auth.userData ? Auth.userData.user_id : null);

    const home      = document.getElementById("homeView");
    const workspace = document.getElementById("activeWorkspace");

    if (home && workspace) {
      home.classList.add("hidden");
      workspace.classList.remove("hidden");
    }

    document.querySelectorAll(".nav-link").forEach(btn => btn.classList.remove("active"));
    const resourceBtn = document.getElementById("btn-resources");
    if (resourceBtn) resourceBtn.classList.add("active");

    workspace.innerHTML = `
      <div class="p-8 space-y-8 text-left">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 class="text-3xl font-black text-gray-900 tracking-tight">Academic Vault</h2>
            <p class="text-orange-500 font-semibold text-xs uppercase tracking-widest mt-1">Verified Peer-to-Peer Exchange</p>
          </div>
          <button onclick="Resources.openUploadModal()"
                  class="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-orange-200 hover:bg-orange-700 transition flex items-center gap-2">
            <i class="ri-upload-2-line"></i> Share a Resource
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${["Computing & IT","Engineering","Business & Econ","Law & Arts","Sciences","General"].map(f => `
            <div onclick="Resources.filterByFaculty('${f}')"
                 class="faculty-card p-5 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-orange-400 hover:shadow-md transition-all text-center group">
              <div class="w-9 h-9 mx-auto bg-gray-50 rounded-xl flex items-center justify-center mb-2 group-hover:bg-orange-50 transition">
                <i class="ri-book-open-line text-gray-400 group-hover:text-orange-600 text-base"></i>
              </div>
              <h4 class="font-semibold text-gray-700 text-xs group-hover:text-orange-600 transition">${f}</h4>
            </div>`).join("")}
        </div>

        <div class="flex flex-col md:flex-row gap-3 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div class="relative flex-1 w-full">
            <i class="ri-search-2-line absolute left-4 top-3.5 text-gray-400 text-sm"></i>
            <input type="text" id="hubSearch" onkeyup="Resources.search(this.value)"
                   placeholder="Search resources, contributors..."
                   class="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400 transition">
          </div>
          <select id="typeFilter" onchange="Resources.filterByType(this.value)"
                  class="bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-semibold text-gray-600 outline-none cursor-pointer">
            <option value="all">All Types</option>
            <option value="Past Paper">Past Papers</option>
            <option value="eBook">eBooks</option>
            <option value="Journal">Journals</option>
            <option value="Magazine">Magazines</option>
          </select>
          <select id="sortFilter" onchange="Resources.sortBy(this.value)"
                  class="bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-semibold text-gray-600 outline-none cursor-pointer">
            <option value="newest">Newest First</option>
            <option value="verified">Verified First</option>
            <option value="title">A → Z</option>
          </select>
        </div>

        <div id="hubGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="col-span-full py-16 text-center text-gray-400 animate-pulse text-xs font-semibold uppercase tracking-widest">
            Loading vault...
          </div>
        </div>
      </div>`;

    await Resources.fetch();
  },

  fetch: async () => {
    try {
      const res    = await fetch("api/resources/hub.php");
      const result = await res.json();
      if (result.success) {
        Resources.allData = result.data;
        Resources.render(result.data);
      } else {
        document.getElementById("hubGrid").innerHTML =
          `<div class="col-span-full text-center py-16 text-red-400 text-sm font-semibold">${result.message}</div>`;
      }
    } catch (e) {
      console.error("Fetch failed:", e);
      document.getElementById("hubGrid").innerHTML =
        `<div class="col-span-full text-center py-16 text-red-400 text-sm font-semibold">Failed to connect to Vault.</div>`;
    }
  },

  render: (files) => {
    const grid = document.getElementById("hubGrid");
    if (!grid) return;

    if (!files || files.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-16 text-center text-gray-400 text-sm">No resources found.</div>`;
      return;
    }

    grid.innerHTML = files.map(f => {
      const isOwner  = f.user_id == Resources.currentUserId;
      const isAdmin  = Resources.currentRole !== "student";
      const canDelete = isOwner || isAdmin;
      const pending  = !f.is_verified;

      return `
        <div class="bg-white p-6 rounded-2xl border ${f.is_verified ? "border-orange-200 shadow-md shadow-orange-50" : "border-gray-100 shadow-sm"} relative flex flex-col hover:-translate-y-1 transition-all">
          ${f.is_verified ? `
            <div class="absolute top-4 right-4 flex items-center gap-1 bg-orange-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <i class="ri-verified-badge-fill text-[10px]"></i> Verified
            </div>` : `
            <div class="absolute top-4 right-4 flex items-center gap-1 bg-amber-100 text-amber-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Pending
            </div>`}

          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 ${f.visibility === "global" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"} rounded-xl flex items-center justify-center shrink-0">
              <i class="${f.visibility === "global" ? "ri-earth-line" : "ri-community-line"} text-xl"></i>
            </div>
            <div class="min-w-0">
              <span class="text-[9px] font-bold text-gray-300 uppercase tracking-widest">${f.file_extension || "FILE"}</span>
              <h3 class="font-bold text-gray-800 text-sm leading-tight truncate" title="${f.title}">${f.title}</h3>
            </div>
          </div>

          <div class="flex flex-wrap gap-1.5 mb-4 flex-1">
            <span class="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-semibold uppercase">${f.resource_type}</span>
            <span class="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-semibold">${f.faculty}</span>
            <span class="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-semibold">${f.university_origin}</span>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
            <div>
              <p class="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">By</p>
              <p class="text-xs font-semibold text-gray-700 truncate max-w-[120px]">${f.uploader || "Anonymous"}</p>
            </div>
            <div class="flex items-center gap-1.5">
              ${isAdmin && pending ? `
                <button onclick="Resources.verify(${f.resource_id})"
                        class="text-xs text-orange-600 font-semibold bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition">
                  Verify
                </button>` : ""}
              ${canDelete ? `
                <button onclick="Resources.delete(${f.resource_id})"
                        class="p-2 text-gray-300 hover:text-red-500 transition" title="Delete">
                  <i class="ri-delete-bin-line text-base"></i>
                </button>` : ""}
              <a href="${f.file_path}" target="_blank"
                 class="w-9 h-9 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition shadow-sm">
                <i class="ri-download-cloud-2-line text-base"></i>
              </a>
            </div>
          </div>
        </div>`;
    }).join("");
  },

  openUploadModal: () => {
    const body = document.getElementById("modalBody");
    const overlay = document.getElementById("modalOverlay");
    if (!body || !overlay) return;

    body.innerHTML = `
      <div class="p-8">
        <h2 class="text-lg font-bold text-gray-900 mb-1">Share a Resource</h2>
        <p class="text-xs text-gray-400 mb-6">Upload study materials for your peers.</p>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-semibold text-gray-500 mb-1 block">Title</label>
            <input type="text" id="res_title" placeholder="e.g. Java Programming Past Paper 2024"
                   class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-400 text-sm font-medium transition">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold text-gray-500 mb-1 block">Faculty</label>
              <select id="res_faculty" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium text-gray-700 transition">
                <option>Computing & IT</option>
                <option>Engineering</option>
                <option>Business & Econ</option>
                <option>Law & Arts</option>
                <option>Sciences</option>
                <option>General</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
              <select id="res_type" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium text-gray-700 transition">
                <option>Past Paper</option>
                <option>eBook</option>
                <option>Journal</option>
                <option>Magazine</option>
                <option>Notes</option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-500 mb-1 block">Visibility</label>
            <select id="res_visibility" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium text-gray-700 transition">
              <option value="university">My University Only</option>
              <option value="global">All Universities</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-500 mb-1 block">File</label>
            <div id="dropZone"
                 class="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-orange-400 cursor-pointer transition bg-gray-50/50"
                 onclick="document.getElementById('res_file').click()">
              <i class="ri-upload-cloud-2-line text-3xl text-gray-300 block mb-2"></i>
              <p id="dropLabel" class="text-xs font-semibold text-gray-400">Click to select file</p>
              <p class="text-[10px] text-gray-300 mt-1">PDF, DOCX, images · Max 10MB</p>
              <input type="file" id="res_file" class="hidden"
                     accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                     onchange="Resources.onFileSelected(this)">
            </div>
          </div>
          <button id="uploadSubmitBtn" onclick="Resources.submitUpload()"
                  class="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition">
            Upload Resource
          </button>
        </div>
      </div>`;

    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
    const wrapper = body.closest(".bg-white");
    if (wrapper) wrapper.className = "bg-white rounded-2xl shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 duration-200";
  },

  onFileSelected: (input) => {
    const label = document.getElementById("dropLabel");
    const zone  = document.getElementById("dropZone");
    if (!label || !zone) return;

    if (!input.files[0]) return;

    const file    = input.files[0];
    const maxSize = 10 * 1024 * 1024;
    const allowed = ['pdf','doc','docx','ppt','pptx','xls','xlsx','jpg','jpeg','png','gif'];
    const ext     = file.name.split('.').pop().toLowerCase();

    if (file.size > maxSize) {
      showNotification("File size must be less than 10MB.", "error");
      input.value = "";
      return;
    }
    if (!allowed.includes(ext)) {
      showNotification("Invalid file type. Only PDF, DOCX, and images allowed.", "error");
      input.value = "";
      return;
    }

    label.textContent = `✓ ${file.name}`;
    zone.classList.add("border-orange-400", "bg-orange-50/30");
  },

  submitUpload: async () => {
    const fileInput = document.getElementById("res_file");
    const title     = document.getElementById("res_title")?.value.trim();

    if (!fileInput || !fileInput.files[0]) {
      showNotification("Please select a file.", "error");
      return;
    }
    if (!title) {
      showNotification("Please enter a title for your resource.", "error");
      return;
    }

    const btn = document.getElementById("uploadSubmitBtn");
    if (btn) { btn.textContent = "Uploading..."; btn.disabled = true; }

    const formData = new FormData();
    formData.append("resourceFile", fileInput.files[0]);
    formData.append("title",        title);
    formData.append("faculty",      document.getElementById("res_faculty").value);
    formData.append("resourceType", document.getElementById("res_type").value);
    formData.append("visibility",   document.getElementById("res_visibility").value);
    formData.append("shareToHub",   "true");

    try {
      const res    = await fetch("api/collaboration/upload_resource.php", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success) {
        UI.closeModal();
        showNotification("Resource uploaded! " + (Resources.currentRole === "student" ? "Pending admin approval." : "Published."), "success");
        await Resources.fetch();
      } else {
        showNotification(result.message || "Upload failed.", "error");
        if (btn) { btn.textContent = "Upload Resource"; btn.disabled = false; }
      }
    } catch (e) {
      console.error("Upload error:", e);
      showNotification("Connection error. Please try again.", "error");
      if (btn) { btn.textContent = "Upload Resource"; btn.disabled = false; }
    }
  },

  // Keep old handleUpload as alias for backward compat
  handleUpload: async (input) => {
    Resources.onFileSelected(input);
  },

  verify: async (id) => {
    try {
      const res    = await fetch("api/admin/verify.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `resource_id=${id}`,
      });
      const result = await res.json();
      if (result.success) { showNotification("Resource verified!", "success"); await Resources.fetch(); }
      else showNotification(result.message, "error");
    } catch (e) { console.error(e); }
  },

  delete: async (id) => {
    if (!confirm("Delete this resource permanently?")) return;
    try {
      const res    = await fetch("api/resources/delete_resource.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `resource_id=${id}`,
      });
      const result = await res.json();
      if (result.success) { showNotification("Resource deleted.", "success"); await Resources.fetch(); }
      else showNotification(result.message, "error");
    } catch (e) { console.error(e); }
  },

  filterByFaculty: (faculty) => Resources.render(Resources.allData.filter(f => f.faculty === faculty)),

  filterByType: (type) => {
    if (type === "all") return Resources.render(Resources.allData);
    Resources.render(Resources.allData.filter(f => f.resource_type === type));
  },

  sortBy: (mode) => {
    const data = [...Resources.allData];
    if (mode === "verified") data.sort((a,b) => b.is_verified - a.is_verified);
    else if (mode === "title") data.sort((a,b) => a.title.localeCompare(b.title));
    else data.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    Resources.render(data);
  },

  search: (val) => {
    const v = val.toLowerCase();
    Resources.render(Resources.allData.filter(f =>
      f.title.toLowerCase().includes(v) ||
      (f.uploader || "").toLowerCase().includes(v) ||
      (f.faculty  || "").toLowerCase().includes(v)
    ));
  },
};
