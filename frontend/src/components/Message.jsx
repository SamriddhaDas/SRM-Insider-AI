import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { sendFeedback } from '../utils/api'

export default function Message({ msg, isStreaming }) {
  const isBot = msg.role === 'assistant'
  const [feedback, setFeedback] = useState(null)

  const handleFeedback = async (rating) => {
    setFeedback(rating)
    try { await sendFeedback({ message_id: msg._id, rating }) } catch {}
  }

  return (
    <div className={`flex gap-3 py-4 animate-fade-in ${isBot ? 'flex-row' : 'flex-row-reverse'} items-start`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${isBot ? 'bg-srm-600 text-white' : 'bg-accent-400 text-white'}`}>
        {isBot ? 'AI' : 'U'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] min-w-[60px]`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isBot
            ? 'bg-white border border-slate-100 shadow-sm rounded-tl-sm text-slate-800'
            : 'bg-srm-600 text-white rounded-tr-sm'
        }`}>
          {isBot ? (
            <div className="prose-message">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-srm-400 rounded-sm ml-0.5 animate-pulse-dot" />
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>

        {/* Feedback & Timestamp row */}
        <div className={`flex items-center gap-3 mt-1.5 px-1 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          {isBot && !isStreaming && msg._id && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleFeedback(1)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  feedback === 1
                    ? 'bg-green-50 border-green-200 text-green-600'
                    : 'bg-transparent border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500'
                }`}>
                <ThumbUpIcon filled={feedback === 1} /> Helpful
              </button>
              <button onClick={() => handleFeedback(-1)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  feedback === -1
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'bg-transparent border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500'
                }`}>
                <ThumbDownIcon filled={feedback === -1} /> Not helpful
              </button>
            </div>
          )}
          <span className="text-xs text-slate-300">{formatTime(msg.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const ThumbUpIcon = ({ filled }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
  </svg>
)

const ThumbDownIcon = ({ filled }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
  </svg>
)
