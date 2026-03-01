
document.addEventListener("DOMContentLoaded", () => {
    const student = requireStudentOrRedirect();
    if (!student) return;
    const greetingE1 = document.getElementById("studentGreeting");
    const inviteCodeLabelE1 = document.getElementById("inviteCodeLabel");
    const progressCountE1 = document.getElementById("progressCount");
    const logoutBtn = document.getElementById("logoutBtn");

    
    const readJSON = (key, fallback) =>{
        try{
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    };
    const name = [student.firstName, student.lastName].filter(Boolean).join(" ");
    if (greetingE1) greetingE1.textContent = name ? `Hi ${name}` : `Hi ${student.email}`;
    const joined = readJSON("nigel_joined", {});
    if (!joined[student.id]) {
        window.location.href = "join.html";
        return;
    }
  
  const allCodes = readJSON("nigel_codes", []);
  const myCodes = allCodes.filter(c => c.studentId === student.id);

  const latest = myCodes
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];

  if (inviteCodeLabelE1) inviteCodeLabelE1.textContent = latest ? latest.code : "No code generated yet";


  const progressAll = readJSON("nigel_progress", {});
  const p = progressAll[student.id] || null;

  const modulesDone = p && Array.isArray(p.modulesCompleted) ? p.modulesCompleted.length : 0;
  if (progressCountE1) progressCountE1.textContent = String(modulesDone);


  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      const sess = JSON.parse(localStorage.getItem("nigel_session") || "{}");
  
      let joined = {};
      try {
        joined = JSON.parse(localStorage.getItem("nigel_joined") || "{}");
      } catch {
        joined = {};
      }
  
      if (sess.userId) {
        delete joined[sess.userId];
        localStorage.setItem("nigel_joined", JSON.stringify(joined));
      }
  
      clearSession();
      window.location.href = "portal.html";
    });
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("updated") === "1") {
    const msg = document.getElementById("message");
    if (msg) msg.textContent = "Progress updated";
  }
});