import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  dateOfBirth?: Date;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  enrollmentDate: Date;
  status: 'active' | 'inactive' | 'transferred';
  classes: mongoose.Types.ObjectId[];
  avatar?: string;
  notes?: string;
  createdAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    phone: { type: String },
    address: { type: String },
    parentName: { type: String },
    parentPhone: { type: String },
    parentEmail: { type: String },
    enrollmentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive', 'transferred'], default: 'active' },
    classes: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    avatar: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

StudentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model<IStudent>('Student', StudentSchema);
