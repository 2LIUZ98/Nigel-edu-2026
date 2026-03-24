const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

const db = new sqlite3.Database('./database/nigel.db', (err) => {
  if (err) {
    console.error('Fehler beim Verbinden mit der Datenbank:', err.message);
  } else {
    console.log('Mit SQLite verbunden.');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Registrierung
app.post('/register', async (req, res) => {
  const { username, password, role, full_name, first_name, last_name } = req.body;

  if (!username || !password || !role || !first_name || !last_name) {
  return res.status(400).json({ message: 'Bitte alle Pflichtfelder ausfüllen.' });
  }

  if (!['student', 'parent', 'teacher'].includes(role)) {
    return res.status(400).json({ message: 'Ungültige Rolle.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertUserSql = `
  INSERT INTO users (username, password, role, first_name, last_name)
  VALUES (?, ?, ?, ?, ?)`;

    db.run(insertUserSql, [username, hashedPassword, role, first_name, last_name], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ message: 'Username existiert bereits.' });
        }
        return res.status(500).json({ message: 'Fehler beim Erstellen des Users.' });
      }

      const userId = this.lastID;

      if (role === 'student') {
        if (!full_name) {
          return res.status(400).json({ message: 'Studenten brauchen einen Namen.' });
        }

        const insertStudentSql = `
          INSERT INTO students (user_id, full_name)
          VALUES (?, ?)
        `;

        db.run(insertStudentSql, [userId, full_name], function (studentErr) {
          if (studentErr) {
            return res.status(500).json({ message: 'User erstellt, aber Student konnte nicht angelegt werden.' });
          }

          return res.status(201).json({
            message: 'Student erfolgreich registriert.',
            user: {
              id: userId,
              username,
              role
            }
          });
        });
      } else {
        return res.status(201).json({
          message: 'Account erfolgreich registriert.',
          user: {
            id: userId,
            username,
            role
          }
        });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Serverfehler bei der Registrierung.' });
  }
});

// Student Login
// Student Login
app.post('/login/student', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Bitte Username und Passwort eingeben.' });
  }

  const sql = `
    SELECT 
      users.id AS user_id,
      users.username,
      users.password,
      users.role,
      users.first_name,
      users.last_name,
      students.id AS student_id
    FROM users
    JOIN students ON students.user_id = users.id
    WHERE users.username = ?
  `;

  db.get(sql, [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Fehler beim Login.' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Ungültiger Username oder Passwort.' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Dieser Login ist nur für Studenten.' });
    }

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: 'Ungültiger Username oder Passwort.' });
      }

      return res.status(200).json({
        message: 'Student Login erfolgreich.',
        user: {
          id: user.user_id,
          student_id: user.student_id,
          username: user.username,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        }
      });
    } catch (error) {
      return res.status(500).json({ message: 'Fehler bei der Passwortprüfung.' });
    }
  });
});

// Staff Login (Teacher + Parent)
app.post('/login/staff', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Bitte Username und Passwort eingeben.' });
  }

  const sql = `
  SELECT id, username, password, role, first_name, last_name
  FROM users
  WHERE username = ?
`;

  db.get(sql, [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Fehler beim Login.' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Ungültiger Username oder Passwort.' });
    }

    if (user.role !== 'teacher' && user.role !== 'parent') {
      return res.status(403).json({ message: 'Dieser Login ist nur für Eltern und Lehrer.' });
    }

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: 'Ungültiger Username oder Passwort.' });
      }

      return res.status(200).json({
        message: 'Staff Login erfolgreich.',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        } 
      });
    } catch (error) {
      return res.status(500).json({ message: 'Fehler bei der Passwortprüfung.' });
    }
  });
});


// Load all Students into the Dropdown on the Teacher Dashboard
app.get('/students', (req, res) => {
  const sql = `
    SELECT 
      students.id AS student_id,
      students.full_name,
      users.username
    FROM students
    JOIN users ON students.user_id = users.id
    ORDER BY students.full_name ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Fehler beim Laden der Schüler.' });
    }

    return res.status(200).json(rows);
  });
});

//Check the code
app.post('/verify-invitation-code', (req, res) => {
  const { student_id, module_slug, code } = req.body;

  if (!student_id || !module_slug || !code) {
    return res.status(400).json({ message: 'student_id, module_slug und code sind erforderlich.' });
  }

  const sql = `
    SELECT 
      ic.id,
      ic.code,
      ic.student_id,
      ic.created_for_all_students,
      ic.is_active,
      m.slug
    FROM invitation_codes ic
    JOIN modules m ON ic.module_id = m.id
    WHERE ic.code = ?
      AND m.slug = ?
      AND ic.is_active = 1
      AND (
        ic.student_id = ?
        OR ic.created_for_all_students = 1
      )
    LIMIT 1
  `;

  db.get(sql, [code.trim(), module_slug.trim(), student_id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Fehler beim Prüfen des Codes.' });
    }

    if (!row) {
      return res.status(401).json({ message: 'Invalid code for this module.' });
    }

    return res.status(200).json({
      message: 'Code verified.',
      allowed: true
    });
  });
});

//Code notification for students
app.post('/invitation-codes', (req, res) => {
  const { module_id, student_id, created_by_user_id } = req.body;

  if (!module_id || !student_id || !created_by_user_id) {
    return res.status(400).json({
      message: 'module_id, student_id und created_by_user_id sind erforderlich.'
    });
  }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  if (student_id === 'all') {
    const getStudentsSql = `SELECT id FROM students`;

    db.all(getStudentsSql, [], (err, students) => {
      if (err) {
        return res.status(500).json({ message: 'Fehler beim Laden der Schüler.' });
      }

      if (!students.length) {
        return res.status(400).json({ message: 'Keine Schüler gefunden.' });
      }

      const insertCodeSql = `
        INSERT INTO invitation_codes
        (code, module_id, student_id, created_by_user_id, created_for_all_students, is_active)
        VALUES (?, ?, NULL, ?, 1, 1)
      `;

      db.run(insertCodeSql, [code, module_id, created_by_user_id], function (codeErr) {
        if (codeErr) {
          return res.status(500).json({ message: 'Fehler beim Speichern des Codes.' });
        }

        const getModuleSql = `SELECT module_name FROM modules WHERE id = ?`;

        db.get(getModuleSql, [module_id], (moduleErr, moduleRow) => {
          if (moduleErr || !moduleRow) {
            return res.status(500).json({ message: 'Fehler beim Laden des Moduls.' });
          }

          const title = 'New invitation code';
          const message = `A code was created for ${moduleRow.module_name}: ${code}`;

          const insertNotificationSql = `
            INSERT INTO notifications (student_id, module_id, title, message)
            VALUES (?, ?, ?, ?)
          `;

          let pending = students.length;

          students.forEach((student) => {
            db.run(insertNotificationSql, [student.id, module_id, title, message], (notifErr) => {
              if (notifErr) {
                console.error('Fehler beim Speichern der Benachrichtigung:', notifErr.message);
              }

              pending -= 1;
              if (pending === 0) {
                return res.status(201).json({
                  message: 'Code für alle Schüler erstellt.',
                  code
                });
              }
            });
          });
        });
      });
    });

    return;
  }

  const findExistingSql = `
    SELECT code
    FROM invitation_codes
    WHERE module_id = ?
      AND student_id = ?
      AND created_for_all_students = 0
      AND is_active = 1
    LIMIT 1
  `;

  db.get(findExistingSql, [module_id, student_id], (findErr, existing) => {
    if (findErr) {
      return res.status(500).json({ message: 'Fehler beim Prüfen bestehender Codes.' });
    }

    const finalCode = existing ? existing.code : code;

    const continueWithNotification = () => {
      const getModuleSql = `SELECT module_name FROM modules WHERE id = ?`;

      db.get(getModuleSql, [module_id], (moduleErr, moduleRow) => {
        if (moduleErr || !moduleRow) {
          return res.status(500).json({ message: 'Fehler beim Laden des Moduls.' });
        }

        const title = 'New invitation code';
        const message = `A code was created for ${moduleRow.module_name}: ${finalCode}`;

        const insertNotificationSql = `
          INSERT INTO notifications (student_id, module_id, title, message)
          VALUES (?, ?, ?, ?)
        `;

        db.run(insertNotificationSql, [student_id, module_id, title, message], function (notifErr) {
          if (notifErr) {
            return res.status(500).json({
              message: 'Code gespeichert, aber Benachrichtigung fehlgeschlagen.'
            });
          }

          return res.status(201).json({
            message: existing ? 'Bestehender Code wiederverwendet und Benachrichtigung gesendet.' : 'Code erstellt und Benachrichtigung gesendet.',
            code: finalCode
          });
        });
      });
    };

    if (existing) {
      continueWithNotification();
      return;
    }

    const insertCodeSql = `
      INSERT INTO invitation_codes
      (code, module_id, student_id, created_by_user_id, created_for_all_students, is_active)
      VALUES (?, ?, ?, ?, 0, 1)
    `;

    db.run(insertCodeSql, [finalCode, module_id, student_id, created_by_user_id], function (insertErr) {
      if (insertErr) {
        return res.status(500).json({ message: 'Fehler beim Speichern des Codes.' });
      }

      continueWithNotification();
    });
  });
});
app.get('/notifications/:studentId', (req, res) => {
  const { studentId } = req.params;

  const sql = `
    SELECT id, title, message, is_read, created_at
    FROM notifications
    WHERE student_id = ?
    ORDER BY created_at DESC
  `;

  db.all(sql, [studentId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Fehler beim Laden der Benachrichtigungen.' });
    }

    return res.status(200).json(rows);
  });
});
app.post('/notifications/mark-read', (req, res) => {
  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({ message: 'student_id ist erforderlich.' });
  }

  const sql = `
    UPDATE notifications
    SET is_read = 1
    WHERE student_id = ?
      AND is_read = 0
  `;

  db.run(sql, [student_id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Fehler beim Aktualisieren der Benachrichtigungen.' });
    }

    return res.status(200).json({
      message: 'Benachrichtigungen als gelesen markiert.',
      updated: this.changes
    });
  });
});
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
