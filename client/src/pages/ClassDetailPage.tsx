import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, UserPlus, X, Users } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface ClassDetail {
  _id: string; name: string; subject: string; grade: string; schedule: string; room: string; academicYear: string
  teacher: { name: string; email: string }
  students: { _id: string; firstName: string; lastName: string; studentId: string; email: string; status: string }[]
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [cls, setCls] = useState<ClassDetail | null>(null)
  const [allStudents, setAllStudents] = useState<{ _id: string; firstName: string; lastName: string; studentId: string }[]>([])
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchClass = useCallback(async () => {
    try {
      const { data } = await api.get(`/classes/${id}`)
      setCls(data)
    } catch { toast.error('Failed to load class') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchClass() }, [fetchClass])

  async function loadAllStudents() {
    const { data } = await api.get('/students?limit=100')
    setAllStudents(data.students)
    setEnrollOpen(true)
  }

  async function enrollStudent() {
    if (!selectedStudent) return
    try {
      await api.post(`/classes/${id}/enroll`, { studentId: selectedStudent })
      toast.success('Student enrolled')
      setEnrollOpen(false)
      setSelectedStudent('')
      fetchClass()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to enroll')
    }
  }

  async function unenrollStudent(studentId: string) {
    if (!confirm('Remove this student from the class?')) return
    try {
      await api.delete(`/classes/${id}/enroll/${studentId}`)
      toast.success('Student removed')
      fetchClass()
    } catch { toast.error('Failed to remove student') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!cls) return <div className="text-center py-20 text-gray-400">Class not found</div>

  const enrolledIds = new Set(cls.students.map(s => s._id))

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Link to="/classes" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
          <p className="text-gray-500 text-sm">{cls.subject} · Grade {cls.grade} · {cls.academicYear}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Class info */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Class Info</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="text-gray-400">Teacher:</span> {cls.teacher?.name}</p>
            <p><span className="text-gray-400">Schedule:</span> {cls.schedule || '—'}</p>
            <p><span className="text-gray-400">Room:</span> {cls.room || '—'}</p>
            <p><span className="text-gray-400">Students:</span> {cls.students.length}</p>
          </div>
          <div className="pt-2 flex gap-2">
            <Link to={`/attendance?classId=${id}`} className="btn-secondary text-xs flex-1 justify-center">Take Attendance</Link>
            <Link to={`/grades?classId=${id}`} className="btn-secondary text-xs flex-1 justify-center">Grades</Link>
          </div>
        </div>

        {/* Students list */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Enrolled Students ({cls.students.length})</h2>
            </div>
            <button className="btn-primary text-xs py-1.5" onClick={loadAllStudents}>
              <UserPlus className="w-3.5 h-3.5" /> Enroll Student
            </button>
          </div>
          {cls.students.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No students enrolled yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 hidden sm:table-cell">ID</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Status</th>
                <th className="w-10 px-4 py-2.5" />
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {cls.students.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <Link to={`/students/${s._id}`} className="flex items-center gap-2 group">
                        <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold">{s.firstName[0]}{s.lastName[0]}</div>
                        <span className="font-medium text-gray-900 group-hover:text-primary-700">{s.firstName} {s.lastName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-gray-500">{s.studentId}</td>
                    <td className="px-4 py-2.5"><span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-red'}`}>{s.status}</span></td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => unenrollStudent(s._id)} className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Enroll modal */}
      {enrollOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fadeIn p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Enroll a Student</h3>
              <button onClick={() => setEnrollOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <label className="label">Select Student</label>
            <select className="input mb-4" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">— Choose a student —</option>
              {allStudents.filter(s => !enrolledIds.has(s._id)).map(s => (
                <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setEnrollOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={enrollStudent} disabled={!selectedStudent}>Enroll</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
