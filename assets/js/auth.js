const Auth = {
  userData: null,

  /**
   * Registration Handler
   */
  register: async (formData) => {
    try {
      const response = await fetch("api/auth/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("pending_verification_email", result.email);
        alert(result.message);
        window.location.href = result.redirect;
      } else {
        alert(result.message || "Registration failed");
      }
    } catch (e) {
      console.error("Registration Error:", e);
      alert("Connection error. Please try again.");
    }
  },

  /**
   * Standard Login Handler
   */
  login: async (email, password) => {
    try {
      const response = await fetch("api/auth/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!result.success && result.needs_verification) {
        localStorage.setItem("pending_verification_email", result.email);
        window.location.href = "verify.html";
        return;
      }

      if (result.success) {
        window.location.href = "dashboard.html";
      } else {
        alert(result.message);
      }
    } catch (e) {
      console.error("Login Error:", e);
    }
  },

  /**
   * Session Check (Security Heartbeat)
   */
  checkSession: async () => {
    try {
      const response = await fetch("api/auth/check_session.php");
      const result = await response.json();
      console.log("CHECK SESSION RESULT:", result); // ADD THIS

      if (result.success && result.data) {
        Auth.userData = result.data;
        window.userRole = result.data.role;
        window.userUni = result.data.university;
        return result.data;
      }

      // If the backend says we need re-verification (manual DB change)
      if (result.needs_reverification) {
        localStorage.setItem("pending_verification_email", result.email);
      }

      return null;
    } catch (error) {
      console.error("Auth System Error:", error);
      return null;
    }
  },

  getUserId: () => {
    return Auth.userData ? Auth.userData.user_id : null;
  },

  logout: async () => {
    try {
      await fetch("api/auth/logout.php");
      Auth.userData = null;
      window.location.href = "login.html";
    } catch (e) {
      window.location.href = "login.html";
    }
  },
};
