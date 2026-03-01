function getSession(){
    const raw = localStorage.getItem("nigel_session");
    if (!raw) return null;
    try{
        return JSON.parse(raw);
    } catch{
        return null;
    }
}
function setSession(session){
    localStorage.setItem("nigel_session", JSON.stringify(session));
}
function clearSession(){
    localStorage.removeItem("nigel_session");
}
function getUsers(){
    try{
        return JSON.parse(localStorage.getItem("nigel_users") || "[]");
    } catch {
        return [];
    }
}
function getCurrentUser(){
    const session = getSession();
    if (!session) return null;

    const users = getUsers();
    return users.find(u => u.id === session.userId) || null;
}
function requireStudentOrRedirect(){
    const session = getSession();
    if (!session || session.role !== "student"){
        window.location.href = "login-student.html";
        return null;
    }
    const user = getCurrentUser();
    if(!user){
        clearSession();
        window.location.href = "login-student.html";
        return null;
    }
    return user;
}

function requireStaffOrRedirect(){
    const session = getSession();
    if (!session || (session.role !== "teacher" && session.role !== "parent")) {
        window.location.href = "login-staff.html";
        return null;
    }
    const user = getCurrentUser();
    if (!user) {
        clearSession();
        window.location.href = "login-staff.html";
        return null;
    }

    return user;
}
