document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll(".otp-input");
  const verifyBtn = document.getElementById("verifyBtn");
  const resendBtn = document.getElementById("resendOtp");
  const emailDisplay = document.getElementById("displayEmail");

  const pendingEmail = localStorage.getItem("pending_verification_email");
  if (!pendingEmail) {
    window.location.href = "login.html";
    return;
  }
  emailDisplay.innerText = pendingEmail;

  // Input Focus Logic
  inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      if (e.target.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });

  // Verify Logic
  verifyBtn.addEventListener("click", async () => {
    const otp = Array.from(inputs)
      .map((i) => i.value)
      .join("");
    if (otp.length !== 6) {
      alert("Please enter the full 6-digit code.");
      return;
    }

    verifyBtn.innerText = "VERIFYING...";
    verifyBtn.disabled = true;

    try {
      const response = await fetch("api/auth/verify_otp.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          otp: otp,
          action: "verify",
        }),
      });
      const result = await response.json();
      if (result.success) {
        localStorage.removeItem("pending_verification_email");
        window.location.href = "dashboard.html";
      } else {
        alert(result.message);
        verifyBtn.innerText = "VERIFY ACCOUNT";
        verifyBtn.disabled = false;
      }
    } catch (e) {
      console.error(e);
      verifyBtn.innerText = "VERIFY ACCOUNT";
      verifyBtn.disabled = false;
    }
  });

  // Resend Logic
  resendBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    resendBtn.innerText = "Sending...";
    resendBtn.style.pointerEvents = "none";

    try {
      const response = await fetch("api/auth/verify_otp.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, action: "resend" }),
      });
      const result = await response.json();
      alert(result.message);

      // Start Cooldown
      let timeLeft = 60;
      const timer = setInterval(() => {
        timeLeft--;
        resendBtn.innerText = `Wait ${timeLeft}s`;
        if (timeLeft <= 0) {
          clearInterval(timer);
          resendBtn.innerText = "Resend OTP";
          resendBtn.style.pointerEvents = "auto";
        }
      }, 1000);
    } catch (e) {
      resendBtn.innerText = "Resend OTP";
      resendBtn.style.pointerEvents = "auto";
    }
  });
});
