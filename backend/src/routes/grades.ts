import { Router, Response } from 'express';
import Grade from '../models/Grade';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(protect);

// GET /api/grades?classId=&studentId=
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, studentId } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {};
    if (classId) query.class = classId;
    if (studentId) query.student = studentId;
    const grades = await Grade.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('class', 'name subject')
      .sort({ date: -1 });
    res.json(grades);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/grades
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const grade = await Grade.create({ ...req.body, gradedBy: req.user!.id });
    res.status(201).json(grade);
  } catch (err) {
    res.status(400).json({ message: 'Validation error', error: String(err) });
  }
});

// POST /api/grades/bulk
router.post('/bulk', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grades } = req.body;
    const toInsert = grades.map((g: Record<string,unknown>) => ({ ...g, gradedBy: req.user!.id }));
    const result = await Grade.insertMany(toInsert);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: 'Bulk insert failed', error: String(err) });
  }
});

// PATCH /api/grades/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!grade) { res.status(404).json({ message: 'Grade not found' }); return; }
    res.json(grade);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: String(err) });
  }
});

// DELETE /api/grades/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Grade.findByIdAndDelete(req.params.id);
    res.json({ message: 'Grade deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
