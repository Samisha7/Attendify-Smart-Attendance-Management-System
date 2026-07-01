import { Router, Response } from 'express';
import Student from '../models/Student';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(protect);

// GET /api/students
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [students, total] = await Promise.all([
      Student.find(query).sort({ lastName: 1, firstName: 1 }).skip(skip).limit(parseInt(limit)).populate('classes', 'name subject'),
      Student.countDocuments(query),
    ]);
    res.json({ students, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

// GET /api/students/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await Student.findById(req.params.id).populate('classes', 'name subject grade schedule room');
    if (!student) { res.status(404).json({ message: 'Student not found' }); return; }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/students
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    if (e.code === 11000) { res.status(409).json({ message: 'Student ID or email already exists' }); return; }
    res.status(400).json({ message: 'Validation error', error: String(err) });
  }
});

// PATCH /api/students/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) { res.status(404).json({ message: 'Student not found' }); return; }
    res.json(student);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: String(err) });
  }
});

// DELETE /api/students/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) { res.status(404).json({ message: 'Student not found' }); return; }
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
