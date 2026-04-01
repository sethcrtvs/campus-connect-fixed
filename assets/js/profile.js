// assets/js/profile.js

const Profile = {
  async submitRating(targetId, value, groupId) {
    try {
      const res = await fetch("api/profile/handle_rating.php", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: targetId, rating_value: value, group_id: groupId }),
      });
      const result = await res.json();
      if (result.success) {
        UI.closeModal();
        if (typeof Groups !== "undefined" && Groups.activeGroupId) {
          Groups.showInfo(Groups.activeGroupId, Groups.activeGroupPrivacy || 'public');
        }
      } else { alert(result.message); }
    } catch (e) { console.error(e); }
  },
};
window.Profile = Profile;

document.addEventListener("DOMContentLoaded", async () => {
  const saveBtn  = document.getElementById("saveProfileBtn");
  const avatarImg = document.getElementById("userAvatar");

  const user = await Auth.checkSession();
  if (!user) { window.location.href = "login.html"; return; }

  // Load profile data
  try {
    const res = await fetch("api/profile/get_profile.php");
    const result = await res.json();
    if (result.success) {
      const p = result.data;
      const nameEl = document.getElementById("profileName");
      const uniEl  = document.getElementById("profileUni");
      if (nameEl) nameEl.textContent = p.full_name;
      if (uniEl)  uniEl.textContent  = p.university;
      if (document.getElementById("bio")) document.getElementById("bio").value = p.bio || "";
      if (document.getElementById("programme")) document.getElementById("programme").value = p.programme || p.github_url || "";

      // Render links
      const links = p.links || (p.portfolio_url && !p.portfolio_url.startsWith('[') ? [p.portfolio_url] : []);
      renderLinks(links);

      if (avatarImg) {
        avatarImg.src = p.profile_pic
          ? p.profile_pic
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=EA580C&color=fff`;
      }
    }
  } catch (e) { console.error(e); }

  // Links management
  function renderLinks(links) {
    const container = document.getElementById("linksContainer");
    if (!container) return;
    container.innerHTML = "";
    links.forEach((l, i) => {
      const row = document.createElement("div");
      row.className = "flex gap-2 items-center";
      row.innerHTML = `
        <input type="url" value="${l}" placeholder="https://..."
               class="flex-1 px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:border-orange-500 focus:bg-white transition outline-none link-input">
        <button type="button" onclick="this.parentElement.remove()" class="p-2 text-gray-300 hover:text-red-400 transition shrink-0">
          <i class="ri-close-line text-lg"></i>
        </button>`;
      container.appendChild(row);
    });
  }

  const addLinkBtn = document.getElementById("addLinkBtn");
  if (addLinkBtn) {
    addLinkBtn.addEventListener("click", () => {
      const container = document.getElementById("linksContainer");
      const row = document.createElement("div");
      row.className = "flex gap-2 items-center";
      row.innerHTML = `
        <input type="url" placeholder="https://..." value=""
               class="flex-1 px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:border-orange-500 focus:bg-white transition outline-none link-input">
        <button type="button" onclick="this.parentElement.remove()" class="p-2 text-gray-300 hover:text-red-400 transition shrink-0">
          <i class="ri-close-line text-lg"></i>
        </button>`;
      container.appendChild(row);
      row.querySelector("input").focus();
    });
  }

  // Cloudinary avatar upload
  if (typeof cloudinary !== "undefined" && document.getElementById("uploadTrigger")) {
    const widget = cloudinary.createUploadWidget(
      { cloudName: "detnaasrq", uploadPreset: "campus_connect_avatars", cropping: true, croppingAspectRatio: 1, multiple: false },
      async (error, result) => {
        if (!error && result && result.event === "success") {
          const url = result.info.secure_url;
          const res = await fetch("api/profile/update_avatar.php", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile_pic: url }),
          });
          if ((await res.json()).success && avatarImg) avatarImg.src = url;
        }
      }
    );
    document.getElementById("uploadTrigger").addEventListener("click", () => widget.open());
  }

  // Save
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      saveBtn.textContent = "Saving...";
      saveBtn.disabled = true;
      try {
        const links = Array.from(document.querySelectorAll(".link-input"))
          .map(i => i.value.trim()).filter(Boolean);
        const res = await fetch("api/profile/update_profile.php", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bio: document.getElementById("bio")?.value || "",
            links,
            programme: document.getElementById("programme")?.value || "",
          }),
        });
        const result = await res.json();
        alert(result.message);
      } catch (e) { alert("Save failed."); }
      saveBtn.textContent = "Save Changes";
      saveBtn.disabled = false;
    });
  }
});
