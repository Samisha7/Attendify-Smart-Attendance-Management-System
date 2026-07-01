import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User';
import Student from './models/Student';
import Class from './models/Class';
import Attendance from './models/Attendance';
import Grade from './models/Grade';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendify');
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany({}), Student.deleteMany({}), Class.deleteMany({}), Attendance.deleteMany({}), Grade.deleteMany({})]);

  // Create teacher
  const teacher = await User.create({ name: 'Ms. Sarah Johnson', email: 'teacher@attendify.com', password: 'password123', role: 'teacher' });
  console.log('Created teacher: teacher@attendify.com / password123');

  // Create students
  const studentData = [
    { firstName: 'Alice', lastName: 'Anderson', email: 'alice@school.com', studentId: 'STU001', gender: 'female', parentName: 'Bob Anderson', parentEmail: 'bob.anderson@email.com' },
    { firstName: 'Brian', lastName: 'Baker', email: 'brian@school.com', studentId: 'STU002', gender: 'male', parentName: 'Carol Baker', parentEmail: 'carol.baker@email.com' },
    { firstName: 'Clara', lastName: 'Chen', email: 'clara@school.com', studentId: 'STU003', gender: 'female', parentName: 'David Chen', parentEmail: 'david.chen@email.com' },
    { firstName: 'Derek', lastName: 'Davis', email: 'derek@school.com', studentId: 'STU004', gender: 'male', parentName: 'Eva Davis', parentEmail: 'eva.davis@email.com' },
    { firstName: 'Emma', lastName: 'Evans', email: 'emma@school.com', studentId: 'STU005', gender: 'female', parentName: 'Frank Evans', parentEmail: 'frank.evans@email.com' },
    { firstName: 'Felix', lastName: 'Foster', email: 'felix@school.com', studentId: 'STU006', gender: 'male', parentName: 'Grace Foster', parentEmail: 'grace.foster@email.com' },
    { firstName: 'Grace', lastName: 'Green', email: 'grace@school.com', studentId: 'STU007', gender: 'female', parentName: 'Henry Green', parentEmail: 'henry.green@email.com' },
    { firstName: 'Henry', lastName: 'Hall', email: 'henry@school.com', studentId: 'STU008', gender: 'male', parentName: 'Iris Hall', parentEmail: 'iris.hall@email.com' },
    { firstName: 'Iris', lastName: 'Ingram', email: 'iris@school.com', studentId: 'STU009', gender: 'female', parentName: 'Jack Ingram', parentEmail: 'jack.ingram@email.com' },
    { firstName: 'James', lastName: 'Jones', email: 'james@school.com', studentId: 'STU010', gender: 'male', parentName: 'Kate Jones', parentEmail: 'kate.jones@email.com' },
  ];
  const students = await Student.insertMany(studentData);
  console.log(`Created ${students.length} students`);

  // Create class
  const cls = await Class.create({
    name: 'Mathematics 10A', subject: 'Mathematics', grade: '10', teacher: teacher._id,
    schedule: 'Mon/Wed/Fri 9:00 AM', room: 'Room 204', academicYear: '2025-2026',
    students: students.map(s => s._id),
  });
  await Student.updateMany({ _id: { $in: students.map(s => s._id) } }, { $push: { classes: cls._id } });
  console.log('Created class: Mathematics 10A');

  // Seed attendance for last 14 days
  const statuses: Array<'present' | 'absent' | 'late' | 'excused'> = ['present', 'present', 'present', 'present', 'present', 'absent', 'late', 'present', 'present', 'excused'];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const records = students.map((s, idx) => ({ student: s._id, status: statuses[idx % statuses.length] }));
    await Attendance.create({ class: cls._id, date, records, takenBy: teacher._id });
  }
  console.log('Seeded attendance records');

  // Seed grades
  const assessments = [
    { name: 'Quiz 1', type: 'quiz', maxScore: 20, weight: 10 },
    { name: 'Assignment 1', type: 'assignment', maxScore: 50, weight: 15 },
    { name: 'Quiz 2', type: 'quiz', maxScore: 20, weight: 10 },
    { name: 'Midterm', type: 'midterm', maxScore: 100, weight: 30 },
    { name: 'Project', type: 'project', maxScore: 100, weight: 20 },
  ];
  const gradeData = [];
  for (const student of students) {
    for (const assessment of assessments) {
      const score = Math.floor(Math.random() * (assessment.maxScore * 0.4) + assessment.maxScore * 0.6);
      gradeData.push({ student: student._id, class: cls._id, assessmentName: assessment.name, assessmentType: assessment.type, score, maxScore: assessment.maxScore, weight: assessment.weight, gradedBy: teacher._id });
    }
  }
  await Grade.insertMany(gradeData);
  console.log('Seeded grade records');

  console.log('\n✅ Seed complete!');
  console.log('Login: teacher@attendify.com / password123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
