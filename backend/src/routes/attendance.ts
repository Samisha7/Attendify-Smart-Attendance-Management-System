import { Router, Response } from 'express';
import Attendance from '../models/Attendance';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(protect);

// GET /api/attendance?classId=&date=&startDate=&endDate=
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, date, startDate, endDate } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {};
    if (classId) query.class = classId;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string,Date>).$gte = new Date(startDate);
      if (endDate) (query.date as Record<string,Date>).$lte = new Date(endDate);
    }
    const records = await Attendance.find(query)
      .populate('records.student', 'firstName lastName studentId')
      .populate('class', 'name subject')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// POST /api/attendance — create or update attendance for a class/date
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, date, records } = req.body;
    const d = new Date(date);
    const dayStart = new Date(d.setHours(0,0,0,0));
    const dayEnd = new Date(d.setHours(23,59,59,999));

    const existing = await Attendance.findOne({ class: classId, date: { $gte: dayStart, $lte: dayEnd } });
    let attendance;
    if (existing) {
      existing.records = records;
      existing.takenBy = req.user!.id as unknown as import('mongoose').Types.ObjectId;
      attendance = await existing.save();
    } else {
      attendance = await Attendance.create({ class: classId, date: new Date(date), records, takenBy: req.user!.id });
    }
    res.status(201).json(attendance);
  } catch (err) {
    res.status(400).json({ message: 'Error saving attendance', error: String(err) });
  }
});

// GET /api/attendance/student/:studentId — attendance history for a student
router.get('/student/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { classId } = req.query as Record<string, string>;
    const query: Record<string, unknown> = { 'records.student': studentId };
    if (classId) query.class = classId;
    const records = await Attendance.find(query).populate('class', 'name subject').sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/summary/:classId — summary stats per student
router.get('/summary/:classId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const records = await Attendance.find({ class: classId });
    const summary: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
    for (const session of records) {
      for (const r of session.records) {
        const sid = r.student.toString();
        if (!summary[sid]) summary[sid] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        summary[sid][r.status]++;
        summary[sid].total++;
      }
    }
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
