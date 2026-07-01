import mongoose, { Document, Schema } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface IAttendanceRecord {
  student: mongoose.Types.ObjectId;
  status: AttendanceStatus;
  note?: string;
}

export interface IAttendance extends Document {
  class: mongoose.Types.ObjectId;
  date: Date;
  records: IAttendanceRecord[];
  takenBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
    note: { type: String },
  },
  { _id: false }
);

const AttendanceSchema = new Schema<IAttendance>(
  {
    class: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    date: { type: Date, required: true },
    records: [AttendanceRecordSchema],
    takenBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ class: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
