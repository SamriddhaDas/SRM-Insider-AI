import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFaqs, getFaqCategories, createConversation } from '../utils/api'

const CAT_STYLES = {
  Registration: 'bg-srm-50 text-srm-700 border-srm-200',
  Submission:   'bg-green-50 text-green-700 border-green-200',
  Deadlines:    'bg-amber-50 text-amber-700 border-amber-200',
  Plagiarism:   'bg-red-50 text-red-700 border-red-200',
  Status:       'bg-purple-50 text-purple-700 border-purple-200',
  Resubmission: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Format:       'bg-pink-50 text-pink-700 border-pink-200',
  Technical:    'bg-slate-100 text-slate-600 border-slate-200',
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getFaqs(), getFaqCategories()]).then(([f, c]) => {
      setFaqs(f); setCategories(['All', ...c]); setLoading(false)
    })
  }, [])

  const filtered = faqs.filter(f => {
    const matchCat = activeCategory === 'All' || f.category === activeCategory
    const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleAskMore = async (question) => {
    const conv = await createConversation(question.slice(0, 50))
    navigate(`/chat/${conv._id}`)
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 scrollbar-thin">
      <div className="max-w-3xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-slate-800 mb-1">FAQ Library</h1>
          <p className="text-slate-500 text-sm">Browse frequently asked questions about SRM Insider submissions</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="input-field pl-11"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                activeCategory === cat
                  ? 'bg-srm-600 text-white border-srm-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <span className="w-5 h-5 border-2 border-slate-200 border-t-srm-400 rounded-full animate-spin-slow" />
            Loading FAQs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-2">No FAQs found.</p>
            <button onClick={() => { setSearch(''); setActiveCategory('All') }}
              className="text-srm-600 text-sm font-medium hover:underline cursor-pointer bg-transparent border-none">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(faq => (
              <div key={faq._id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  expanded === faq._id
                    ? 'border-srm-200 shadow-md'
                    : 'border-slate-100 hover:border-slate-200 shadow-sm'
                }`}>
                <button
                  onClick={() => setExpanded(expanded === faq._id ? null : faq._id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer bg-transparent font-sans">
                  <span className={`badge border flex-shrink-0 ${CAT_STYLES[faq.category] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {faq.category}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-700 leading-snug">{faq.question}</span>
                  <ChevronIcon open={expanded === faq._id} />
                </button>

                {expanded === faq._id && (
                  <div className="px-5 pb-5 border-t border-slate-50 pt-4 animate-fade-in">
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{faq.answer}</p>
                    <button onClick={() => handleAskMore(faq.question)}
                      className="inline-flex items-center gap-2 text-xs font-medium text-srm-600 bg-srm-50 hover:bg-srm-100 border border-srm-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer font-sans">
                      <ChatIcon />
                      Ask AI for more details
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const SearchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const ChevronIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const ChatIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
