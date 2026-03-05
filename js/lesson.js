document.addEventListener("DOMContentLoaded", () => {
    const student = requireStudentOrRedirect();
    if (!student) return;
  
    const params = new URLSearchParams(window.location.search);
    const moduleId = params.get("module") || "budgeting";
  
    const lessons = {
      budgeting: {
        badge: "Module 1",
        title: "Budgeting basics",
        sub: "A simple way to plan your money.",
        body: `
          <p>A budget is a plan for your money. It helps you decide what to spend now and what to save for later.</p>
          <p><strong>A simple idea to start:</strong></p>
          <ul style="margin:10px 0 0; padding-left:18px; color: var(--muted);">
            <li><strong>Needs</strong> – things you must pay for (food, travel)</li>
            <li><strong>Wants</strong> – fun extras (games, snacks)</li>
            <li><strong>Savings</strong> – money you keep for later</li>
          </ul>
          <p style="margin-top:12px;">If you spend all your money on wants, you might struggle when you need something important.</p>
        `
      },
  
      "needs-wants": {
        badge: "Module 2",
        title: "Needs vs wants",
        sub: "Learn the difference quickly.",
        body: `
          <p><strong>Needs</strong> are essentials. They keep you safe and healthy.</p>
          <p><strong>Wants</strong> are extras. They’re nice to have, but you can live without them.</p>
          <p style="margin-top:12px;"><strong>Try this:</strong> If you had to cut spending for one week, what could you pause without a big problem?</p>
        `
      },
  
      scams: {
        badge: "Module 3",
        title: "Scams awareness",
        sub: "Spot warning signs and stay safe.",
        body: `
          <p>A scam is when someone tries to trick you into giving money, passwords, or personal info.</p>
          <p><strong>Common warning signs:</strong></p>
          <ul style="margin:10px 0 0; padding-left:18px; color: var(--muted);">
            <li>Pressure to act fast (“urgent”, “last chance”)</li>
            <li>Messages from unknown accounts</li>
            <li>Links that look odd</li>
          </ul>
          <p style="margin-top:12px;">If something feels off, stop and ask a trusted adult or teacher.</p>
        `
      }
    };
  
    const lesson = lessons[moduleId] || lessons.budgeting;
  
    document.getElementById("lessonTitle").textContent = lesson.title;
    document.getElementById("lessonSub").textContent = lesson.sub;
    document.getElementById("lessonBadge").textContent = lesson.badge;
    document.getElementById("lessonBody").innerHTML = lesson.body;
  
    const startQuizBtn = document.getElementById("startQuizBtn");
    startQuizBtn.href = `quiz.html?module=${encodeURIComponent(moduleId)}`;
  });
  