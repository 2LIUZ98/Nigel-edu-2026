document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const msg = document.getElementById("msg");

    const roleSelect = document.getElementById("role");
    const childField = document.getElementById("childField");

    roleSelect.addEventListener("change", () => {
        childField.style.display = roleSelect.value === "parent" ? "block" : "none";
    });

    const setMsg = (text, ok = false) => {
        msg.textContent = text || "";
        msg.className = ok ? "msg ok" : "msg err";
        if (!text) msg.className = "msg";
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setMsg("");

        const role = document.getElementById("role").value;
        const firstName = String(document.getElementById("firstName").value || "").trim();
        const lastName = String(document.getElementById("lastName").value || "").trim();
        const username = String(document.getElementById("username").value || "").trim();
        const password = String(document.getElementById("password").value || "");
        const childUsername = String(document.getElementById("childUsername").value || "").trim();

        if (!role || !firstName || !lastName || !username || !password) {
            setMsg("Please fill in all fields.");
            return;
        }
        if (role === "parent" && !childUsername){
            setMsg("Please enter your child's username.")
            return;
        }

        if (password.length < 8) {
            setMsg("Password must be at least 8 characters.");
            return;
        }

        const full_name = `${firstName} ${lastName}`.trim();

        try {
            const body = {
                username,
                password,
                role,
                full_name,
                first_name: firstName,
                last_name: lastName
            };

            if (role === "parent"){
                body.child_username = childUsername
            }
            //const response = await fetch("http://localhost:3000/register", {
            const response = await fetch(`${BASE_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)

            });

            let data = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                setMsg(data.message || "Registration failed.");
                return;
            }

            setMsg("Account created. Redirecting...", true);

            setTimeout(() => {
                window.location.href = role === "student"
                    ? "login-student.html"
                    : "login-staff.html";
            }, 500);

        } catch (error) {
            setMsg("Server not reachable.");
            console.error(error);
        }
    });
});