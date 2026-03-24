document.addEventListener("DOMContentLoaded", () => {
  const student = requireStudentOrRedirect();
  if (!student) return;

  const greetingEl = document.getElementById("studentGreeting");
  const inviteCodeLabelEl = document.getElementById("inviteCodeLabel");
  const progressCountEl = document.getElementById("progressCount");
  const logoutBtn = document.getElementById("logoutBtn");

  const notifBtn = document.getElementById("notifBtn");
  const notifBadge = document.getElementById("notifBadge");
  const notifPanel = document.getElementById("notifPanel");
  const notifList = document.getElementById("notifList");

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

  async function loadNotifications() {
    try {
      const response = await fetch(`http://localhost:3000/notifications/${student.studentId}`);
      let notifications = [];

      try {
        notifications = await response.json();
      } catch {
        notifications = [];
      }

      if (!response.ok) {
        throw new Error("Could not load notifications");
      }

      const unreadCount = notifications.filter(n => n.is_read === 0).length;

      if (notifList) {
        if (!notifications.length) {
          notifList.innerHTML = `<p style="margin:0;">No notifications</p>`;
        } else {
          notifList.innerHTML = notifications.map(n => `
            <div style="padding:10px 0; border-bottom:1px solid rgba(0,0,0,0.08);">
              <div style="font-weight:700;">${n.title}</div>
              <div style="font-size:14px; margin-top:4px;">${n.message}</div>
              <div style="font-size:12px; opacity:0.7; margin-top:4px;">
                ${new Date(n.created_at).toLocaleString()}
              </div>
            </div>
          `).join("");
        }
      }

      if (notifBadge) {
        if (unreadCount > 0) {
          notifBadge.textContent = String(unreadCount);
          notifBadge.style.display = "inline-block";
        } else {
          notifBadge.style.display = "none";
        }
      }
    } catch (error) {
      console.error(error);
      if (notifList) {
        notifList.innerHTML = `<p style="margin:0;">Could not load notifications</p>`;
      }
      if (notifBadge) {
        notifBadge.style.display = "none";
      }
    }
  }

  async function markNotificationsRead() {
    try {
      await fetch("http://localhost:3000/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          student_id: student.studentId
        })
      });
    } catch (error) {
      console.error(error);
    }
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

  if (notifBtn) {
    notifBtn.addEventListener("click", async (event) => {
      event.stopPropagation();

      const isOpen = notifPanel && notifPanel.style.display === "block";

      if (notifPanel) {
        notifPanel.style.display = isOpen ? "none" : "block";
      }

      if (!isOpen) {
        await markNotificationsRead();
        await loadNotifications();
      }
    });
  }

  document.addEventListener("click", (event) => {
    const notifWrap = document.getElementById("notifWrap");
    const notifPanel = document.getElementById("notifPanel");

    if (!notifWrap || !notifPanel) return;

    if (!notifWrap.contains(event.target)) {
      notifPanel.style.display = "none";
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = "portal.html";
    });
  }

  loadNotifications();
});