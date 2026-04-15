const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

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
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const userResult = await pool.query(insertUserSql, [
      username,
      hashedPassword,
      role,
      first_name,
      last_name
    ]);

    const userId = userResult.rows[0].id;

    if (role === 'student') {
      if (!full_name) {
        return res.status(400).json({ message: 'Studenten brauchen einen Namen.' });
      }

      const insertStudentSql = `
        INSERT INTO students (user_id, full_name)
        VALUES ($1, $2)
      `;

      await pool.query(insertStudentSql, [userId, full_name]);

      return res.status(201).json({
        message: 'Student erfolgreich registriert.',
        user: {
          id: userId,
          username,
          role
        }
      });
    }

    return res.status(201).json({
      message: 'Account erfolgreich registriert.',
      user: {
        id: userId,
        username,
        role
      }
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Username existiert bereits.' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Serverfehler bei der Registrierung.' });
  }
});

// Student Login
app.post('/login/student', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Bitte Username und Passwort eingeben.' });
  }

  try {
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
      WHERE users.username = $1
    `;

    const result = await pool.query(sql, [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Ungültiger Username oder Passwort.' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Dieser Login ist nur für Studenten.' });
    }

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
    console.error(error);
    return res.status(500).json({ message: 'Fehler beim Login.' });
  }
});

// Staff Login
app.post('/login/staff', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Bitte Username und Passwort eingeben.' });
  }

  try {
    const sql = `
      SELECT id, username, password, role, first_name, last_name
      FROM users
      WHERE username = $1
    `;

    const result = await pool.query(sql, [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Ungültiger Username oder Passwort.' });
    }

    if (user.role !== 'teacher' && user.role !== 'parent') {
      return res.status(403).json({ message: 'Dieser Login ist nur für Eltern und Lehrer.' });
    }

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
    console.error(error);
    return res.status(500).json({ message: 'Fehler beim Login.' });
  }
});

// Students laden
app.get('/students', async (req, res) => {
  try {
    const sql = `
      SELECT 
        students.id AS student_id,
        students.full_name,
        users.username
      FROM students
      JOIN users ON students.user_id = users.id
      ORDER BY students.full_name ASC
    `;

    const result = await pool.query(sql);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Fehler beim Laden der Schüler.' });
  }
});

// Code prüfen
app.post('/verify-invitation-code', async (req, res) => {
  const { student_id, module_slug, code } = req.body;

  if (!student_id || !module_slug || !code) {
    return res.status(400).json({ message: 'student_id, module_slug und code sind erforderlich.' });
  }

  try {
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
      WHERE ic.code = $1
        AND m.slug = $2
        AND ic.is_active = 1
        AND (
          ic.student_id = $3
          OR ic.created_for_all_students = 1
        )
      LIMIT 1
    `;

    const result = await pool.query(sql, [code.trim(), module_slug.trim(), student_id]);
    const row = result.rows[0];

    if (!row) {
      return res.status(401).json({ message: 'Invalid code for this module.' });
    }

    return res.status(200).json({
      message: 'Code verified.',
      allowed: true
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Fehler beim Prüfen des Codes.' });
  }
});

// Code erstellen + Notifications
app.post('/invitation-codes', async (req, res) => {
  const { module_id, student_id, created_by_user_id } = req.body;

  if (!module_id || !student_id || !created_by_user_id) {
    return res.status(400).json({
      message: 'module_id, student_id und created_by_user_id sind erforderlich.'
    });
  }

  const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (student_id === 'all') {
      const studentsResult = await client.query(`SELECT id FROM students`);
      const students = studentsResult.rows;

      if (!students.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Keine Schüler gefunden.' });
      }

      const insertCodeSql = `
        INSERT INTO invitation_codes
        (code, module_id, student_id, created_by_user_id, created_for_all_students, is_active)
        VALUES ($1, $2, NULL, $3, 1, 1)
      `;

      await client.query(insertCodeSql, [generatedCode, module_id, created_by_user_id]);

      const moduleResult = await client.query(
        `SELECT module_name FROM modules WHERE id = $1`,
        [module_id]
      );

      const moduleRow = moduleResult.rows[0];
      if (!moduleRow) {
        await client.query('ROLLBACK');
        return res.status(500).json({ message: 'Fehler beim Laden des Moduls.' });
      }

      const title = 'New invitation code';
      const message = `A code was created for ${moduleRow.module_name}: ${generatedCode}`;

      const insertNotificationSql = `
        INSERT INTO notifications (student_id, module_id, title, message)
        VALUES ($1, $2, $3, $4)
      `;

      for (const student of students) {
        await client.query(insertNotificationSql, [student.id, module_id, title, message]);
      }

      await client.query('COMMIT');

      return res.status(201).json({
        message: 'Code für alle Schüler erstellt.',
        code: generatedCode
      });
    }

    const findExistingSql = `
      SELECT code
      FROM invitation_codes
      WHERE module_id = $1
        AND student_id = $2
        AND created_for_all_students = 0
        AND is_active = 1
      LIMIT 1
    `;

    const existingResult = await client.query(findExistingSql, [module_id, student_id]);
    const existing = existingResult.rows[0];
    const finalCode = existing ? existing.code : generatedCode;

    if (!existing) {
      const insertCodeSql = `
        INSERT INTO invitation_codes
        (code, module_id, student_id, created_by_user_id, created_for_all_students, is_active)
        VALUES ($1, $2, $3, $4, 0, 1)
      `;

      await client.query(insertCodeSql, [finalCode, module_id, student_id, created_by_user_id]);
    }

    const moduleResult = await client.query(
      `SELECT module_name FROM modules WHERE id = $1`,
      [module_id]
    );

    const moduleRow = moduleResult.rows[0];
    if (!moduleRow) {
      await client.query('ROLLBACK');
      return res.status(500).json({ message: 'Fehler beim Laden des Moduls.' });
    }

    const title = 'New invitation code';
    const message = `A code was created for ${moduleRow.module_name}: ${finalCode}`;

    const insertNotificationSql = `
      INSERT INTO notifications (student_id, module_id, title, message)
      VALUES ($1, $2, $3, $4)
    `;

    await client.query(insertNotificationSql, [student_id, module_id, title, message]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: existing
        ? 'Bestehender Code wiederverwendet und Benachrichtigung gesendet.'
        : 'Code erstellt und Benachrichtigung gesendet.',
      code: finalCode
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    return res.status(500).json({ message: 'Fehler beim Erstellen des Codes.' });
  } finally {
    client.release();
  }
});

// Notifications laden
app.get('/notifications/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const sql = `
      SELECT id, title, message, is_read, created_at
      FROM notifications
      WHERE student_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(sql, [studentId]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Fehler beim Laden der Benachrichtigungen.' });
  }
});

// Notifications als gelesen markieren
app.post('/notifications/mark-read', async (req, res) => {
  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({ message: 'student_id ist erforderlich.' });
  }

  try {
    const sql = `
      UPDATE notifications
      SET is_read = 1
      WHERE student_id = $1
        AND is_read = 0
    `;

    const result = await pool.query(sql, [student_id]);

    return res.status(200).json({
      message: 'Benachrichtigungen als gelesen markiert.',
      updated: result.rowCount
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Fehler beim Aktualisieren der Benachrichtigungen.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});