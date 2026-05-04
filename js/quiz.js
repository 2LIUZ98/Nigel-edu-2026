
document.addEventListener("DOMContentLoaded", () => {
    const student = requireStudentOrRedirect();
    if (!student) return;
  
    const params = new URLSearchParams(window.location.search);
    const moduleId = params.get("module") || "budgeting";
  
    const quizTitle = document.getElementById("quizTitle");
    const form = document.getElementById("quizForm");
    const msg = document.getElementById("quizMsg");
    const container = document.getElementById("quizQuestions");

    const backBtn = document.getElementById("backToLessonBtn");
    if (backBtn) backBtn.href = `lesson.html?module=${encodeURIComponent(moduleId)}`;
  
    const quizzes = {
      budgeting: {
        title: "Budgeting",
        questions: [
          {
            id: "q1",
            text: 'Which is a "need"?',
            correct: "b",
            options: [
              { v: "a", t: "New trainers" },
              { v: "b", t: "Food" },
              { v: "c", t: "Streaming subscription" }
            ]
          },
          {
            id: "q2",
            text: "Savings means...",
            correct: "a",
            options: [
              { v: "a", t: "Money you keep for later" },
              { v: "b", t: "Money you spend first" },
              { v: "c", t: "Money you borrow" }
            ]
          }
        ]
      },

"needs-wants": {
    title: "Needs vs wants",
    questions: [
        {
            id: "q1",
            text: "Which of these is a NEED",
            correct: "a",
            options:[
                {v: "a", t: "Food"},
                {v: "b", t: "Video game"},
                {v: "c", t: "New phone case"}
            ]
        },
    {
        id: "q2",
        text: "Which of these is a WANT",
        correct: "c",
        options: [
            {v: "a", t: "Heating at home"},
            {v: "b", t: "School uniform"},
            {v: "c", t: "Streaming subscription"},
        ]
    }

    ]
    
},
      scams: {
        title: "Scams",
        questions: [
          {
            id: "q1",
            text: "What is a common sign of a scam?",
            correct: "a",
            options: [
              { v: "a", t: "Urgent request for money" },
              { v: "b", t: "A school reminder" },
              { v: "c", t: "A receipt you asked for" }
            ]
          },
          {
            id: "q2",
            text: "What should you do if something looks suspicious?",
            correct: "c",
            options: [
              { v: "a", t: "Click the link quickly" },
              { v: "b", t: "Share your details" },
              { v: "c", t: "Check with a trusted adult" }
            ]
          }
        ]
      }
    };
  
    const quiz = quizzes[moduleId];
    if (!quiz) {
      container.innerHTML = "<p>No quiz available.</p>";
      return;
    }
  
    quizTitle.textContent = `Quiz: ${quiz.title}`;
  
    quiz.questions.forEach((q, index) => {
      const section = document.createElement("section");
      section.className = "card";
  
      section.innerHTML = `
        <p style="margin:0 0 10px; font-weight:700;">
          ${index + 1}) ${q.text}
        </p>
        ${q.options
          .map(
            o => `
            <label>
              <input type="radio" name="${q.id}" value="${o.v}">
              ${o.t}
            </label><br>
          `
          )
          .join("")}
      `;
  
      container.appendChild(section);
    });
  
    form.addEventListener("submit", async e => {
      e.preventDefault();
    
      let score = 0;
      const answersToSave = [];
    
      for (const q of quiz.questions) {
        const chosen = form.querySelector(`input[name="${q.id}"]:checked`);
    
        if (!chosen) {
          alert("Please answer all questions before submitting.");
          return;
        }
    
        const isCorrect = chosen.value === q.correct;
    
        if (isCorrect) {
          score++;
        }
    
        const options = form.querySelectorAll(`input[name="${q.id}"]`);
    
        options.forEach(input => {
          const label = input.parentElement;
    
          label.style.color = "";
          label.style.fontWeight = "";
    
          if (input.value === q.correct) {
            label.style.color = "green";
            label.style.fontWeight = "700";
          }
    
          if (input.checked && input.value !== q.correct) {
            label.style.color = "red";
            label.style.fontWeight = "700";
          }
        });
    
        answersToSave.push({
          student_id: student.studentId || student.student_id || student.id,
          module_id: moduleId === "budgeting" ? 1 :
                     moduleId === "needs-wants" ? 2 :
                     moduleId === "scams" ? 3 : 1,
          question_id: q.id,
          selected_answer: chosen.value,
          correct_answer: q.correct
        });
      }
    
      msg.textContent = `You scored ${score} out of ${quiz.questions.length}.`;
    
      if (score !== quiz.questions.length) {
        msg.textContent += " Check the highlighted answers and try again.";
        return;
      }
    
      for (const payload of answersToSave) {
        //await fetch("http://localhost:3000/quiz/submit", {
          await fetch(`${BASE_URL}/quiz/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }
    
      const submitBtn = document.getElementById("submitQuiz");
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitted";
    
      setTimeout(() => {
        window.location.href = "student-dashboard.html?updated=1";
      }, 2000);
    });
  });