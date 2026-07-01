import mongoose, { Document, Schema } from 'mongoose';

export interface IClass extends Document {
  name: string;
  subject: string;
  grade: string;
  teacher: mongoose.Types.ObjectId;
  schedule: string;
  room: string;
  academicYear: string;
  students: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    grade: { type: String, required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schedule: { type: String, default: '' },
    room: { type: String, default: '' },
    academicYear: { type: String, default: () => `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` },
    students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

export default mongoose.model<IClass>('Class', ClassSchema);
