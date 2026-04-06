import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, createConversation } from '../utils/api'
import { useAuth } from '../hooks/useAuth'

const QUICK_ACTIONS = [
  { icon: '📄', title: 'Submission Help', desc: 'Step-by-step guide', query: 'How do I submit my project on SRM Insider portal?' },
  { icon: '⏰', title: 'Deadlines', desc: 'Check submission timelines', query: 'What are the current submission deadlines?' },
  { icon: '🔍', title: 'Plagiarism Check', desc: 'Similarity limits explained', query: 'What is the plagiarism threshold for SRM submissions?' },
  { icon: '✅', title: 'Track Status', desc: 'Monitor submission progress', query: 'How do I check my submission status?' },
  { icon: '📝', title: 'Format Guide', desc: 'Document formatting rules', query: 'What are the document formatting guidelines for SRM projects?' },
  { icon: '🔧', title: 'Fix Errors', desc: 'Solve upload issues', query: 'I am getting a file too large error when uploading. How do I fix it?' },
]

const SUBMISSION_TYPES = [
  { name: 'Final Year Project', tag: 'FYP', color: 'bg-srm-50 text-srm-700 border-srm-100' },
  { name: 'Mini Project', tag: 'MP', color: 'bg-green-50 text-green-700 border-green-100' },
  { name: 'Internship Report', tag: 'INT', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { name: 'Seminar Report', tag: 'SEM', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { name: 'Research Paper', tag: 'RP', color: 'bg-red-50 text-red-700 border-red-100' },
  { name: 'Lab Record', tag: 'LAB', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ conversations: 0, messages_sent: 0, faqs_available: 8 })

  useEffect(() => { getStats().then(setStats).catch(() => {}) }, [])

  const handleQuickAction = async (query) => {
    const conv = await createConversation(query.slice(0, 50))
    navigate(`/chat/${conv._id}`)
    setTimeout(() => window.__triggerQuery?.(query), 200)
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 scrollbar-thin">
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">

        {/* Hero Banner */}
        <div className="bg-srm-600 rounded-2xl p-7 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 right-20 w-32 h-32 bg-white/5 rounded-full translate-y-12" />
          <div className="relative">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Welcome back</p>
            <h1 className="font-display text-3xl font-bold mb-1">{user?.name} 👋</h1>
            <p className="text-white/60 text-sm mb-5">{user?.department} · Year {user?.year} · {user?.reg_number || 'SRM Student'}</p>
            <button onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all cursor-pointer">
              <PlusIcon /> New conversation
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Conversations', value: stats.conversations, icon: '💬', bg: 'bg-srm-50', text: 'text-srm-600' },
            { label: 'Questions Asked', value: stats.messages_sent, icon: '❓', bg: 'bg-green-50', text: 'text-green-600' },
            { label: 'FAQs Available', value: stats.faqs_available, icon: '📚', bg: 'bg-purple-50', text: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
                <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center text-lg`}>{s.icon}</div>
              </div>
              <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3">Quick actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map(a => (
              <button key={a.title} onClick={() => handleQuickAction(a.query)}
                className="card text-left p-5 hover:border-srm-200 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group font-sans">
                <span className="text-2xl mb-3 block">{a.icon}</span>
                <p className="font-semibold text-sm text-slate-800 mb-1 group-hover:text-srm-600 transition-colors">{a.title}</p>
                <p className="text-xs text-slate-400">{a.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submission Types */}
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3">Submission types</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {SUBMISSION_TYPES.map(c => (
              <button key={c.name} onClick={() => navigate('/faqs')}
                className="card text-left px-4 py-3 hover:shadow-md transition-all cursor-pointer flex items-center gap-3 font-sans group">
                <span className={`badge ${c.color} border text-xs font-bold flex-shrink-0`}>{c.tag}</span>
                <span className="text-sm text-slate-700 font-medium group-hover:text-srm-600 transition-colors truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
