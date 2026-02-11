document .addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("joinForm");
    if (!form) return;

    form.addEventListener("submit", (e) =>{
        e.preventDefault();

        const name = (document.getElementById("studentName")?.value || "").trim();
        const classCode = (document.getElementById("classCode")?.value || "").trim();

        if (!name || !classCode){
            alert("Please enter your name and class code.");
            return;
        }

        const student = {
            id: String(Date.now()),
            name, classCode, progress: {}
        };

        localStorage.setItem("nigel_student", JSON.stringify(student))
        window.location.href = "student-dashboard.html";
    });
});
