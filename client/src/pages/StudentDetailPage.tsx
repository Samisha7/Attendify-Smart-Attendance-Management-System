import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, User, BookOpen, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../lib/api'
import { format } from 'date-fns'

interface Student {
  _id: string; firstName: string; lastName: string; email: string; studentId: string
  gender: string; status: string; phone?: string; parentName?: string; parentPhone?: string
  parentEmail?: string; notes?: string; enrollmentDate: string
  classes: { _id: string; name: string; subject: string; grade: string }[]
}

interface Grade {
  _id: string; assessmentName: string; assessmentType: string
  score: number; maxScore: number; date: string; class: { name: string }
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [student, setStudent] = useState<Student | null>(null)
  const [grades, setGrades] = useState<Grade[]>([])
  const [attendance, setAttendance] = useState<{ status: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [sRes, gRes, aRes] = await Promise.all([
          api.get(`/students/${id}`),
          api.get(`/grades?studentId=${id}`),
          api.get(`/attendance/student/${id}`),
        ])
        setStudent(sRes.data)
        setGrades(gRes.data)
        // summarize attendance
        const counts: Record<string, number> = { present: 0, absent: 0, late: 0, excused: 0 }
        for (const session of aRes.data) {
          for (const r of session.records) {
            if (r.student._id === id || r.student === id) counts[r.status] = (counts[r.status] || 0) + 1
          }
        }
        setAttendance(Object.entries(counts).map(([status, count]) => ({ status, count })))
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!student) return <div className="text-center py-20 text-gray-400">Student not found</div>

  const avgGrade = grades.length ? grades.reduce((acc, g) => acc + (g.score / g.maxScore) * 100, 0) / grades.length : null

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Link to="/students" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
          <p className="text-gray-500 text-sm">{student.studentId}</p>
        </div>
        <span className={`ml-auto badge ${student.status === 'active' ? 'badge-green' : 'badge-red'}`}>{student.status}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Info card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
              <p className="text-sm text-gray-500 capitalize">{student.gender}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" />{student.email}</div>
            {student.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{student.phone}</div>}
            <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-400" />Enrolled {format(new Date(student.enrollmentDate), 'MMM d, yyyy')}</div>
          </div>
          {(student.parentName || student.parentEmail) && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Parent / Guardian</p>
              <div className="space-y-1 text-sm">
                {student.parentName && <div className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4 text-gray-400" />{student.parentName}</div>}
                {student.parentEmail && <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" />{student.parentEmail}</div>}
                {student.parentPhone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{student.parentPhone}</div>}
              </div>
            </div>
          )}
          {student.notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-600">{student.notes}</p>
            </div>
          )}
        </div>

        {/* Stats + grades */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">{avgGrade !== null ? avgGrade.toFixed(1) + '%' : '—'}</p>
              <p className="text-xs text-gray-500 mt-0.5">Avg Grade</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{attendance.find(a => a.status === 'present')?.count || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Days Present</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{attendance.find(a => a.status === 'absent')?.count || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">Days Absent</p>
            </div>
          </div>

          {/* Attendance chart */}
          {attendance.some(a => a.count > 0) && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Attendance Breakdown</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={attendance} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Grades table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Grades</h3>
              <BookOpen className="w-4 h-4 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 font-medium text-gray-600">Assessment</th>
                  <th className="px-4 py-2.5 font-medium text-gray-600">Type</th>
                  <th className="px-4 py-2.5 font-medium text-gray-600">Score</th>
                  <th className="px-4 py-2.5 font-medium text-gray-600">Grade</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {grades.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-6 text-gray-400">No grades recorded</td></tr>
                  ) : grades.slice(0, 8).map(g => {
                    const pct = (g.score / g.maxScore) * 100
                    return (
                      <tr key={g._id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{g.assessmentName}</td>
                        <td className="px-4 py-2.5"><span className="badge badge-blue capitalize">{g.assessmentType}</span></td>
                        <td className="px-4 py-2.5 text-gray-600">{g.score}/{g.maxScore}</td>
                        <td className="px-4 py-2.5">
                          <span className={`badge ${pct >= 90 ? 'badge-green' : pct >= 70 ? 'badge-blue' : pct >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                            {pct.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
