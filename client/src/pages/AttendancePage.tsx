import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarCheck, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, FileText, Save } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import api from '../lib/api'
import toast from 'react-hot-toast'

type Status = 'present' | 'absent' | 'late' | 'excused'

interface ClassOption { _id: string; name: string; subject: string; students: { _id: string; firstName: string; lastName: string; studentId: string }[] }
interface AttendanceRecord { student: string; status: Status; note?: string }

const statusConfig: Record<Status, { label: string; icon: React.ElementType; color: string; ring: string }> = {
  present: { label: 'Present', icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200', ring: 'ring-green-400' },
  absent: { label: 'Absent', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200', ring: 'ring-red-400' },
  late: { label: 'Late', icon: Clock, color: 'bg-yellow-50 text-yellow-700 border-yellow-200', ring: 'ring-yellow-400' },
  excused: { label: 'Excused', icon: FileText, color: 'bg-blue-50 text-blue-700 border-blue-200', ring: 'ring-blue-400' },
}

export default function AttendancePage() {
  const [searchParams] = useSearchParams()
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState(searchParams.get('classId') || '')
  const [date, setDate] = useState(new Date())
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState(false)

  useEffect(() => {
    api.get('/classes').then(({ data }) => {
      setClasses(data)
      if (!selectedClass && data.length > 0) setSelectedClass(data[0]._id)
    })
  }, [selectedClass])

  const currentClass = classes.find(c => c._id === selectedClass)

  // Load existing attendance when class/date changes
  const loadAttendance = useCallback(async () => {
    if (!selectedClass || !currentClass) return
    const dateStr = format(date, 'yyyy-MM-dd')
    // Initialize records with all students as present
    const defaultRecords = (currentClass.students || []).map(s => ({ student: s._id, status: 'present' as Status }))

    try {
      const { data } = await api.get(`/attendance?classId=${selectedClass}&date=${dateStr}`)
      if (data.length > 0) {
        const recordMap: Record<string, AttendanceRecord> = {}
        for (const r of data[0].records) {
          recordMap[r.student._id || r.student] = { student: r.student._id || r.student, status: r.status, note: r.note }
        }
        setRecords(defaultRecords.map(r => recordMap[r.student] || r))
        setExisting(true)
      } else {
        setRecords(defaultRecords)
        setExisting(false)
      }
    } catch { setRecords(defaultRecords); setExisting(false) }
  }, [selectedClass, date, currentClass])

  useEffect(() => { loadAttendance() }, [loadAttendance])

  function setStatus(studentId: string, status: Status) {
    setRecords(rs => rs.map(r => r.student === studentId ? { ...r, status } : r))
  }

  function markAll(status: Status) {
    setRecords(rs => rs.map(r => ({ ...r, status })))
  }

  async function saveAttendance() {
    if (!selectedClass) { toast.error('Select a class first'); return }
    setSaving(true)
    try {
      await api.post('/attendance', { classId: selectedClass, date: format(date, 'yyyy-MM-dd'), records })
      toast.success(existing ? 'Attendance updated' : 'Attendance saved')
      setExisting(true)
    } catch { toast.error('Failed to save attendance') }
    finally { setSaving(false) }
  }

  const counts = records.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {} as Record<string, number>)

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 text-sm">Track daily attendance for your classes</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-40">
          <label className="label">Class</label>
          <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select class...</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <div className="flex items-center gap-1">
            <button className="btn-ghost p-2" onClick={() => setDate(d => subDays(d, 1))}><ChevronLeft className="w-4 h-4" /></button>
            <input type="date" className="input" value={format(date, 'yyyy-MM-dd')}
              onChange={e => setDate(new Date(e.target.value + 'T12:00:00'))} />
            <button className="btn-ghost p-2" onClick={() => setDate(d => addDays(d, 1))}><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        {records.length > 0 && (
          <div className="flex gap-2 ml-auto flex-wrap">
            {(Object.keys(statusConfig) as Status[]).map(s => (
              <button key={s} onClick={() => markAll(s)}
                className={`btn text-xs py-1.5 border ${statusConfig[s].color}`}>
                Mark All {statusConfig[s].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary bar */}
      {records.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(statusConfig) as Status[]).map(s => (
            <div key={s} className={`card p-3 text-center border ${statusConfig[s].color}`}>
              <p className="text-xl font-bold">{counts[s] || 0}</p>
              <p className="text-xs">{statusConfig[s].label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance grid */}
      {!selectedClass ? (
        <div className="card p-12 text-center text-gray-400">
          <CalendarCheck className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>Select a class to take attendance</p>
        </div>
      ) : !currentClass?.students?.length ? (
        <div className="card p-12 text-center text-gray-400">
          <p>No students enrolled in this class</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900">{currentClass.name} — {format(date, 'EEEE, MMMM d, yyyy')}</h2>
              {existing && <span className="badge badge-blue">Updated</span>}
            </div>
            <div className="divide-y divide-gray-50">
              {currentClass.students.map(student => {
                const record = records.find(r => r.student === student._id)
                const status = record?.status || 'present'
                return (
                  <div key={student._id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-gray-500">{student.studentId}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {(Object.keys(statusConfig) as Status[]).map(s => {
                        const cfg = statusConfig[s]
                        const Icon = cfg.icon
                        const active = status === s
                        return (
                          <button key={s} onClick={() => setStatus(student._id, s)} title={cfg.label}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? `${cfg.color} ring-1 ${cfg.ring}` : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}>
                            <Icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{cfg.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button className="btn-primary" onClick={saveAttendance} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : existing ? 'Update Attendance' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
