const STORAGE_KEY = "nigel_student";

 function getStudent() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try{
        return JSON.parse(raw);
    } catch{
        return null
    }
}

 function setStudent(student){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(student));
}

 function requireStudentOrRedirect(){
    const student = getStudent();
    if (!student) {
        window.location.href = "login.html";
        return null;
    }
    return student;
}

 function resetStudent() {
    localStorage.removeItem(STORAGE_KEY);
}