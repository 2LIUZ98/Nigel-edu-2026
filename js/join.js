document.addEventListener("DOMContentLoaded", () => {
  const student = requireStudentOrRedirect();
  if (!student) return;

  const form = document.getElementById("joinForm");
  const msg = document.getElementById("msg");
  const joinTitle = document.getElementById("joinTitle");

  const params = new URLSearchParams(window.location.search);
  const moduleSlug = params.get("module");

  const moduleTitles = {
    "budgeting": "Join Budgeting",
    "needs-wants": "Join Needs vs Wants",
    "scams": "Join Scams"
  };

  if (joinTitle) {
    joinTitle.textContent = moduleTitles[moduleSlug] || "Join module";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    msg.className = "msg";

    const code = document.getElementById("inviteCode").value.trim();

    if (!moduleSlug) {
      msg.textContent = "No module selected.";
      msg.className = "msg err";
      return;
    }

    if (!code) {
      msg.textContent = "Please enter your invitation code.";
      msg.className = "msg err";
      return;
    }

    try {
      console.log("Student session:", student);
      console.log("Sending student_id:", student.studentId || student.student_id || student.id);
      const response = await fetch("http://localhost:3000/verify-invitation-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          student_id: student.studentId || student.student_id || student.id,
          module_slug: moduleSlug,
          code
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        msg.textContent = data.message || "Code verification failed.";
        msg.className = "msg err";
        return;
      }

      msg.textContent = "Code verified. Redirecting...";
      msg.className = "msg ok";

      setTimeout(() => {
        window.location.href = `lesson.html?module=${encodeURIComponent(moduleSlug)}`;
      }, 500);

    } catch (error) {
      msg.textContent = "Server not reachable.";
      msg.className = "msg err";
      console.error(error);
    }
  });
});