window.readJSON = window.readJSON || function (key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

window.writeJSON = window.writeJSON || function (key, value) {
    localStorage.setItem(key, JSON.stringify(value));
};

window.getSession = window.getSession || function () {
    return readJSON("nigel_session", null);
};

window.setSession = window.setSession || function (session) {
    writeJSON("nigel_session", session);
};

window.clearSession = window.clearSession || function () {
    localStorage.removeItem("nigel_session");
};

window.getCurrentUser = window.getCurrentUser || function () {
    const session = getSession();
    if (!session || !session.userId || !session.role) return null;

    return {
    id: session.userId,
    studentId: session.studentId || null,
    role: session.role,
    username: session.username || "",
    firstName: session.first_name || "",
    lastName: session.last_name || ""
};
};

window.requireStudentOrRedirect = window.requireStudentOrRedirect || function () {
    const me = getCurrentUser();
    if (!me || me.role !== "student") {
        const next = encodeURIComponent(
            window.location.pathname.split("/").pop() + window.location.search
        );
        window.location.href = `login-student.html?next=${next}`;
        return null;
    }
    return me;
};

window.requireStaffOrRedirect = window.requireStaffOrRedirect || function () {
    const me = getCurrentUser();
    if (!me || (me.role !== "teacher" && me.role !== "parent")) {
        const next = encodeURIComponent(
            window.location.pathname.split("/").pop() + window.location.search
        );
        window.location.href = `login-staff.html?next=${next}`;
        return null;
    }
    return me;
};