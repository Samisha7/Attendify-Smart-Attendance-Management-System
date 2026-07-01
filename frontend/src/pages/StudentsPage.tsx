import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2, User } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import StudentModal from '../components/StudentModal'

interface Student {
  _id: string
  firstName: string
  lastName: string
  email: string
  studentId: string
  gender: string
  status: string
  enrollmentDate: string
  classes: { _id: string; name: string; subject: string }[]
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const limit = 12

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const { data } = await api.get(`/students?${params}`)
      setStudents(data.students)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  async function deleteStudent(id: string) {
    if (!confirm('Delete this student?')) return
    try {
      await api.delete(`/students/${id}`)
      toast.success('Student deleted')
      fetchStudents()
    } catch {
      toast.error('Failed to delete student')
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total students</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name, email, ID..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select className="input pl-9 pr-8 appearance-none cursor-pointer" value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="transferred">Transferred</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Classes</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-200 rounded-full" /><div className="h-4 bg-gray-200 rounded w-32" /></div></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No students found</p>
                  </td>
                </tr>
              ) : students.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/students/${s._id}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{s.studentId}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">{s.classes?.length || 0} class{s.classes?.length !== 1 ? 'es' : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'inactive' ? 'badge-red' : 'badge-yellow'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 relative">
                    <button className="text-gray-400 hover:text-gray-700" onClick={() => setMenuOpen(menuOpen === s._id ? null : s._id)}>
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === s._id && (
                      <div className="absolute right-6 top-2 bg-white shadow-lg rounded-lg border border-gray-100 py-1 z-10 w-36">
                        <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => { setEditing(s); setModalOpen(true); setMenuOpen(null) }}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          onClick={() => { deleteStudent(s._id); setMenuOpen(null) }}>
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button className="btn-secondary px-3 py-1.5 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn-secondary px-3 py-1.5 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      <StudentModal open={modalOpen} student={editing} onClose={() => setModalOpen(false)} onSaved={fetchStudents} />
    </div>
  )
}
