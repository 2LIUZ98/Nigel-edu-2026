const readJSON = (k, fallback) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const makeCode = (len = 6) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  const fmtTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return iso;
    }
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const me = requireStaffOrRedirect();
    console.log("Logged in user:", me)
    if (!me) return;

    const welcomeLine = document.getElementById("welcomeLine");
    const logoutBtn = document.getElementById("logoutBtn");

    const studentSelect = document.getElementById("studentSelect");
    const genBtn = document.getElementById("genBtn");
    const codeOut = document.getElementById("codeOut");
    const copyBtn = document.getElementById("copyBtn");
    const recentList = document.getElementById("recentList");
    const msg = document.getElementById("msg");

    let students = [];

    welcomeLine.textContent = `Logged in as ${me.firstName || ""} ${me.lastName || ""} (${me.role})`.trim();

    const showMsg = (text, ok = false) => {
      msg.textContent = text || "";
      msg.className = ok ? "msg ok" : "msg err";
      if (!text) msg.className = "msg";
    };

    const studentResultsList = document.getElementById("studentResultsList");

    const loadStudentResults = async () => {
        if (!studentResultsList) return;

        try{
            const response = await fetch(`http://localhost:3000/staff/student-results/${me.id}/${me.role}`);
            const results = await response.json();

            if (!results.length){
                studentResultsList.innerHTML = `<p class="hint"> No results found yet.</p>`;
                return;
            }
            studentResultsList.innerHTML = results.map(r => `
            <div style="margin-bottom: 14px;">
            <strong>${r.full_name}</strong>
            <p class="hint" style="margin:6px 0;">
             ${r.module_name}: ${r.progress_percent}% ${r.completed == 1 ?"Completed" : ""}
             </p>
             <div style="height:10px; background:#e7e9f2; border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:${r.progress_percent}%; background:#7c3aed;"></div>
                </div>
            </div> 
            `).join("");
        } catch (error){
            console.error(error);
            studentResultsList.innerHTML= `<p class="hint">Could not load results.</p>`;
        }
    };
   
    const renderRecent = () => {
      const codes = readJSON("nigel_codes", []).slice().reverse().slice(0, 6);

      if (!codes.length) {
        recentList.innerHTML = `<li><span class="who">No codes yet</span><span class="meta">Generate one to see it here</span></li>`;
        return;
      }

      const byId = Object.fromEntries(students.map(s => [String(s.student_id), s]));

      recentList.innerHTML = codes.map(c => {
        const who =
          c.studentId === "all"
            ? "All students"
            : (byId[String(c.studentId)]?.full_name || "Unknown student");

        return `
          <li>
            <div>
              <div class="who">${who}</div>
              <div class="meta">${fmtTime(c.createdAt)}</div>
            </div>
            <div class="who">${c.code}</div>
          </li>
        `;
      }).join("");
    };

    try {
      const response = await fetch("http://localhost:3000/students");
      students = await response.json();

      if (!response.ok) {
        throw new Error("Could not load students");
      }
let visibleStudents = students
if (me.role === "parent"){
    const childResponse = await fetch(`http://localhost:3000/parent/children/${me.id}`);
    visibleStudents = await childResponse.json();

}
if(!visibleStudents.length){
    studentSelect.innerHTML = `<option value="">No linked child found</option>`;
    genBtn.disabled = true;
} else{
    studentSelect.innerHTML = `
    ${me.role === "teacher" ? `<option value="all">Select all students</option>` : ""}
    ${visibleStudents
      .map(s => `<option value="${s.student_id}">${s.full_name} (${s.username})</option>`)
      .join("")}
  `;
  genBtn.disabled = false;
}
    } catch (error) {
      console.error(error);
      studentSelect.innerHTML = `<option value="">Could not load students</option>`;
      genBtn.disabled = true;
      showMsg("Could not load students.");
    }
    

      genBtn.addEventListener("click", async () => {
      showMsg("");

      const studentId = studentSelect.value;
      const moduleId = document.getElementById("moduleSelect").value;

      if (!moduleId) {
        showMsg("Please select a module.");
        return;
      }

      if (!studentId) {
        showMsg("Please select a student.");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/invitation-codes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            module_id: moduleId,
            student_id: studentId,
            created_by_user_id: me.id
          })
        });

        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          showMsg(data.message || "Could not create code.");
          return;
        }

        codeOut.textContent = data.code || "—";
        showMsg(data.message || "Code created.", true);
      } catch (error) {
        console.error(error);
        showMsg("Server not reachable.");
      }
    });

    copyBtn.addEventListener("click", async () => {
      const text = String(codeOut.textContent || "").trim();
      if (!text || text === "—") {
        showMsg("Nothing to copy yet.");
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        showMsg("Copied to clipboard.", true);
      } catch {
        showMsg("Could not copy. Select the code and copy manually.");
      }
    });

    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = "portal.html";
    });
    await loadStudentResults();
    renderRecent();
  });