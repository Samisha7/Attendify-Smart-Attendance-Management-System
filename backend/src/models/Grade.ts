import mongoose, { Document, Schema } from 'mongoose';

export interface IGrade extends Document {
  student: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  assessmentName: string;
  assessmentType: 'quiz' | 'assignment' | 'midterm' | 'final' | 'project' | 'participation';
  score: number;
  maxScore: number;
  weight: number;
  date: Date;
  feedback?: string;
  gradedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const GradeSchema = new Schema<IGrade>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    class: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    assessmentName: { type: String, required: true, trim: true },
    assessmentType: {
      type: String,
      enum: ['quiz', 'assignment', 'midterm', 'final', 'project', 'participation'],
      required: true,
    },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
    weight: { type: Number, default: 1, min: 0, max: 100 },
    date: { type: Date, default: Date.now },
    feedback: { type: String },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

GradeSchema.virtual('percentage').get(function () {
  return (this.score / this.maxScore) * 100;
});

export default mongoose.model<IGrade>('Grade', GradeSchema);
