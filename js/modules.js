document.addEventListener("DOMContentLoaded", () => {
    const student = requireStudentOrRedirect();
    if (!student) return;
    const progress = student.progress || {};

    const moduleLinks = Array.from(document.querySelectorAll('a[href^="lesson.html?module="]'));

    moduleLinks.forEach((link) => {
        const href = link.getAttribute("href") || "";
        const moduleId = href.split("module=")[1]? decodeURIComponent(href.split("module=")[1]) : null;
        if (!moduleId) return;

        const p = progress[moduleId];

        if (p && p.completed){
            link.textContent = "Review";

            const card = link.closest(".card");
            if (!card) return;

            if(card.querySelector('[data-completed="true"]')) return;

            const leftBlock = card.querySelector(".card-row > div");
            if (!leftBlock) return;

            const note = document.createElement("p");
            note.setAttribute("data-completed", "true");
            note.style.margin = "8px 0 0";
            note.style.fontSize = "13px";
            note.style.color = "var(--muted)";
            note.textContent = `Completed Score ${p.score ?? 0}/${p.total ?? 0}`;

            leftBlock.appendChild(note);
        }
    });

    const simulatorLink = document.querySelector('a[href="simulator.html"]');
    if (simulatorLink && progress.simulator && progress.simulator.completed){
        simulatorLink.textContent = "Review";
    }

});