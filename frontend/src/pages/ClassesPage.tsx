import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Users, Clock, Pencil, Trash2 } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import ClassModal from '../components/ClassModal'

interface Class {
  _id: string; name: string; subject: string; grade: string
  schedule: string; room: string; academicYear: string
  students: { _id: string; firstName: string; lastName: string }[]
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Class | null>(null)

  const fetchClasses = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/classes')
      setClasses(data)
    } catch { toast.error('Failed to load classes') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  async function deleteClass(id: string) {
    if (!confirm('Delete this class?')) return
    try {
      await api.delete(`/classes/${id}`)
      toast.success('Class deleted')
      fetchClasses()
    } catch { toast.error('Failed to delete') }
  }

  const subjectColors: Record<string, string> = {
    mathematics: 'bg-blue-100 text-blue-700',
    science: 'bg-green-100 text-green-700',
    english: 'bg-purple-100 text-purple-700',
    history: 'bg-yellow-100 text-yellow-700',
    art: 'bg-pink-100 text-pink-700',
    'physical education': 'bg-orange-100 text-orange-700',
  }

  function getSubjectColor(subject: string) {
    return subjectColors[subject.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{classes.length} classes</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> New Class
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No classes yet</p>
          <p className="text-sm mt-1">Create your first class to get started</p>
          <button className="btn-primary mt-4" onClick={() => { setEditing(null); setModalOpen(true) }}>Create Class</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls._id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <span className={`badge ${getSubjectColor(cls.subject)} capitalize`}>{cls.subject}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(cls); setModalOpen(true) }} className="text-gray-400 hover:text-primary-600 p-1">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteClass(cls._id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <Link to={`/classes/${cls._id}`}>
                <h3 className="font-semibold text-gray-900 hover:text-primary-700 transition-colors mb-1">{cls.name}</h3>
              </Link>
              <p className="text-sm text-gray-500 mb-3">Grade {cls.grade} · {cls.academicYear}</p>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />{cls.students?.length || 0} students enrolled</div>
                {cls.schedule && <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{cls.schedule}</div>}
                {cls.room && <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-gray-400" />{cls.room}</div>}
              </div>
              <Link to={`/classes/${cls._id}`} className="mt-4 w-full btn-secondary text-xs py-1.5 justify-center">View Class →</Link>
            </div>
          ))}
        </div>
      )}

      <ClassModal open={modalOpen} cls={editing} onClose={() => setModalOpen(false)} onSaved={fetchClasses} />
    </div>
  )
}
