import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMessages, createConversation, streamChat } from '../utils/api'
import Message from '../components/Message'
import { useAuth } from '../hooks/useAuth'

const SUGGESTIONS = [
  'How do I submit my final year project?',
  'What is the plagiarism limit for submissions?',
  'What file format is accepted for uploads?',
  'How do I check my submission status?',
  'What happens if I miss the deadline?',
  'Can I resubmit after a revision request?',
  'Documents needed for internship submission?',
  'How to fix the file too large error?',
]

export default function ChatPage() {
  const { convId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingMsgId, setStreamingMsgId] = useState(null)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!convId) { setMessages([]); return }
    getMessages(convId).then(setMessages).catch(() => setMessages([]))
  }, [convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || streaming) return
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }

    let activeConvId = convId
    if (!activeConvId) {
      const conv = await createConversation(msg.slice(0, 50))
      activeConvId = conv._id
      navigate(`/chat/${activeConvId}`, { replace: true })
      setTimeout(() => window.__refreshSidebar?.(), 300)
    }

    const userMsg = { _id: 'tmp_' + Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }
    const botMsg = { _id: 'streaming', role: 'assistant', content: '', created_at: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg, botMsg])
    setStreaming(true)
    setStreamingMsgId('streaming')

    streamChat(activeConvId, msg,
      (delta) => setMessages(prev => prev.map(m => m._id === 'streaming' ? { ...m, content: m.content + delta } : m)),
      (finalId) => {
        setStreaming(false); setStreamingMsgId(null)
        if (finalId) setMessages(prev => prev.map(m => m._id === 'streaming' ? { ...m, _id: finalId } : m))
        setTimeout(() => window.__refreshSidebar?.(), 300)
      },
      (err) => {
        console.error(err); setStreaming(false); setStreamingMsgId(null)
        setMessages(prev => [...prev.filter(m => m._id !== 'streaming'), {
          _id: 'err_' + Date.now(), role: 'assistant',
          content: 'Something went wrong. Please try again.',
          created_at: new Date().toISOString()
        }])
      }
    )
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-srm-600 rounded-xl flex items-center justify-center shadow-sm">
          <ChatBubbleIcon />
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">SRM Insider AI</p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            Ready to help with your submission queries
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 scrollbar-thin">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 bg-srm-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
              <SparkleIcon />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-800 mb-2">
              Hello, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-8">
              Ask me anything about SRM Insider — submissions, deadlines, plagiarism checks, formats, and more.
            </p>
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-xs bg-white border border-slate-200 hover:border-srm-400 hover:bg-srm-50 hover:text-srm-700 text-slate-600 rounded-xl px-4 py-3 transition-all leading-relaxed cursor-pointer font-sans">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <Message key={msg._id || i} msg={msg} isStreaming={msg._id === streamingMsgId} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-100 px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={streaming}
            placeholder="Ask about submissions, deadlines, formats, plagiarism..."
            rows={1}
            className="flex-1 resize-none input-field min-h-[46px] max-h-[140px] py-3 rounded-2xl disabled:bg-slate-50 disabled:text-slate-400 scrollbar-thin"
          />
          <button onClick={() => send()} disabled={streaming || !input.trim()}
            className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
              streaming || !input.trim()
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-srm-600 text-white hover:bg-srm-700 shadow-md hover:shadow-lg cursor-pointer'
            }`}>
            {streaming
              ? <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-400 rounded-full animate-spin-slow" />
              : <SendIcon />
            }
          </button>
        </div>
        <p className="text-center text-xs text-slate-300 mt-2 max-w-3xl mx-auto">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

const ChatBubbleIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const SparkleIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
const SendIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
