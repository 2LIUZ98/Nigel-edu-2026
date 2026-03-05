

document.addEventListener("DOMContentLoaded", () => {
    const resetBtn = document.getElementById("resetAllBtn");

    if(resetBtn){
        resetBtn.addEventListener("click", () => {
            const ok = confirm("Reset all progress and log out?")
            if (!ok) return;

            resetStudent();
            window.location.href = "login-student.html"
        });
    }
});