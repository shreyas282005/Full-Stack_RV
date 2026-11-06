import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  User as UserIcon,
  ShieldCheck,
  ArrowLeft,
  CalendarCheck,
  AlertCircle,
  Edit3,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react'
import itemsApi from '../api/items.api.js'
import borrowApi from '../api/borrow.api.js'
import { getItemImage } from '../utils/fallbackImages.js'
import { CATEGORY_METADATA, formatDate, formatDateRange } from '../utils/formatters.js'
import StatusBadge from '../components/common/StatusBadge.jsx'
import Modal from '../components/common/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'

export function ItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { success, error } = useToast()
  const { socket, on } = useSocket()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Date selection states (Default: tomorrow -> 3 days later)
  const getTomorrow = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }
  const getFutureDate = (daysAhead) => {
    const d = new Date()
    d.setDate(d.getDate() + daysAhead)
    return d.toISOString().split('T')[0]
  }

  const [startDate, setStartDate] = useState(getTomorrow())
  const [endDate, setEndDate] = useState(getFutureDate(4))
  const [borrowingSubmitting, setBorrowingSubmitting] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const loadItem = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await itemsApi.getById(id)
      if (res?.data) {
        setItem(res.data)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load item details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadItem()
  }, [loadItem])

  // Real-time item status update
  useEffect(() => {
    if (!socket || !id) return

    const handleAvailability = ({ itemId, status }) => {
      if (itemId === id) {
        setItem((prev) => (prev ? { ...prev, status } : prev))
      }
    }

    const cleanup = on('item:availability-updated', handleAvailability)
    return () => {
      if (cleanup) cleanup()
    }
  }, [socket, id, on])

  const isOwner = user && item && user.id === item.ownerId

  const handleBorrowSubmit = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      error('Return date must be strictly after the pickup date.')
      return
    }

    setBorrowingSubmitting(true)
    try {
      const startDateTime = new Date(`${startDate}T09:00:00Z`).toISOString()
      const endDateTime = new Date(`${endDate}T18:00:00Z`).toISOString()

      await borrowApi.create({
        itemId: item.id,
        startDate: startDateTime,
        endDate: endDateTime
      })

      success('Borrow request sent to the owner! You can track its status in My Activity.')
      navigate('/activity')
    } catch (err) {
      error(err.message || 'Could not submit borrow request.')
    } finally {
      setBorrowingSubmitting(false)
    }
  }

  const handleDeleteItem = async () => {
    setDeleteSubmitting(true)
    try {
      await itemsApi.delete(item.id)
      success('Item listing deleted successfully.')
      navigate('/activity')
    } catch (err) {
      error(err.message || 'Failed to delete item listing.')
    } finally {
      setDeleteSubmitting(false)
      setDeleteModalOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 animate-pulse space-y-6">
        <div className="w-32 h-6 bg-stone-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-4/3 bg-stone-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="w-24 h-5 bg-stone-200 rounded" />
            <div className="w-3/4 h-8 bg-stone-200 rounded" />
            <div className="w-full h-24 bg-stone-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (errorMsg || !item) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Item Not Found</h2>
        <p className="text-xs sm:text-sm text-stone-500">
          {errorMsg || 'The requested item could not be retrieved or has been removed.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    )
  }

  const imageUrl = getItemImage(item)
  const categoryLabel = CATEGORY_METADATA[item.category]?.label || item.category || 'General'

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community Catalog</span>
        </Link>
      </div>

      {/* Main Grid: Left Image, Right Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image & Owner Info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs">
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = getItemImage({ category: item.category })
              }}
            />
            <div className="absolute top-4 left-4">
              <span className="bg-stone-900/80 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-xs">
                {categoryLabel}
              </span>
            </div>
          </div>

          {/* Owner Profile Card */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-lg shadow-2xs">
                {item.owner?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium">Lent by Neighbor</p>
                <h4 className="font-bold text-stone-900 text-sm sm:text-base">{item.owner?.name}</h4>
                {item.owner?.locality && (
                  <p className="text-xs text-emerald-800 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item.owner.locality}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200/60">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Member</span>
            </div>
          </div>

          {/* Existing Upcoming Bookings Warning (if any) */}
          {item.borrowRequests && item.borrowRequests.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-amber-950">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Upcoming Booked Periods:</span>
              </div>
              <ul className="text-xs space-y-1 list-disc list-inside text-amber-800">
                {item.borrowRequests.map((req) => (
                  <li key={req.id}>
                    {formatDateRange(req.startDate, req.endDate)} ({req.status})
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-700 italic">
                Please pick dates that do not overlap with existing bookings.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Title, Description, Borrow Action Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <StatusBadge type="item" status={item.status} />
              <span className="text-xs text-stone-400">Added {formatDate(item.createdAt)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-snug">
              {item.title}
            </h1>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">About This Item</h3>
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-stone-200/60">
              {item.description}
            </p>
          </div>

          {/* Action Card: Owner controls vs Borrower request */}
          {isOwner ? (
            <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>You are the owner of this listing</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                You can manage incoming borrow requests for this item in your Activity dashboard or edit listing details.
              </p>

              <div className="flex gap-2.5 pt-1">
                <Link
                  to={`/items/${item.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Item</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200 text-rose-700 font-semibold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-stone-900">Request to Borrow</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Choose your requested dates. The owner will review and confirm.
                </p>
              </div>

              <form onSubmit={handleBorrowSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Borrow From
                    </label>
                    <input
                      type="date"
                      min={getTomorrow()}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Return By
                    </label>
                    <input
                      type="date"
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
                    />
                  </div>
                </div>

                {startDate && endDate && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs text-stone-600">
                    <span className="font-medium">Requested Window:</span>
                    <span className="font-bold text-emerald-900">
                      {formatDateRange(startDate, endDate)}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={borrowingSubmitting || item.status !== 'AVAILABLE'}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>
                    {borrowingSubmitting
                      ? 'Submitting Request...'
                      : item.status !== 'AVAILABLE'
                      ? 'Item Currently Unavailable'
                      : 'Send Borrow Request'}
                  </span>
                </button>
              </form>

              <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400 space-y-1">
                <p>• Zero rental fees — community powered sharing.</p>
                <p>• Return item in the same condition as received.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Item Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Are you sure you want to delete <strong>"{item.title}"</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteSubmitting}
              onClick={handleDeleteItem}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
            >
              {deleteSubmitting ? 'Deleting...' : 'Delete Item'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ItemDetailPage
