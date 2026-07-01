import { Router, Response } from 'express';
import Attendance from '../models/Attendance';
import Grade from '../models/Grade';
import Student from '../models/Student';
import Class from '../models/Class';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(protect);

// GET /api/analytics/overview — dashboard summary
router.get('/overview', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const classes = await Class.find({ teacher: teacherId });
    const classIds = classes.map(c => c._id);

    const [totalStudents, totalClasses, attendanceCount, gradeCount] = await Promise.all([
      Student.countDocuments({ classes: { $in: classIds }, status: 'active' }),
      Class.countDocuments({ teacher: teacherId }),
      Attendance.countDocuments({ class: { $in: classIds } }),
      Grade.countDocuments({ class: { $in: classIds } }),
    ]);

    // Today's attendance
    const today = new Date();
    const todayStart = new Date(today.setHours(0,0,0,0));
    const todayEnd = new Date(today.setHours(23,59,59,999));
    const todayAttendance = await Attendance.find({
      class: { $in: classIds },
      date: { $gte: todayStart, $lte: todayEnd },
    });
    let presentToday = 0, absentToday = 0;
    for (const a of todayAttendance) {
      for (const r of a.records) {
        if (r.status === 'present' || r.status === 'late') presentToday++;
        else absentToday++;
      }
    }

    res.json({ totalStudents, totalClasses, attendanceCount, gradeCount, presentToday, absentToday });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// GET /api/analytics/attendance-trend/:classId — last 30 days
router.get('/attendance-trend/:classId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await Attendance.find({ class: classId, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 });
    const trend = records.map(r => {
      const counts = { present: 0, absent: 0, late: 0, excused: 0 };
      for (const rec of r.records) counts[rec.status]++;
      return { date: r.date.toISOString().split('T')[0], ...counts, total: r.records.length };
    });
    res.json(trend);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/grade-distribution/:classId
router.get('/grade-distribution/:classId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const grades = await Grade.find({ class: classId });
    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const studentScores: Record<string, { total: number; count: number }> = {};
    for (const g of grades) {
      const pct = (g.score / g.maxScore) * 100;
      const sid = g.student.toString();
      if (!studentScores[sid]) studentScores[sid] = { total: 0, count: 0 };
      studentScores[sid].total += pct;
      studentScores[sid].count++;
    }
    for (const sid of Object.keys(studentScores)) {
      const avg = studentScores[sid].total / studentScores[sid].count;
      if (avg >= 90) dist.A++;
      else if (avg >= 80) dist.B++;
      else if (avg >= 70) dist.C++;
      else if (avg >= 60) dist.D++;
      else dist.F++;
    }
    res.json(dist);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/analytics/performance/:classId — per-student averages
router.get('/performance/:classId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const [grades, attendance] = await Promise.all([
      Grade.find({ class: classId }).populate('student', 'firstName lastName studentId'),
      Attendance.find({ class: classId }),
    ]);

    // Aggregate grades per student
    const gradeMap: Record<string, { name: string; studentId: string; scores: number[] }> = {};
    for (const g of grades) {
      const s = g.student as unknown as { _id: string; firstName: string; lastName: string; studentId: string };
      const sid = s._id.toString();
      if (!gradeMap[sid]) gradeMap[sid] = { name: `${s.firstName} ${s.lastName}`, studentId: s.studentId, scores: [] };
      gradeMap[sid].scores.push((g.score / g.maxScore) * 100);
    }

    // Aggregate attendance per student
    const attMap: Record<string, { present: number; total: number }> = {};
    for (const a of attendance) {
      for (const r of a.records) {
        const sid = r.student.toString();
        if (!attMap[sid]) attMap[sid] = { present: 0, total: 0 };
        if (r.status === 'present' || r.status === 'late') attMap[sid].present++;
        attMap[sid].total++;
      }
    }

    const performance = Object.entries(gradeMap).map(([sid, data]) => ({
      studentId: sid,
      name: data.name,
      id: data.studentId,
      avgGrade: data.scores.length ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
      attendanceRate: attMap[sid] ? (attMap[sid].present / attMap[sid].total) * 100 : 0,
    }));

    res.json(performance);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
