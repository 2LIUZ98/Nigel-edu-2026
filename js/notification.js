document.addEventListener("DOMContentLoaded", () => {
  const student = getCurrentUser();
  if (!student || student.role !== "student" || !student.studentId) return;

  const notifWrap = document.getElementById("notifWrap");
  const notifBtn = document.getElementById("notifBtn");
  const notifBadge = document.getElementById("notifBadge");
  const notifPanel = document.getElementById("notifPanel");
  const notifList = document.getElementById("notifList");

  if (!notifBtn || !notifBadge || !notifPanel || !notifList) return;

  async function loadNotifications() {
    try {
      //const response = await fetch(`http://localhost:3000/notifications/${student.studentId}`);
      const response = await fetch(`${BASE_URL}/notifications/${student.studentId}`);
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

      if (unreadCount > 0) {
        notifBadge.textContent = String(unreadCount);
        notifBadge.style.display = "inline-block";
      } else {
        notifBadge.style.display = "none";
      }
    } catch (error) {
      console.error(error);
      notifList.innerHTML = `<p style="margin:0;">Could not load notifications</p>`;
      notifBadge.style.display = "none";
    }
  }

  async function markNotificationsRead() {
    try {
      //await fetch("http://localhost:3000/notifications/mark-read", {
      await fetch(`${BASE_URL}/notifications/mark-read`, {        
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

  notifBtn.addEventListener("click", async (event) => {
    event.stopPropagation();

    const isOpen = notifPanel.style.display === "block";
    notifPanel.style.display = isOpen ? "none" : "block";

    if (!isOpen) {
      await markNotificationsRead();
      await loadNotifications();
    }
  });

  document.addEventListener("click", (event) => {
    if (!notifWrap.contains(event.target)) {
      notifPanel.style.display = "none";
    }
  });

  loadNotifications();
});