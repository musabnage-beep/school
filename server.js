// ===========================
// IMPORT REQUIRED MODULES
// ===========================
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// ===========================
// CREATE EXPRESS APP
// ===========================
const app = express();
const PORT = 3000;

// ===========================
// MIDDLEWARE
// ===========================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ===========================
// DATABASE CONNECTION
// ===========================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'better',
    charset: 'utf8mb4'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL database: better');
});

// ===========================
// SERVE HTML PAGE
// ===========================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===========================
// LOGIN API ENDPOINT
// ===========================
app.post('/api/login', (req, res) => {
    const { id, name } = req.body;

    // Validate input
    if (!id || !name) {
        return res.status(400).json({
            success: false,
            message: 'Please provide both ID and Name'
        });
    }

    // Query to authenticate student
    const studentQuery = `
        SELECT 
            s.ID,
            s.F_NAME,
            s.L_NAME,
            CONCAT(s.F_NAME, ' ', s.L_NAME) as full_name,
            s.EMAIL,
            s.MAJOR,
            s.LEVEL
        FROM student s
        WHERE s.ID = ? AND CONCAT(s.F_NAME, ' ', s.L_NAME) = ?
    `;

    db.query(studentQuery, [id, name], (err, studentResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred'
            });
        }

        if (studentResults.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Student ID or Name'
            });
        }

        const student = studentResults[0];

        // Query to get student's courses
        const coursesQuery = `
            SELECT 
                c.COURSE_ID,
                c.COURSE_N,
                c.CREDIT,
                r.GRADE,
                sec.SCHEDULE,
                sec.ROOM,
                CONCAT(i.F_NAME, ' ', i.L_NAME) as INSTRUCTOR,
                sem.TERM,
                sem.YEAR
            FROM registration r
            JOIN section sec ON r.SEC_ID = sec.SECTION_ID
            JOIN course c ON sec.COURSE_ID = c.COURSE_ID
            LEFT JOIN instructor i ON sec.INSTC_ID = i.INSTRC_ID
            LEFT JOIN semester sem ON sec.SEMESTER_ID = sem.SEMESTER_ID
            WHERE r.STUDENT_ID = ?
            ORDER BY c.COURSE_N
        `;

        db.query(coursesQuery, [id], (err, coursesResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching courses'
                });
            }

            // Format courses data
            const courses = coursesResults.map(course => ({
                COURSE_ID: course.COURSE_ID,
                COURSE_N: course.COURSE_N,
                CREDIT: course.CREDIT,
                GRADE: course.GRADE,
                SCHEDULE: course.SCHEDULE,
                ROOM: course.ROOM,
                INSTRUCTOR: course.INSTRUCTOR,
                SEMESTER: `${course.TERM} ${course.YEAR}`
            }));

            // Return success response
            res.json({
                success: true,
                student: {
                    id: student.ID,
                    name: student.full_name,
                    firstName: student.F_NAME,
                    lastName: student.L_NAME,
                    email: student.EMAIL,
                    major: student.MAJOR,
                    level: student.LEVEL,
                    courses: courses
                }
            });
        });
    });
});

// ===========================
// GET STUDENT INFO API
// ===========================
app.get('/api/student/:id', (req, res) => {
    const studentId = req.params.id;

    const query = `
        SELECT 
            s.ID,
            CONCAT(s.F_NAME, ' ', s.L_NAME) as name,
            s.EMAIL,
            s.MAJOR,
            s.LEVEL
        FROM student s
        WHERE s.ID = ?
    `;

    db.query(query, [studentId], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            student: results[0]
        });
    });
});

// ===========================
// GET ALL COURSES API
// ===========================
app.get('/api/courses', (req, res) => {
    const query = `
        SELECT 
            c.COURSE_ID,
            c.COURSE_N,
            c.CREDIT,
            d.DEP_NAME as DEPARTMENT
        FROM course c
        LEFT JOIN department d ON c.DEP_ID = d.DEP_ID
        ORDER BY c.COURSE_N
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            courses: results
        });
    });
});

// ===========================
// ERROR HANDLING
// ===========================
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// ===========================
// 404 HANDLER
// ===========================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// ===========================
// START SERVER
// ===========================
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════');
    console.log('🚀 Node.js Server is running!');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🗄️  Database: better`);
    console.log('═══════════════════════════════════════');
});

// ===========================
// GRACEFUL SHUTDOWN
// ===========================
process.on('SIGINT', () => {
    console.log('\n⏹️  Shutting down server...');
    db.end((err) => {
        if (err) {
            console.error('server erorr:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});