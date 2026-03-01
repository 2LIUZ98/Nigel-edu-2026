document.addEventListener("DOMContentLoaded", () => {

    const me = requireStudentOrRedirect ();
    if (!me) return;

  
    const form = document.getElementById("joinForm");
    const nameE1 = document.getElementById("studentName");
    const codeE1 = document.getElementById("inviteCode");
    const msgE1 = document.getElementById("msg");

    const readJSON = (k, fallback) => {
        try{
            const raw = localStorage.getItem(k);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    };
    const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

    const showMsg = (text, ok = false) => {
        if (!msgE1) return;
        msgE1.textContent = text || "";
        msgE1.className = ok ? "msg ok" : "msg err";
        if (!text) msgE1.className = "msg";
    };
    const joined = readJSON("nigel_joined", {});
    if (joined[me.id]){
        window.location.href = "student-dashboard.html";
        return;
    }
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        showMsg("");
    
        const name = String(nameE1.value || "").trim();
        const codeIn = String(codeE1.value || "").trim().toUpperCase();
    
        if (!name) return showMsg("Please enter your name.");
        if (!codeIn) return showMsg("Please enter your invite code.");
    
        const codes = readJSON("nigel_codes", []);
        const match = codes.find(c => String(c.code || "").toUpperCase() === codeIn);
    
        if (!match) return showMsg("Invite code not found. Please check and try again.");
    
        if (String(match.studentId) !== String(me.id)) {
          return showMsg("That code is not linked to your account.");
        }
   
        joined[me.id] = {
          joinedAt: new Date().toISOString(),
          nameUsed: name,
          codeUsed: match.code
        };
        writeJSON("nigel_joined", joined);
    

        const users = readJSON("nigel_users", []);
        const i = users.findIndex(u => String(u.id) === String(me.id));
        if (i !== -1) {
          const parts = name.split(" ").filter(Boolean);
          users[i].firstName = parts[0] || users[i].firstName || "";
          users[i].lastName = parts.slice(1).join(" ") || users[i].lastName || "";
          writeJSON("nigel_users", users);
        }
    
        showMsg("Joined successfully.", true);
        window.location.href = "student-dashboard.html";
});
});