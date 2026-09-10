# 🎓 Student Task & Assignment Management System

A full-stack, enterprise-grade academic task and assignment management application inspired by Google Classroom, built from scratch using **Python FastAPI + PostgreSQL + React (Vite)**.

---

## ✨ System Features

### 🔐 Authentication & Roles
* **Strict Role Architecture**: Exactly two roles: `Admin` and `Student`.
* **JWT Authentication**: Token-based authentication with encrypted password hashing (Bcrypt) and role claims embedded in the JWT payload.
* **Role Guards**: Route guards on both frontend and backend (`AdminRoute`, `StudentRoute`, 403 Forbidden checks on REST APIs).
* **Role-Based Redirects**: Dynamic routing to `/admin/dashboard` or `/student/dashboard` based on the user's role upon login.
* **Profile Management**: Update full name, phone number, academic bio, and profile photo avatar (`.png`, `.jpg`, `.jpeg`, `.webp`), plus change password.

### 🛡️ Admin Capabilities
* **Dashboard Analytics**: Real-time KPI cards for active subjects, classes, student counts, assignment metrics, pending reviews, and completion rates.
* **Subjects & Curriculum**: Create, edit, search, and delete subjects with unique course codes (e.g. `CS-100`).
* **Classes & Sections**: Create cohorts per subject with custom semester, schedule, student capacity, and automated unique class code generation (e.g. `CS101-A`).
* **Student Roster Management**: View all enrolled students per class, add registered students directly to classes, or remove students.
* **Student Directory**: Global student management with search, activate/deactivate account status, and detailed student dossier modals (enrolled classes, submission history).
* **Assignments Creation**: Set title, description, question prompt, total marks, due date/time, and upload Question PDFs.
* **Submissions Review & Grading**: Inspect student solution PDFs via an embedded PDF Viewer modal, award marks, write feedback comments, and transition statuses to `Completed`.

### 🎒 Student Capabilities
* **Interactive Portal**: Join classes via 6-8 character unique class codes.
* **Scoped Views**: Students only see classes they are actively enrolled in and only assignments belonging to those classes.
* **Assignment Viewer**: View assignment prompts, instructions, points, and preview/download question PDFs.
* **Solution Uploads**: Upload solution PDF documents with notes and submit assignments before or after deadline.
* **Automatic Late Detection**: Submissions past due date are automatically flagged with the `Late` status badge.
* **Real-Time Gradebook**: View marks awarded, maximum points, and teacher evaluation comments.
* **Submission Timeline**: Filter assignments and review full submission history.

### 🔔 Notifications System
* In-app notification bell with live unread badge count and rich dropdown.
* Instant notifications generated for:
  * **New Assignment**: Notifies enrolled students when an assignment is posted in their class.
  * **Assignment Update**: Notifies students when deadlines or task requirements change.
  * **Student Submission**: Notifies instructors when a student submits work.
  * **Evaluation Complete**: Notifies student when their submission is graded with marks and feedback.
  * **Class Enrollment**: Notifies student and instructor when a student joins a class.
* Includes "Mark as Read" per item and "Mark All as Read" actions.

---

## 🏗️ Architecture & Tech Stack

```
Student Task & Assignment Management System
├── backend/                  # FastAPI REST API
│   ├── app/
│   │   ├── api/              # API Route Handlers (auth, subjects, classes, assignments, submissions, students, notifications, stats)
│   │   ├── core/             # Settings (pydantic-settings), database session, security (jwt + bcrypt)
│   │   ├── models/           # SQLAlchemy ORM Models (User, Subject, Class, ClassStudent, Assignment, Submission, Notification)
│   │   ├── schemas/          # Pydantic Schemas for request validation & serialization
│   │   ├── services/         # Notification & business logic services
│   │   └── main.py           # FastAPI application & middleware
│   ├── uploads/              # Local storage for avatars, question PDFs, and solution PDFs
│   ├── seed.py               # Comprehensive database seeder with sample PDFs
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Backend configuration
│   └── .env.example
├── frontend/                 # React 18 + Vite SPA
│   ├── src/
│   │   ├── components/       # Common reusable components, layouts, and cards
│   │   ├── context/          # AuthContext, ToastContext, NotificationContext
│   │   ├── pages/            # Admin, Student, Auth, and Profile pages
│   │   ├── services/         # Axios API clients
│   │   ├── App.jsx           # Role-based React Router routes
│   │   └── main.jsx          # Providers root
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
├── scripts/
│   ├── seed.js               # Node wrapper for npm run seed
│   └── start-dev.js          # Development server runner
├── package.json              # Root package orchestrator
└── README.md
```

