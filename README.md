# Attendify — Student Attendance & Performance Tracker

A full-stack web app for teachers to track attendance, manage student records, and visualize academic performance.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Recharts
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT

## Features

- 🔐 **Auth** — JWT login/register for teachers
- 🎓 **Students** — Full CRUD, search/filter, parent contact info
- 📚 **Classes** — Create classes, enroll/unenroll students
- ✅ **Attendance** — Daily attendance with present/absent/late/excused per student, date navigation
- 📊 **Grades** — Record assessments by type (quiz, midterm, final, project, etc.)
- 📈 **Analytics** — Attendance trends, grade distribution pie chart, grade vs attendance scatter, student radar chart, at-risk flagging

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

### Install dependencies
```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### Configure environment
Edit `server/.env` — defaults work with local MongoDB.

### Seed demo data
```bash
cd server && npm run seed
```
This creates:
- 1 teacher account: `teacher@attendify.com` / `password123`
- 10 students enrolled in Mathematics 10A
- 14 days of attendance data
- 50 grade records

### Run the app

**Terminal 1 — Backend:**
```bash
cd server && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/students | List students |
| POST | /api/students | Create student |
| GET | /api/classes | List classes |
| POST | /api/attendance | Save attendance |
| GET | /api/analytics/overview | Dashboard stats |
| GET | /api/analytics/performance/:classId | Per-student performance |
