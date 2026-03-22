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
app.post('/login/student', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Bitte Username und Passwort eingeben.' });
  }

  const sql = `
    SELECT id, username, password, role
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
          id: user.id,
          username: user.username,
          role: user.role
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
    SELECT id, username, password, role
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
          role: user.role
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
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
