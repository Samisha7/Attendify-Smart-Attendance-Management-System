import { Router, Response } from 'express';
import Class from '../models/Class';
import Student from '../models/Student';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(protect);

// GET /api/classes
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classes = await Class.find({ teacher: req.user!.id })
      .populate('students', 'firstName lastName studentId')
      .sort({ name: 1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classes/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('students', 'firstName lastName studentId email status gender')
      .populate('teacher', 'name email');
    if (!cls) { res.status(404).json({ message: 'Class not found' }); return; }
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classes
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cls = await Class.create({ ...req.body, teacher: req.user!.id });
    res.status(201).json(cls);
  } catch (err) {
    res.status(400).json({ message: 'Validation error', error: String(err) });
  }
});

// PATCH /api/classes/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cls) { res.status(404).json({ message: 'Class not found' }); return; }
    res.json(cls);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: String(err) });
  }
});

// DELETE /api/classes/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classes/:id/enroll — enroll a student
router.post('/:id/enroll', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.body;
    const [cls, student] = await Promise.all([
      Class.findById(req.params.id),
      Student.findById(studentId),
    ]);
    if (!cls || !student) { res.status(404).json({ message: 'Class or student not found' }); return; }
    if (!cls.students.includes(student._id as import('mongoose').Types.ObjectId)) {
      cls.students.push(student._id as import('mongoose').Types.ObjectId);
      await cls.save();
    }
    if (!student.classes.includes(cls._id as import('mongoose').Types.ObjectId)) {
      student.classes.push(cls._id as import('mongoose').Types.ObjectId);
      await student.save();
    }
    res.json({ message: 'Student enrolled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/classes/:id/enroll/:studentId — unenroll
router.delete('/:id/enroll/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, studentId } = req.params;
    await Promise.all([
      Class.findByIdAndUpdate(id, { $pull: { students: studentId } }),
      Student.findByIdAndUpdate(studentId, { $pull: { classes: id } }),
    ]);
    res.json({ message: 'Student unenrolled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
