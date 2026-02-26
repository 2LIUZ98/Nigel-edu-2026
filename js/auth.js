document .addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("joinForm");
    if (!form) return;

    form.addEventListener("submit", (e) =>{
        e.preventDefault();

        const name = (document.getElementById("studentName")?.value || "").trim();
        const inviteCode = (document.getElementById("inviteCode")?.value || "").trim();

        if (!name || !inviteCode){
            alert("Please enter your name and class code.");
            return;
        }

        const student = {
            id: String(Date.now()),
            name, inviteCode, progress: {}
        };

        localStorage.setItem("nigel_student", JSON.stringify(student))
        window.location.href = "student-dashboard.html";
    });
});
