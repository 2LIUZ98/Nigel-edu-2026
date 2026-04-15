document.addEventListener("DOMContentLoaded", () => {
  const student = requireStudentOrRedirect();
  if (!student) return;

  const greetingEl = document.getElementById("studentGreeting");
  const inviteCodeLabelEl = document.getElementById("inviteCodeLabel");
  const progressCountEl = document.getElementById("progressCount");
  const logoutBtn = document.getElementById("logoutBtn");

  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const name = [student.firstName, student.lastName].filter(Boolean).join(" ");
  if (greetingEl) {
    greetingEl.textContent = name ? `Hi ${name}` : `Hi ${student.username}`;
  }

  const allCodes = readJSON("nigel_codes", []);
  const myCodes = allCodes.filter(c => String(c.studentId) === String(student.studentId));

  const latest = myCodes
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];

  if (inviteCodeLabelEl) {
    inviteCodeLabelEl.textContent = latest ? latest.code : "No code generated yet";
  }

  const progressAll = readJSON("nigel_progress", {});
  const p = progressAll[student.studentId] || null;
  const modulesDone = p && Array.isArray(p.modulesCompleted) ? p.modulesCompleted.length : 0;

  if (progressCountEl) {
    progressCountEl.textContent = String(modulesDone);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = "portal.html";
    });
  }
});