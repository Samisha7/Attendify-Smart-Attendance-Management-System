import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, GraduationCap, Pencil, Trash2, X } from 'lucide-react'
import { format } from 'date-fns'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface Grade {
  _id: string; assessmentName: string; assessmentType: string; score: number; maxScore: number
  weight: number; date: string; feedback?: string
  student: { _id: string; firstName: string; lastName: string; studentId: string }
  class: { _id: string; name: string; subject: string }
}
interface ClassOption { _id: string; name: string; subject: string; students: { _id: string; firstName: string; lastName: string; studentId: string }[] }

const types = ['quiz', 'assignment', 'midterm', 'final', 'project', 'participation']

export default function GradesPage() {
  const [searchParams] = useSearchParams()
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState(searchParams.get('classId') || '')
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Grade | null>(null)
  const [form, setForm] = useState({ studentId: '', assessmentName: '', assessmentType: 'quiz', score: '', maxScore: '100', weight: '10', date: format(new Date(), 'yyyy-MM-dd'), feedback: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/classes').then(({ data }) => {
      setClasses(data)
      if (!selectedClass && data.length > 0) setSelectedClass(data[0]._id)
    })
  }, [selectedClass])

  const fetchGrades = useCallback(async () => {
    if (!selectedClass) return
    setLoading(true)
    try {
      const { data } = await api.get(`/grades?classId=${selectedClass}`)
      setGrades(data)
    } catch { toast.error('Failed to load grades') }
    finally { setLoading(false) }
  }, [selectedClass])

  useEffect(() => { fetchGrades() }, [fetchGrades])

  function openAdd() {
    setEditing(null)
    setForm({ studentId: '', assessmentName: '', assessmentType: 'quiz', score: '', maxScore: '100', weight: '10', date: format(new Date(), 'yyyy-MM-dd'), feedback: '' })
    setModalOpen(true)
  }

  function openEdit(g: Grade) {
    setEditing(g)
    setForm({ studentId: g.student._id, assessmentName: g.assessmentName, assessmentType: g.assessmentType, score: String(g.score), maxScore: String(g.maxScore), weight: String(g.weight), date: format(new Date(g.date), 'yyyy-MM-dd'), feedback: g.feedback || '' })
    setModalOpen(true)
  }

  async function saveGrade(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { student: form.studentId, class: selectedClass, assessmentName: form.assessmentName, assessmentType: form.assessmentType, score: Number(form.score), maxScore: Number(form.maxScore), weight: Number(form.weight), date: form.date, feedback: form.feedback }
      if (editing) {
        await api.patch(`/grades/${editing._id}`, payload)
        toast.success('Grade updated')
      } else {
        await api.post('/grades', payload)
        toast.success('Grade added')
      }
      setModalOpen(false)
      fetchGrades()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  async function deleteGrade(id: string) {
    if (!confirm('Delete this grade?')) return
    try {
      await api.delete(`/grades/${id}`)
      toast.success('Grade deleted')
      fetchGrades()
    } catch { toast.error('Failed to delete') }
  }

  const currentClass = classes.find(c => c._id === selectedClass)

  function gradeColor(pct: number) {
    if (pct >= 90) return 'badge-green'
    if (pct >= 80) return 'badge-blue'
    if (pct >= 70) return 'badge-yellow'
    return 'badge-red'
  }

  // Group grades by assessment
  const byAssessment: Record<string, Grade[]> = {}
  for (const g of grades) {
    const key = g.assessmentName
    if (!byAssessment[key]) byAssessment[key] = []
    byAssessment[key].push(g)
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
          <p className="text-gray-500 text-sm">Manage assessments and scores</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Grade</button>
      </div>

      {/* Class selector */}
      <div className="card p-4 flex gap-4 items-end">
        <div className="flex-1 max-w-xs">
          <label className="label">Class</label>
          <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select class...</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Grades table */}
      {!selectedClass ? (
        <div className="card p-12 text-center text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>Select a class to view grades</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : grades.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>No grades recorded for this class</p>
          <button className="btn-primary mt-4" onClick={openAdd}>Add First Grade</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Assessment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Grade</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                <th className="w-16 px-4 py-3" />
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {grades.map(g => {
                  const pct = (g.score / g.maxScore) * 100
                  return (
                    <tr key={g._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{g.student.firstName} {g.student.lastName}</td>
                      <td className="px-4 py-2.5 text-gray-700">{g.assessmentName}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell"><span className="badge badge-gray capitalize">{g.assessmentType}</span></td>
                      <td className="px-4 py-2.5 text-gray-600">{g.score}/{g.maxScore}</td>
                      <td className="px-4 py-2.5"><span className={`badge ${gradeColor(pct)}`}>{pct.toFixed(0)}%</span></td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-gray-500">{format(new Date(g.date), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(g)} className="text-gray-400 hover:text-primary-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteGrade(g._id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Grade' : 'Add Grade'}</h2>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={saveGrade} className="p-6 space-y-4">
              <div>
                <label className="label">Student *</label>
                <select className="input" required value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
                  <option value="">Select student...</option>
                  {currentClass?.students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><label className="label">Assessment Name *</label><input className="input" required placeholder="Quiz 1" value={form.assessmentName} onChange={e => setForm(f => ({ ...f, assessmentName: e.target.value }))} /></div>
                <div><label className="label">Type *</label>
                  <select className="input" required value={form.assessmentType} onChange={e => setForm(f => ({ ...f, assessmentType: e.target.value }))}>
                    {types.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><label className="label">Score *</label><input type="number" className="input" required min="0" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} /></div>
                <div><label className="label">Max Score *</label><input type="number" className="input" required min="1" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))} /></div>
                <div><label className="label">Weight (%)</label><input type="number" className="input" min="0" max="100" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} /></div>
              </div>
              <div><label className="label">Feedback</label><textarea className="input" rows={2} value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} /></div>
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Grade'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
