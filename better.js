// Global student data
let studentData = null;

// ===========================
// LOGIN FUNCTION
// ===========================
async function login() {
    const studentId = document.getElementById('studentId').value.trim();
    const studentName = document.getElementById('studentName').value.trim();
    const errorMsg = document.getElementById('errorMsg');

    // Clear previous error
    errorMsg.style.display = 'none';

    // Validate inputs
    if (!studentId || !studentName) {
        errorMsg.textContent = 'Please enter both Student ID and Name';
        errorMsg.style.display = 'block';
        return;
    }

    try {
        // Send login request to Node.js server
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: studentId,
                name: studentName
            })
        });

        const data = await response.json();

        if (data.success) {
            studentData = data.student;
            showDashboard();
        } else {
            errorMsg.textContent = data.message || 'Invalid credentials';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.textContent = 'Connection error. Please try again.';
        errorMsg.style.display = 'block';
    }
}

// ===========================
// SHOW DASHBOARD
// ===========================
function showDashboard() {
    // Hide login, show dashboard
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';

    // Fill navigation bar
    document.getElementById('navUserName').textContent = studentData.name;

    // Load all sections
    loadProfile();
    loadSchedule();
    loadGrades();
    loadCourses();
}

// ===========================
// LOAD PROFILE SECTION
// ===========================
function loadProfile() {
    document.getElementById('profileId').textContent = studentData.id;
    document.getElementById('profileName').textContent = studentData.name;
    document.getElementById('profileEmail').textContent = studentData.email;
    document.getElementById('profileMajor').textContent = studentData.major;
    document.getElementById('profileLevel').textContent = studentData.level;
}

// ===========================
// LOAD SCHEDULE SECTION
// ===========================
function loadSchedule() {
    const scheduleContent = document.getElementById('scheduleContent');
    scheduleContent.innerHTML = '';

    if (!studentData.courses || studentData.courses.length === 0) {
        scheduleContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">📅</div>
                <p>No courses scheduled</p>
            </div>
        `;
        return;
    }

    studentData.courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'schedule-card';
        card.innerHTML = `
            <h3>${course.COURSE_N}</h3>
            <div class="schedule-info">
                <p>🕐 <span>Time:</span> ${course.SCHEDULE}</p>
                <p>🚪 <span>Room:</span> ${course.ROOM}</p>
                <p>👨‍🏫 <span>Instructor:</span> ${course.INSTRUCTOR || 'TBA'}</p>
            </div>
        `;
        scheduleContent.appendChild(card);
    });
}

// ===========================
// LOAD GRADES SECTION
// ===========================
function loadGrades() {
    const gradesContent = document.getElementById('gradesContent');
    gradesContent.innerHTML = '';

    if (!studentData.courses || studentData.courses.length === 0) {
        gradesContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">📊</div>
                <p>No grades available</p>
            </div>
        `;
        return;
    }

    const table = document.createElement('table');
    table.className = 'grades-table';
    
    // Create table header
    table.innerHTML = `
        <thead>
            <tr>
                <th>Course Name</th>
                <th>Schedule</th>
                <th>Grade</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    studentData.courses.forEach(course => {
        const row = document.createElement('tr');
        
        // Determine grade badge class
        let gradeBadgeClass = 'grade-badge';
        const grade = course.GRADE || 'N/A';
        if (grade.startsWith('A')) {
            gradeBadgeClass += ' grade-a';
        } else if (grade.startsWith('B')) {
            gradeBadgeClass += ' grade-b';
        } else if (grade.startsWith('C')) {
            gradeBadgeClass += ' grade-c';
        }

        row.innerHTML = `
            <td>${course.COURSE_N}</td>
            <td>${course.SCHEDULE}</td>
            <td><span class="${gradeBadgeClass}">${grade}</span></td>
        `;
        tbody.appendChild(row);
    });

    gradesContent.appendChild(table);
}

// ===========================
// LOAD COURSES SECTION
// ===========================
function loadCourses() {
    const coursesContent = document.getElementById('coursesContent');
    coursesContent.innerHTML = '';

    if (!studentData.courses || studentData.courses.length === 0) {
        coursesContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">📚</div>
                <p>No enrolled courses</p>
            </div>
        `;
        return;
    }

    studentData.courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-header">
                <h3>${course.COURSE_N}</h3>
                <p class="course-credit">Credits: ${course.CREDIT || 'N/A'}</p>
            </div>
            <div class="course-details">
                <div class="course-detail-item">
                    <span class="course-detail-label">Schedule:</span>
                    <span class="course-detail-value">${course.SCHEDULE}</span>
                </div>
                <div class="course-detail-item">
                    <span class="course-detail-label">Room:</span>
                    <span class="course-detail-value">${course.ROOM}</span>
                </div>
                <div class="course-detail-item">
                    <span class="course-detail-label">Grade:</span>
                    <span class="course-detail-value">${course.GRADE || 'Pending'}</span>
                </div>
                <div class="course-detail-item">
                    <span class="course-detail-label">Instructor:</span>
                    <span class="course-detail-value">${course.INSTRUCTOR || 'TBA'}</span>
                </div>
            </div>
        `;
        coursesContent.appendChild(card);
    });
}

// ===========================
// SHOW SECTION
// ===========================
function showSection(sectionId) {
    // Remove active class from all menu items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.remove('active'));

    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Add active class to clicked menu item
    event.target.closest('.menu-item').classList.add('active');
}

// ===========================
// LOGOUT FUNCTION
// ===========================
function logout() {
    studentData = null;
    
    // Show login screen
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';

    // Clear form
    document.getElementById('studentId').value = '';
    document.getElementById('studentName').value = '';
    document.getElementById('errorMsg').style.display = 'none';

    // Reset to profile section
    showSection('profile');
}

// ===========================
// ENTER KEY SUPPORT
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('#studentId, #studentName');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    });
});