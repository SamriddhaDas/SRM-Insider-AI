import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getConversations, createConversation, deleteConversation } from '../utils/api'
import { useAuth } from '../hooks/useAuth'

export default function Sidebar() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { convId } = useParams()

  const load = async () => {
    try { setConversations(await getConversations()) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { window.__refreshSidebar = load; return () => delete window.__refreshSidebar }, [])

  const handleNew = async () => {
    const conv = await createConversation('New Conversation')
    await load()
    navigate(`/chat/${conv._id}`)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await deleteConversation(id)
    await load()
    if (convId === id) navigate('/chat')
  }

  const grouped = groupByDate(conversations)

  const navItems = [
    { label: 'Dashboard', path: '/chat', icon: <HomeIcon /> },
    { label: 'FAQ Library', path: '/faqs', icon: <BookIcon /> },
  ]

  return (
    <div className="w-64 min-w-64 bg-srm-900 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow">
            <span className="text-srm-600 font-bold text-xs">SRM</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">SRM Insider AI</p>
            <p className="text-white/40 text-xs">Submission Assistant</p>
          </div>
        </div>
        <button onClick={handleNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-medium rounded-xl transition-all">
          <PlusIcon />
          New conversation
        </button>
      </div>

      {/* Nav */}
      <div className="px-3 pt-3 pb-1 space-y-0.5">
        {navItems.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            className={`sidebar-item w-full ${location.pathname === item.path ? 'active' : ''}`}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {loading ? (
          <p className="text-white/30 text-xs px-2 py-3">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="text-white/30 text-xs text-center py-8 leading-relaxed">No conversations yet.<br />Start one above!</p>
        ) : (
          Object.entries(grouped).map(([label, items]) => (
            <div key={label} className="mb-2">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-2 py-2">{label}</p>
              {items.map(conv => (
                <div key={conv._id}
                  onClick={() => navigate(`/chat/${conv._id}`)}
                  className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all mb-0.5 ${convId === conv._id ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white/80 hover:bg-white/8'}`}>
                  <ChatIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                  <span className="flex-1 truncate text-xs">{conv.title || 'New Conversation'}</span>
                  <button onClick={e => handleDelete(e, conv._id)}
                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/80 text-base leading-none bg-transparent border-none cursor-pointer transition-opacity px-1">
                    ×
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* User Footer */}
      <div className="px-3 py-3 border-t border-white/10 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{user?.name}</p>
          <p className="text-white/40 text-xs truncate">{user?.department} · Y{user?.year}</p>
        </div>
        <button onClick={logoutUser} title="Logout"
          className="text-white/30 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1">
          <LogoutIcon />
        </button>
      </div>
    </div>
  )
}

function groupByDate(convs) {
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now - 86400000).toDateString()
  const groups = {}
  for (const c of convs) {
    const d = new Date(c.updated_at).toDateString()
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : 'Older'
    if (!groups[label]) groups[label] = []
    groups[label].push(c)
  }
  return groups
}

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const HomeIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const BookIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
const ChatIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const LogoutIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
