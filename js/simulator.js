document.addEventListener("DOMContentLoaded", () => {
    const student = requireStudentOrRedirect();
    if (!student) return;

    const toNumber = (v) => {
        const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
        return Number.isFinite(n) ? n : 0;
    };

    const incomeE1 = document.getElementById("income");
    const needsE1 = document.getElementById("needs");
    const wantsE1 = document.getElementById("wants");
    const  savingsE1 = document.getElementById("savings");

    const calcBtn = document.getElementById("calcBtn");
    const resetBtn = document.getElementById("slimResetBtn");
    const resultE1 = document.getElementById("slimResults");

    if(!incomeE1 || !needsE1 || ! wantsE1 || !savingsE1 || !calcBtn || !resultE1){
        return;
    }
    const render = (text) => {
        resultE1.textContent = text;
    };
    calcBtn.addEventListener("click", () => {
        const income = toNumber(incomeE1.value);
        const needs = toNumber(needsE1.value);
        const wants = toNumber(wantsE1.value);
        const savings = toNumber(savingsE1.value);
        const totalOut = needs + wants + savings; 
        const remaining = income - totalOut;

        let message = ` Total planned: £${totalOut.toFixed(2)}. Remaining: £${remaining.toFixed(2)} .`;
        if (income <= 0) {
            message = "Add your income to start. ";
        } else if (remaining < 0) {
            message += " You're spending more than you earn. Try reducing want or savings for now.";
        } else if (remaining === 0 ){
            message += "You've allocated everything. Nice and tidy.";
        } else {
            message += "Good job. You've got some money left over.";
        }
        render(message)

        if (!student.progress) student.progress= {};
        const prev = student.progress.simulator || {};
        const attempts = ( prev.attempts || 0) + 1;

        student.progress.simulator = {completed: true,
        attempts,
        lastCompleted: new Date().toISOString(),
        lastResult: {income, needs, wants, savings, remaining}
        };
        //localStorage.setItem("nigel_student", JSON.stringify(student));
        const session = getSession();

        if (session) {
            session.simulatorProgress = student.progress.simulator;
            setSession(session)
        }
    });

    if (resetBtn){
        resetBtn.addEventListener("click", () => {
            incomeE1.value= "";
            needsE1.value = "";
            wantsE1.value = "";
            savingsE1.value = "";
            render("Fill in your numbers and press Calculate.");
        });
    }
    render("Fill in your numbers and press Calculate.");
});