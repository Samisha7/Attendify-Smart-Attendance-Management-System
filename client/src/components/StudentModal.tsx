import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  student: { _id: string; firstName: string; lastName: string; email: string; studentId: string; gender: string; status: string; phone?: string; parentName?: string; parentPhone?: string; parentEmail?: string; notes?: string } | null
  onClose: () => void
  onSaved: () => void
}

const empty = { firstName: '', lastName: '', email: '', studentId: '', gender: 'male', status: 'active', phone: '', parentName: '', parentPhone: '', parentEmail: '', notes: '' }

export default function StudentModal({ open, student, onClose, onSaved }: Props) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (student) setForm({ ...empty, ...student })
    else setForm(empty)
  }, [student, open])

  if (!open) return null

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (student) {
        await api.patch(`/students/${student._id}`, form)
        toast.success('Student updated')
      } else {
        await api.post('/students', form)
        toast.success('Student created')
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{student ? 'Edit Student' : 'Add New Student'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">First Name *</label><input className="input" required value={form.firstName} onChange={e => set('firstName', e.target.value)} /></div>
            <div><label className="label">Last Name *</label><input className="input" required value={form.lastName} onChange={e => set('lastName', e.target.value)} /></div>
            <div><label className="label">Email *</label><input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="label">Student ID *</label><input className="input" required value={form.studentId} onChange={e => set('studentId', e.target.value)} /></div>
            <div><label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">Parent Name</label><input className="input" value={form.parentName} onChange={e => set('parentName', e.target.value)} /></div>
            <div><label className="label">Parent Phone</label><input className="input" value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} /></div>
            <div><label className="label">Parent Email</label><input className="input" type="email" value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} /></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Student'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
