require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

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
  const { username, password, role, full_name, first_name, last_name, child_username } = req.body;

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
    if (role === 'parent'){
      if (!child_username){
        return res.status(400).json({message: 'Child username is required for parents accounts.'});
      }
      const childResults = await pool.query(
        `SELECT s.id AS student_id
          FROM students s
          JOIN users u ON s.user_id = u.id
          WHERE u.username = $1
            AND u.role = 'student'
         `,
         [child_username]
      );
      const child = childResults.rows[0];

      if (!child){
        await pool.query(
          `DELETE FROM users WHERE id = $1`,
          [userId]
        );
        return res.status(400).json({message: 'Child student account not found.'});
      }
     const linkResult = await pool.query(
      `INSERT INTO parent_student (parent_user_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT (parent_user_id, student_id) DO NOTHING
        RETURNING *`,
        [userId, child.student_id]
     );
     if (linkResult.rowCount === 0) {
      return res.status(200).json({
        message: 'Parent already linked to this child',
        user: {
          id: userId,
          username,
          role
        }
      });
     }
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
    const creatorResult = await client.query(
      `SELECT role FROM users WHERE id = $1`,
      [created_by_user_id]
    );
    
    const creator = creatorResult.rows[0];
    
    if (!creator) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Creator user not found.' });
    }
    
    if (creator.role === 'parent') {
      if (student_id === 'all') {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Parents can only create codes for their own child.' });
      }
    
      const parentCheck = await client.query(
        `SELECT id FROM parent_student
         WHERE parent_user_id = $1
           AND student_id = $2`,
        [created_by_user_id, student_id]
      );
    
      if (!parentCheck.rows.length) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'You can only create codes for your own child.' });
      }
    }
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

// Submit quiz answer and update progress
app.post('/quiz/submit', async (req, res) => {
  const { student_id, module_id, question_id, selected_answer, correct_answer } = req.body;
  console.log("Quiz submit received:", req.body);

  if (!student_id || !module_id || !question_id || !selected_answer || !correct_answer) {
    return res.status(400).json({ message: 'Missing quiz answer data.' });
  }

  const isCorrect = selected_answer === correct_answer;

  try {
    await pool.query(
      `INSERT INTO quiz_answers
       (student_id, module_id, question_id, selected_answer, correct_answer, is_correct)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [student_id, module_id, question_id, selected_answer, correct_answer, isCorrect]
    );

    const progressResult = await pool.query(
      `SELECT 
         COUNT(*) AS total_questions,
         SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_answers
       FROM quiz_answers
       WHERE student_id = $1 AND module_id = $2`,
      [student_id, module_id]
    );

    const totalQuestions = Number(progressResult.rows[0].total_questions);
    const correctAnswers = Number(progressResult.rows[0].correct_answers || 0);
    const progressPercent = Math.round((correctAnswers / totalQuestions) * 100);
    const completed = progressPercent === 100 ? 1 : 0;

    await pool.query(
      `INSERT INTO progress
       (student_id, module_id, progress_percent, completed, last_updated)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (student_id, module_id)
       DO UPDATE SET
         progress_percent = EXCLUDED.progress_percent,
         completed = EXCLUDED.completed,
         last_updated = CURRENT_TIMESTAMP`,
      [student_id, module_id, progressPercent, completed]
    );

    return res.status(201).json({
      message: 'Quiz answer saved.',
      is_correct: isCorrect,
      progress_percent: progressPercent,
      completed
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error saving quiz answer.' });
  }
});
// Get progress for one student 
app.get('/progress/:studentId', async (req, res) =>{
  const {studentId} = req.params;

  try{
    const result = await pool.query(
      `SELECT
        p.student_id,
        p.module_id,
        m.module_name,
        m.slug,
        p.progress_percent,
        p.completed,
        p.last_updated
      FROM progress p
      JOIN modules m ON p.module_id = m.id
      WHERE p.student_id = $1
      ORDER BY m.id ASC`,
      [studentId]
    );
    return res.status(200).json(result.rows);

  }catch (error){
    console.error(error);
    return res.status(500).json({ message: 'Error loading progress'});
  }

});

app.get('/staff/student-results/:userId/:role', async (req, res) => {
  const {userId, role} = req.params;

  try{
    let sql;
    let params;

    if (role === 'teacher'){
      sql = `
      SELECT 
        s.id AS student_id,
        s.full_name,
        m.module_name,
        p.progress_percent,
        p.completed,
        p.last_updated
      FROM progress p
      JOIN students s ON p.student_id = s.id
      JOIN modules m ON p.module_id = m.id
      ORDER BY s.full_name ASC, m.id ASC
      `;
      params = [];
    } else if (role === 'parent'){
      sql = `
      SELECT 
        s.id AS student_id,
        s.full_name,
        m.module_name,
        p.progress_percent,
        p.completed,
        p.last_updated
      FROM progress p
      JOIN students s ON p.student_id = s.id
      JOIN modules m ON p.module_id = m.id
      JOIN parent_student ps ON ps.student_id = s.id
      WHERE ps.parent_user_id = $1
      ORDER BY s.full_name ASC, m.id ASC
      `;
      params = [userId];
    } else{
      return res.status(403).json({message: 'Invalid role.'});
    }
    const result = await pool.query( sql, params);
    return res.status(200).json(result.rows);

  } catch (error){
    console.error(error);
    return res.status(500).json({message: 'Error loading student results.'});
  }
});

app.get('/parent/children/:parentId', async (req, res) => {
  const {parentId} = req.params;

  try{
    const result = await pool.query(
      `SELECT s.id As student_id, s.full_name, u.username
      FROM parent_student ps
      JOIN students s ON ps.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE ps.parent_user_id = $1`,
      [parentId]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: 'Error loading linked children.'});
  }

});
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});