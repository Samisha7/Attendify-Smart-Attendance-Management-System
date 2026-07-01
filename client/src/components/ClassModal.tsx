import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  cls: { _id: string; name: string; subject: string; grade: string; schedule: string; room: string; academicYear: string } | null
  onClose: () => void
  onSaved: () => void
}

const empty = { name: '', subject: '', grade: '', schedule: '', room: '', academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` }

export default function ClassModal({ open, cls, onClose, onSaved }: Props) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (cls) setForm({ ...empty, ...cls })
    else setForm(empty)
  }, [cls, open])

  if (!open) return null

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (cls) {
        await api.patch(`/classes/${cls._id}`, form)
        toast.success('Class updated')
      } else {
        await api.post('/classes', form)
        toast.success('Class created')
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{cls ? 'Edit Class' : 'New Class'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="label">Class Name *</label><input className="input" required placeholder="Mathematics 10A" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label className="label">Subject *</label><input className="input" required placeholder="Mathematics" value={form.subject} onChange={e => set('subject', e.target.value)} /></div>
            <div><label className="label">Grade Level *</label><input className="input" required placeholder="10" value={form.grade} onChange={e => set('grade', e.target.value)} /></div>
            <div><label className="label">Schedule</label><input className="input" placeholder="Mon/Wed/Fri 9:00 AM" value={form.schedule} onChange={e => set('schedule', e.target.value)} /></div>
            <div><label className="label">Room</label><input className="input" placeholder="Room 204" value={form.room} onChange={e => set('room', e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label">Academic Year</label><input className="input" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Class'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
