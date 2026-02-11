
document.addEventListener("DOMContentLoaded", () => {
    const student = requireStudentOrRedirect();
    if (!student) return;

    const greetingE1 = document.getElementById("greeting");
    const classCodeE1 = document.getElementById("classCode");
    const progressCountE1 = document.getElementById("progressCount");

    if (greetingE1) greetingE1.textContent = `Hi ${student.name}`;
    if (classCodeE1) classCodeE1.textContent = student.classCodeE1;

    const completedCount = Object.values(student.progress || {}).filter(p => p?.completed).length;
    if (progressCountE1) progressCountE1.textContent = String(completedCount);

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            resetStudent();
            window.location.href = "login.html";
        });
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("updated") === "1") {
        const msg = document.getElementById("message");
        if (msg) msg.textContent = "Progress updated";
    }
});