* **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, Psycopg2, Pydantic v2, PyJWT, Bcrypt, ReportLab (PDF generation).
* **Database**: PostgreSQL 18 (`student_assignment_db` on port 5432).
* **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide React, Axios.

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Python 3.10+** (tested on Python 3.13)
2. **Node.js 18+** & npm
3. **PostgreSQL Server** (service running on port 5432)

### 1. Database Setup
Make sure PostgreSQL is running. Create the database if not already created:
```sql
CREATE DATABASE student_assignment_db;
```
Configure your database credentials in `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:internhub@localhost:5432/student_assignment_db
```

### 2. Install Dependencies

#### Backend:
```bash
# Windows
python -m venv backend\venv
backend\venv\Scripts\pip install -r backend\requirements.txt

# Linux / macOS
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

#### Frontend:
```bash
cd frontend
npm install
cd ..
```

### 3. Run Database Seeding
Execute the seed command directly from the root directory:
```bash
npm run seed
```
*(Alternatively: `python backend/seed.py`)*

### 4. Start the Application

You can launch both frontend and backend concurrently with:
```bash
npm run dev
```

Or run them in separate terminals:

**Terminal 1 (Backend - FastAPI):**
```bash
# Windows
backend\venv\Scripts\python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000

# Linux / macOS
source backend/venv/bin/activate
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be live at: `http://127.0.0.1:8000`  
Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

**Terminal 2 (Frontend - React + Vite):**
```bash
cd frontend
npm run dev
```
Frontend web application will be live at: `http://localhost:5173`

---

## 🔑 Test Credentials (Generated by Seeder)

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Prof. Robert Sterling | `admin@classroom.edu` | `Admin@123` |
| **Student** | John Doe | `john.doe@student.edu` | `Student@123` |
| **Student** | Jane Smith | `jane.smith@student.edu` | `Student@123` |
| **Student** | Alex Wilson | `alex.wilson@student.edu` | `Student@123` |
| **Student** | Sarah Jenkins | `sarah.jenkins@student.edu` | `Student@123` |

### Pre-configured Class Join Codes:
* **CS 101 - Section Alpha**: `CS101-A`
* **DSA 201 - Advanced Lab**: `DSA201-B`
* **DBMS 301 - Core Relational Architecture**: `DBMS301-A`

---

## 🔄 Complete Workflow Demonstration

1. **Admin Subject & Class Creation**:
   * Log in as `admin@classroom.edu`.
   * Go to **Subjects** &rarr; click **Add Subject** (e.g. *Artificial Intelligence* / `AI-401`).
   * Go to **Classes** &rarr; click **Create Class** &rarr; choose the subject, click **Generate Code** (e.g. `AI-99X2`), and publish.

2. **Student Joins the Class**:
   * Log in as `sarah.jenkins@student.edu` (or click the Student Demo button on the login screen).
   * Click **Join Class with Code** &rarr; input the code `AI-99X2`.
   * The student is now enrolled and has access to the class stream and assignments.

3. **Admin Creates Assignment**:
   * Back in the Admin portal, navigate to the class &rarr; click **New Assignment**.
   * Fill in title, due date, points (e.g. 100), instructions, and attach a Question PDF.
   * On submit, notifications are automatically dispatched to all enrolled students.

4. **Student Downloads Question & Submits Solution**:
   * Student logs in and receives a notification: *"New Assignment posted"*.
   * Navigates to the assignment, clicks **Inspect PDF** to preview questions.
   * Clicks **Turn In Solution** &rarr; selects their solution PDF report and adds notes.
   * System evaluates the submission time against due date &rarr; marks as `Submitted` or `Late`.

5. **Admin Evaluates & Grades**:
   * Admin receives notification of the incoming submission.
   * Opens **Submissions Directory** or the assignment's submissions tab.
   * Clicks **Inspect Solution** to review the student's submitted PDF inside the modal.
   * Clicks **Evaluate & Grade** &rarr; awards score (e.g. `95/100`), writes constructive feedback, and sets status to `Completed`.
   * Student dashboard immediately reflects the graded score, badge, and feedback.
