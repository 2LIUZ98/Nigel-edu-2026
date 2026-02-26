

document.addEventListener("DOMContentLoaded", () => {
    const student = requireStudentOrRedirect();
    if (!student) return;

    const list  = document.getElementById("progressList");
    const empty = document.getElementById("progressEmpty");

    const progress = student.progress || {};
    const entries = Object.entries(progress).filter(([, v]) => v?.completed);

    if (!list) return;

    if (!entries.length){
        if (empty) empty,style.display = "block";
        return;
    }
    if (empty) empty.style.display = "none";

    list.innerHTML = entries
    .map(([moduleId, p]) => {
        const nice = moduleId.replace("-", " ");
        return`
        <div class="card" style="margin-top:12px;">
          <div class="badge">${nice}</div>
          <p style="margin:10px 0 0; font-weight:700;">
            Score: ${p.score}/${p.total}
          </p>
          <p style="margin:6px 0 0; font-size:13px; color: var(--muted);">
            Attempts: ${p.attempts} • Last: ${new Date(p.lastCompleted).toLocaleString()}
          </p>
        </div>
      `;
    })
    .join("");
})