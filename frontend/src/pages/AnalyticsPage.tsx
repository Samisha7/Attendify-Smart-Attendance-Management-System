import { useEffect, useState } from 'react'
import { BarChart2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts'
import api from '../lib/api'

interface ClassOption { _id: string; name: string }
interface AttendanceTrend { date: string; present: number; absent: number; late: number; total: number }
interface GradeDist { A: number; B: number; C: number; D: number; F: number }
interface Performance { studentId: string; name: string; id: string; avgGrade: number; attendanceRate: number }

const GRADE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#f97316', '#ef4444']
const GRADE_LABELS = ['A (90+)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)']

export default function AnalyticsPage() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [trend, setTrend] = useState<AttendanceTrend[]>([])
  const [gradeDist, setGradeDist] = useState<GradeDist | null>(null)
  const [performance, setPerformance] = useState<Performance[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/classes').then(({ data }) => {
      setClasses(data)
      if (data.length > 0) setSelectedClass(data[0]._id)
    })
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    setLoading(true)
    Promise.all([
      api.get(`/analytics/attendance-trend/${selectedClass}`),
      api.get(`/analytics/grade-distribution/${selectedClass}`),
      api.get(`/analytics/performance/${selectedClass}`),
    ]).then(([tRes, gRes, pRes]) => {
      setTrend(tRes.data)
      setGradeDist(gRes.data)
      setPerformance(pRes.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [selectedClass])

  const pieData = gradeDist
    ? Object.entries(gradeDist).map(([grade, count], i) => ({ name: GRADE_LABELS[i], value: count, color: GRADE_COLORS[i] }))
    : []

  const radarData = performance.slice(0, 6).map(p => ({
    name: p.name.split(' ')[0],
    grade: Math.round(p.avgGrade),
    attendance: Math.round(p.attendanceRate),
  }))

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm">Visual insights into class performance</p>
        </div>
        <div>
          <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select class...</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedClass ? (
        <div className="card p-12 text-center text-gray-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>Select a class to view analytics</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Row 1: Attendance trend + Grade dist */}
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="card p-5 lg:col-span-3">
              <h2 className="font-semibold text-gray-900 mb-4">Attendance Trend (Last 30 Days)</h2>
              {trend.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trend} margin={{ left: -20, right: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="present" fill="#22c55e" stackId="a" name="Present" radius={[0,0,0,0]} />
                    <Bar dataKey="late" fill="#f59e0b" stackId="a" name="Late" />
                    <Bar dataKey="absent" fill="#ef4444" stackId="a" name="Absent" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-5 lg:col-span-2">
              <h2 className="font-semibold text-gray-900 mb-4">Grade Distribution</h2>
              {pieData.every(d => d.value === 0) ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No grades yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" outerRadius={70} dataKey="value" paddingAngle={2}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v, n) => [v, n]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Row 2: Scatter + Radar */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Grade vs Attendance</h2>
              <p className="text-xs text-gray-400 mb-4">Each dot represents a student</p>
              {performance.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" dataKey="attendanceRate" name="Attendance %" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Attendance %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                    <YAxis type="number" dataKey="avgGrade" name="Avg Grade %" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Grade %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <ZAxis range={[60, 60]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 12 }}
                      content={({ payload }) => payload?.[0] ? (
                        <div className="bg-white p-2 border border-gray-200 rounded shadow text-xs">
                          <p className="font-medium">{(payload[0].payload as Performance).name}</p>
                          <p>Grade: {(payload[0].payload as Performance).avgGrade.toFixed(1)}%</p>
                          <p>Attendance: {(payload[0].payload as Performance).attendanceRate.toFixed(1)}%</p>
                        </div>
                      ) : null} />
                    <Scatter data={performance} fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Student Radar (Top 6)</h2>
              {radarData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={75}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <Radar name="Grade" dataKey="grade" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                    <Radar name="Attendance" dataKey="attendance" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Performance table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Student Performance Summary</h2>
            </div>
            {performance.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No performance data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Student</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">ID</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Avg Grade</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Attendance</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {performance.sort((a, b) => b.avgGrade - a.avgGrade).map(p => {
                      const risk = p.avgGrade < 70 || p.attendanceRate < 75
                      return (
                        <tr key={p.studentId} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{p.name}</td>
                          <td className="px-4 py-2.5 text-gray-500">{p.id}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                                <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${Math.min(p.avgGrade, 100)}%` }} />
                              </div>
                              <span className="text-gray-700">{p.avgGrade.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                                <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${Math.min(p.attendanceRate, 100)}%` }} />
                              </div>
                              <span className="text-gray-700">{p.attendanceRate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            {risk
                              ? <span className="badge badge-red">At Risk</span>
                              : <span className="badge badge-green">On Track</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
