document.addEventListener("DOMContentLoaded", async () => {
  const student = requireStudentOrRedirect();
  if (!student) return;

  const completedList = document.getElementById("completedList");
  const badgeList = document.getElementById("badgeList");

  try {
    const response = await fetch(`http://localhost:3000/progress/${student.id}`);
    const progressData = await response.json();

    if (!progressData.length) {
      completedList.textContent = "None yet";
      badgeList.textContent = "No badges yet";
      return;
    }

    completedList.innerHTML = progressData.map(item => `
      <div style="margin-bottom: 14px;">
        <strong>${item.module_name}</strong>
        <p class="sub" style="margin:6px 0;">
          Progress: ${item.progress_percent}%
        </p>
        <div style="height:10px; background:#e7e9f2; border-radius:999px; overflow:hidden;">
          <div style="height:100%; width:${item.progress_percent}%; background:#7c3aed;"></div>
        </div>
      </div>
    `).join("");

    const completedModules = progressData.filter(item => item.completed === 1 || item.completed === true);

    if (completedModules.length > 0) {
      badgeList.innerHTML = completedModules
        .map(item => `<span class="badge">${item.module_name} completed</span>`)
        .join(" ");
    } else {
      badgeList.textContent = "No badges yet";
    }

  } catch (error) {
    console.error(error);
    completedList.textContent = "Could not load progress.";
  }
});