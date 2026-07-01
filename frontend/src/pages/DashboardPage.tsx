import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, CalendarCheck, TrendingUp, UserCheck, UserX, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface Overview {
  totalStudents: number
  totalClasses: number
  attendanceCount: number
  gradeCount: number
  presentToday: number
  absentToday: number
}

interface AttendanceTrend {
  date: string
  present: number
  absent: number
  late: number
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [trend, setTrend] = useState<AttendanceTrend[]>([])
  const [classes, setClasses] = useState<{ _id: string; name: string; subject: string; students: unknown[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [ovRes, clsRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/classes'),
        ])
        setOverview(ovRes.data)
        setClasses(clsRes.data)
        if (clsRes.data.length > 0) {
          const trendRes = await api.get(`/analytics/attendance-trend/${clsRes.data[0]._id}`)
          setTrend(trendRes.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pieData = overview
    ? [
        { name: 'Present', value: overview.presentToday, color: '#22c55e' },
        { name: 'Absent', value: overview.absentToday, color: '#ef4444' },
      ]
    : []

  const stats = overview
    ? [
        { label: 'Total Students', value: overview.totalStudents, icon: Users, color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700', link: '/students' },
        { label: 'Active Classes', value: overview.totalClasses, icon: BookOpen, color: 'bg-purple-500', light: 'bg-purple-50 text-purple-700', link: '/classes' },
        { label: 'Present Today', value: overview.presentToday, icon: UserCheck, color: 'bg-green-500', light: 'bg-green-50 text-green-700', link: '/attendance' },
        { label: 'Absent Today', value: overview.absentToday, icon: UserX, color: 'bg-red-500', light: 'bg-red-50 text-red-700', link: '/attendance' },
      ]
    : []

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-0.5">Here's what's happening in your classroom today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link to={stat.link} key={stat.label} className="card p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.light} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              View details <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attendance trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Attendance Trend (Last 30 Days)</h2>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} fill="url(#presentGrad)" name="Present" />
                <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fill="url(#absentGrad)" name="Absent" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No attendance data yet</div>
          )}
        </div>

        {/* Today's attendance pie */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Today's Attendance</h2>
          {pieData[0]?.value > 0 || pieData[1]?.value > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No records today</div>
          )}
        </div>
      </div>

      {/* Classes */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Your Classes</h2>
          <Link to="/classes" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {classes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No classes yet. <Link to="/classes" className="text-primary-600 hover:underline">Create one</Link></p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.slice(0, 6).map(cls => (
              <Link key={cls._id} to={`/classes/${cls._id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                  {cls.subject.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{cls.name}</p>
                  <p className="text-xs text-gray-500">{Array.isArray(cls.students) ? cls.students.length : 0} students</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
