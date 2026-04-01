/**
 * assets/js/resources.js
 * Comprehensive Module for the Academic Vault (Module 2)
 */
const Resources = {
  allData: [],
  currentRole: "student",
  currentUserId: null,

  /**
   * Initializes the Resource Hub view.
   * @param {string} role - User role (student/admin/etc)
   * @param {number} userId - The ID of the currently logged-in user
   */
  init: async (role, userId) => {
    Resources.currentRole = role || "student";
    Resources.currentUserId = userId;

    const home = document.getElementById("homeView");
    const workspace = document.getElementById("activeWorkspace");

    if (home && workspace) {
      home.classList.add("hidden");
      workspace.classList.remove("hidden");
    }

    // Sidebar UI state
    document
      .querySelectorAll(".nav-link")
      .forEach((btn) => btn.classList.remove("active"));
    const resourceBtn = document.getElementById("btn-resources");
    if (resourceBtn) resourceBtn.classList.add("active");

    // Render Skeleton
    workspace.innerHTML = `
            <div class="p-8 space-y-10 animate-in fade-in duration-500 text-left">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 class="text-4xl font-black text-gray-900 tracking-tight">Academic Vault</h2>
                        <p class="text-orange-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Verified Peer-to-Peer Exchange</p>
                    </div>
                    <button onclick="Resources.openUploadModal()" class="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-orange-200 hover:scale-105 transition-all">
                        <i class="ri-add-line mr-2"></i> Share a Resource
                    </button>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    ${[
                      "Computing & IT",
                      "Engineering",
                      "Business & Econ",
                      "Law & Arts",
                    ]
                      .map(
                        (f) => `
                        <div onclick="Resources.filterByFaculty('${f}')" class="faculty-card p-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm cursor-pointer hover:border-orange-500 hover:shadow-md transition-all text-center group">
                            <div class="w-10 h-10 mx-auto bg-gray-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-50 transition-colors">
                                <i class="ri-book-open-line text-gray-400 group-hover:text-orange-600"></i>
                            </div>
                            <h4 class="font-bold text-gray-700 text-sm group-hover:text-orange-600 transition-colors">${f}</h4>
                        </div>
                    `,
                      )
                      .join("")}
                </div>

                <div class="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div class="relative flex-1 w-full">
                        <i class="ri-search-2-line absolute left-4 top-3.5 text-gray-400"></i>
                        <input type="text" id="hubSearch" onkeyup="Resources.search(this.value)" placeholder="Search past papers, ebooks..." class="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                    </div>
                    <select id="typeFilter" onchange="Resources.filterByType(this.value)" class="bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-gray-500 outline-none cursor-pointer">
                        <option value="all">All Types</option>
                        <option value="Past Paper">Past Papers</option>
                        <option value="eBook">eBooks</option>
                        <option value="Journal">Journals</option>
                    </select>
                </div>

                <div id="hubGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div class="col-span-full py-20 text-center text-gray-400 italic animate-pulse uppercase text-[10px] font-black tracking-widest">
                        Syncing with the University Vault...
                    </div>
                </div>
            </div>
        `;

    await Resources.fetch();
  },

  /**
   * Fetches data from the Hub API
   */
  fetch: async () => {
    try {
      const response = await fetch("api/resources/hub.php");
      const result = await response.json();
      if (result.success) {
        Resources.allData = result.data;
        Resources.render(result.data);
      }
    } catch (e) {
      console.error("Fetch failed:", e);
      document.getElementById("hubGrid").innerHTML =
        `<div class="col-span-full text-center py-20 text-red-500 font-bold uppercase text-xs">Failed to connect to Vault</div>`;
    }
  },

  /**
   * Renders the resource cards into the grid
   */
  render: (files) => {
    const grid = document.getElementById("hubGrid");
    if (!grid) return;

    if (!files || files.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-20 text-center text-gray-400 italic">No resources found.</div>`;
      return;
    }

    grid.innerHTML = files
      .map((f) => {
        const isOwner = f.user_id == Resources.currentUserId;
        const isAdmin = Resources.currentRole !== "student";
        const canDelete = isOwner || isAdmin;

        return `
            <div class="bg-white p-7 rounded-[2.5rem] border ${f.is_verified ? "border-orange-200 shadow-orange-100 shadow-lg" : "border-gray-100"} relative group transition-all hover:-translate-y-2 text-left">
                ${
                  f.is_verified
                    ? `
                    <div class="absolute top-6 right-6 flex items-center gap-1 bg-orange-600 text-white text-[7px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                        <i class="ri-verified-badge-fill"></i> Verified
                    </div>
                `
                    : ""
                }
                
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-14 h-14 ${f.visibility === "global" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"} rounded-2xl flex items-center justify-center shadow-inner">
                        <i class="${f.visibility === "global" ? "ri-earth-line" : "ri-community-line"} text-2xl"></i>
                    </div>
                    <div>
                        <span class="text-[9px] font-black text-gray-300 uppercase tracking-widest">${f.file_extension || "FILE"}</span>
                        <h3 class="font-black text-gray-800 text-lg leading-tight truncate w-40" title="${f.title}">${f.title}</h3>
                    </div>
                </div>

                <div class="flex flex-wrap gap-2 mb-8">
                    <span class="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-bold uppercase tracking-tighter">${f.resource_type}</span>
                    <span class="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[9px] font-bold uppercase tracking-tighter">${f.university_origin}</span>
                </div>

                <div class="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div class="flex flex-col">
                        <span class="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Contributor</span>
                        <span class="text-xs font-bold text-gray-700">${f.uploader || "Anonymous"}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        ${
                          isAdmin && !f.is_verified
                            ? `<button onclick="Resources.verify(${f.resource_id})" class="text-orange-600 font-black text-[10px] uppercase mr-2 hover:underline">Verify</button>`
                            : ""
                        }
                        
                        ${
                          canDelete
                            ? `
                            <button onclick="Resources.delete(${f.resource_id})" class="text-gray-300 hover:text-red-500 transition-colors p-2" title="Delete Resource">
                                <i class="ri-delete-bin-line text-lg"></i>
                            </button>`
                            : ""
                        }

                        <a href="${f.file_path}" target="_blank" class="bg-gray-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg active:scale-95">
                            <i class="ri-download-cloud-2-line"></i>
                        </a>
                    </div>
                </div>
            </div>
            `;
      })
      .join("");
  },

  /**
   * Opens the upload modal
   */
  openUploadModal: () => {
    UI.openModal("resourceUpload");
    document.getElementById("modalBody").innerHTML = `
            <div class="p-4 space-y-5 text-left">
                <h2 class="text-2xl font-black text-gray-800 uppercase tracking-tighter">Share Resource</h2>
                <div class="space-y-4">
                    <input type="text" id="res_title" placeholder="Title (e.g. Java Past Paper 2024)" class="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-100 focus:border-orange-500 transition-all font-bold text-sm">
                    <div class="grid grid-cols-2 gap-3">
                        <select id="res_faculty" class="p-3 bg-gray-50 rounded-xl text-[10px] font-black uppercase outline-none">
                            <option>Computing & IT</option>
                            <option>Engineering</option>
                            <option>Business & Econ</option>
                            <option>Law & Arts</option>
                        </select>
                        <select id="res_type" class="p-3 bg-gray-50 rounded-xl text-[10px] font-black uppercase outline-none">
                            <option>Past Paper</option>
                            <option>eBook</option>
                            <option>Journal</option>
                            <option>Magazine</option>
                        </select>
                    </div>
                    <select id="res_visibility" class="w-full p-3 bg-gray-50 rounded-xl text-[10px] font-black uppercase outline-none">
                        <option value="university">My University Only</option>
                        <option value="global">Global Access</option>
                    </select>
                    <div class="border-2 border-dashed border-gray-100 rounded-[2rem] p-10 text-center hover:border-orange-500 cursor-pointer transition-all bg-gray-50/50" onclick="document.getElementById('res_file').click()">
                         <i class="ri-upload-cloud-2-line text-4xl text-gray-300"></i>
                         <p class="text-[10px] font-black text-gray-400 uppercase mt-2">Click to select file</p>
                         <input type="file" id="res_file" class="hidden" onchange="Resources.handleUpload(this)">
                    </div>
                </div>
            </div>
        `;
  },

  /**
   * Handles the file upload process
   */
  handleUpload: async (input) => {
    if (!input.files[0]) return;
    const title = document.getElementById("res_title").value;
    if (!title) {
      alert("Please enter a title first!");
      return;
    }

    const formData = new FormData();
    formData.append("resourceFile", input.files[0]);
    formData.append("faculty", document.getElementById("res_faculty").value);
    formData.append("resourceType", document.getElementById("res_type").value);
    formData.append(
      "visibility",
      document.getElementById("res_visibility").value,
    );
    formData.append("title", title);
    formData.append("shareToHub", "true");

    UI.openModal("loading");
    try {
      const res = await fetch("api/collaboration/upload_resource.php", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        UI.closeModal();
        await Resources.fetch();
      } else {
        alert(result.message);
        UI.closeModal();
      }
    } catch (e) {
      console.error("Upload failed:", e);
      UI.closeModal();
    }
  },

  /**
   * Verifies a resource (Admin only)
   */
  verify: async (id) => {
    if (!confirm("Verify this resource?")) return;
    try {
      const res = await fetch("api/admin/verify.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `resource_id=${id}`,
      });
      const result = await res.json();
      if (result.success) await Resources.fetch();
      else alert(result.message);
    } catch (e) {
      console.error(e);
    }
  },

  /**
   * Deletes a resource
   */
  delete: async (id) => {
    if (!confirm("Are you sure you want to delete this resource forever?"))
      return;
    try {
      const res = await fetch("api/resources/delete_resource.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `resource_id=${id}`,
      });
      const result = await res.json();
      if (result.success) {
        await Resources.fetch();
      } else {
        alert(result.message);
      }
    } catch (e) {
      console.error("Delete failed:", e);
    }
  },

  /**
   * UI Filters & Search
   */
  filterByFaculty: (faculty) => {
    const filtered = Resources.allData.filter((f) => f.faculty === faculty);
    Resources.render(filtered);
  },

  filterByType: (type) => {
    if (type === "all") return Resources.render(Resources.allData);
    const filtered = Resources.allData.filter((f) => f.resource_type === type);
    Resources.render(filtered);
  },

  search: (val) => {
    const filtered = Resources.allData.filter(
      (f) =>
        f.title.toLowerCase().includes(val.toLowerCase()) ||
        f.uploader.toLowerCase().includes(val.toLowerCase()),
    );
    Resources.render(filtered);
  },
};
