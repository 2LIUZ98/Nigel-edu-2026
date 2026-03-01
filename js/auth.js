window.readJSON = window.readJSON || function (key, fallback){
    try{
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch{
        return fallback
    }
}
window.writeJSON = window.writeJSON || function(key,value){
    localStorage.setItem(key, JSON.stringify(value));
}
window.getUsers = window.getUsers || function (){
    return readJSON("nigel_users", []);
}
window.getSession = window.getSession || function(){
    return readJSON("nigel_session", null);
}
window.setSession = window.setSession || function(session){
    writeJSON("nigel_session", session);
}
 window.clearSession = window.clearSession || function(){
    localStorage.removeItem("nigel_session");
}
window.getCurrentUser = window.getCurrentUser || function(){
    const session = getSession();
    if (!session || !session.userId) return null;

    const users = getUsers();
    return users.find(u => String(u.id) === String(session.userId)) || null;
}
window.requireStudentOrRedirect = window.requireStudentOrRedirect || function(){
    const me = getCurrentUser();
    if (!me || me.role !== "student"){
        window.location.href = "login-student.html";
        return null;
    }
    return me;
}
window.requireStaffOrRedirect = window.requireStaffOrRedirect || function(){
    const me = getCurrentUser();
    if (!me || me.role !== "teacher" && me.role !== "parent"){
        window.location.href = "login-staff.html";
        return null;
    }
    return me;
}