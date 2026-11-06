import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Sparkles, PlusCircle, X, SlidersHorizontal, Layers, ShieldCheck, Clock, BookOpen, ArrowRight } from 'lucide-react'
import itemsApi from '../api/items.api.js'
import ItemCard from '../components/common/ItemCard.jsx'
import CategoryPills from '../components/common/CategoryPills.jsx'
import { ItemGridSkeleton } from '../components/common/LoadingSkeleton.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import EvaluationGuideModal from '../components/common/EvaluationGuideModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'

export function ExplorePage() {
  const { isAuthenticated } = useAuth()
  const { socket, on } = useSocket()
  const [guideModalOpen, setGuideModalOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [category, setCategory] = useState('')
  const [locality, setLocality] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0, totalPages: 1 })

  const loadItems = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await itemsApi.list({
        search: activeSearch || undefined,
        category: category || undefined,
        locality: locality || undefined,
        page: pagination.page,
        limit: pagination.limit
      })
      if (res?.data) {
        setItems(res.data)
        if (res.pagination) {
          setPagination(res.pagination)
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load catalog items.')
    } finally {
      setLoading(false)
    }
  }, [activeSearch, category, locality, pagination.page, pagination.limit])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // Real-time item availability updates (e.g. borrowed / returned)
  useEffect(() => {
    if (!socket) return

    const handleAvailability = ({ itemId, status }) => {
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status } : item))
      )
    }

    const cleanup = on('item:availability-updated', handleAvailability)
    return () => {
      if (cleanup) cleanup()
    }
  }, [socket, on])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setActiveSearch(searchTerm.trim())
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setActiveSearch('')
    setCategory('')
    setLocality('')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-emerald-900 text-white p-6 sm:p-12 shadow-md">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700/60 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Community Resource Sharing</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Borrow More. <br />
            <span className="text-emerald-300">Own Less.</span>
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-lg">
            Why buy high-end power tools, camping gear, projectors, or party games you only use once a year? Borrow them from trusted neighbors nearby.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to={isAuthenticated ? '/items/new' : '/login'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-bold text-sm hover:bg-emerald-50 transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-emerald-800" />
              <span>List an Item to Lend</span>
            </Link>
            <button
              type="button"
              onClick={() => setGuideModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-white font-bold text-sm border border-emerald-700/80 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>How BorrowBox Works / Guide</span>
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-emerald-800/40 blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-1/2 -translate-y-1/2 text-8xl opacity-15 hidden lg:block select-none pointer-events-none">
          📦
        </div>
      </section>

      {/* How BorrowBox Works 3-Step Overview */}
      <section className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-7 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-stone-100 gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
              <span>How BorrowBox Works</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                Simple 3-Step Sharing
              </span>
            </h2>
            <p className="text-xs text-stone-500">
              Community lending designed for trust, zero waste, and smart neighborly sharing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGuideModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer self-start sm:self-auto"
          >
            <span>View Evaluator Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-stone-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
              <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-xs">1</span>
              <span>Browse Catalog & Search</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Find drills, lawn mowers, tents, pressure washers, and projectors listed by neighbors in your area.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-stone-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
              <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-xs">2</span>
              <span>Reserve Dates</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Pick your borrowing dates. Automatic overlap prevention prevents double-booking in PostgreSQL transactions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-stone-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
              <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-xs">3</span>
              <span>Live Handover & Return</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Owners get instant real-time Socket.IO notifications to approve requests, activate loans, and log returns.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filters Section */}
      <section className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search drills, tents, pressure washers, ladders, projectors..."
              className="w-full pl-11 pr-24 py-3.5 sm:py-4 rounded-2xl bg-white border border-stone-200/90 text-sm sm:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800/40 focus:border-emerald-800 shadow-xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setActiveSearch('')
                }}
                className="absolute right-20 text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 sm:py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {/* Category Horizontal Filter Pills */}
        <div className="pt-2">
          <CategoryPills
            selectedCategory={category}
            onSelectCategory={(selected) => {
              setCategory(selected)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
          />
        </div>

        {/* Active Filters Bar */}
        {(activeSearch || category || locality) && (
          <div className="flex items-center flex-wrap gap-2 text-xs pt-1 text-stone-600">
            <span className="font-semibold flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Active Filters:
            </span>
            {activeSearch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-200/80 text-stone-800 font-medium">
                Keyword: "{activeSearch}"
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setActiveSearch('')
                  }}
                  className="hover:text-stone-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-200/80 text-stone-800 font-medium">
                Category: {category}
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className="hover:text-stone-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-emerald-800 hover:underline font-semibold ml-2 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      {/* Main Items Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Community Catalog
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              {loading
                ? 'Searching neighborhood items...'
                : `${pagination.total} item${pagination.total === 1 ? '' : 's'} available to borrow`}
            </p>
          </div>
        </div>

        {/* Content rendering */}
        {loading ? (
          <ItemGridSkeleton count={8} />
        ) : errorMsg ? (
          <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-center">
            <p className="font-semibold text-sm">{errorMsg}</p>
            <button
              type="button"
              onClick={loadItems}
              className="mt-3 px-4 py-2 bg-rose-800 text-white text-xs font-semibold rounded-lg hover:bg-rose-900 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No items matched your criteria"
            description="No community members have listed items matching your current search or category filter. Try clearing filters or list your own item!"
            actionLabel="Reset Search Filters"
            onAction={handleClearSearch}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-stone-500 px-2 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Evaluator Guide Modal */}
      <EvaluationGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />
    </div>
  )
}

export default ExplorePage

