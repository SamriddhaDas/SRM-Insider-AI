import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../utils/api'
import { useAuth } from '../hooks/useAuth'

const DEPARTMENTS = ['CSE','IT','ECE','EEE','Mechanical','Civil','Biomedical','Biotechnology','Chemical','Aerospace']

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name:'', email:'', password:'', reg_number:'', department:'CSE', year:1 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const fn = mode === 'login' ? login : register
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form
      const res = await fn(payload)
      loginUser(res.token, res.user)
      navigate('/chat')
    } catch (err) {
      setError(err.error || 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex flex-1 bg-srm-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-20 -translate-x-20" />
        <div className="relative z-10 max-w-md text-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-srm-600 font-bold text-base">SRM</span>
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">SRM Insider AI</p>
              <p className="text-white/60 text-xs">Submission Query Assistant</p>
            </div>
          </div>

          <h1 className="font-display text-4xl font-bold leading-snug mb-4">
            Your AI guide for<br />SRM submissions
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-10">
            Get instant answers on formats, deadlines, plagiarism policies, portal steps, and resubmission rules — all in one place.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📄', label: 'Submission guidelines' },
              { icon: '⏰', label: 'Deadline tracking' },
              { icon: '🔍', label: 'Plagiarism help' },
              { icon: '✅', label: 'Status monitoring' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl px-4 py-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm text-white/85 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-srm-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs">SRM</span>
            </div>
            <span className="font-bold text-srm-600 text-lg">Insider AI</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-500 text-sm">
              {mode === 'login' ? 'Sign in to your SRM Insider account' : 'Join and start asking questions'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name</label>
                  <input className="input-field" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Arun Kumar" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Registration Number</label>
                  <input className="input-field" value={form.reg_number} onChange={e=>set('reg_number',e.target.value)} placeholder="e.g. RA2111003010001" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Department</label>
                    <select className="input-field" value={form.department} onChange={e=>set('department',e.target.value)}>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Year</label>
                    <select className="input-field" value={form.year} onChange={e=>set('year',+e.target.value)}>
                      {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email Address</label>
              <input className="input-field" type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@srmist.edu.in" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password</label>
              <input className="input-field" type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Please wait...</span>
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-srm-600 font-semibold hover:underline bg-transparent border-none cursor-pointer">
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>

          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-1">Demo</p>
            <p className="text-xs text-slate-400">Register with any email & password to get started instantly</p>
          </div>
        </div>
      </div>
    </div>
  )
}
