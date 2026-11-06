import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  PlusCircle,
  Edit3,
  Trash2,
  Calendar,
  User as UserIcon,
  MapPin,
  ExternalLink
} from 'lucide-react'
import borrowApi from '../api/borrow.api.js'
import itemsApi from '../api/items.api.js'
import { getItemImage } from '../utils/fallbackImages.js'
import { formatDateRange, formatDate } from '../utils/formatters.js'
import StatusBadge from '../components/common/StatusBadge.jsx'
import { ActivityListSkeleton } from '../components/common/LoadingSkeleton.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import Modal from '../components/common/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'

export function ActivityPage() {
  const { user, isAuthenticated } = useAuth()
  const { success, error } = useToast()
  const { socket, on } = useSocket()

  const [activeTab, setActiveTab] = useState('borrowing') // 'borrowing' | 'lending'
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [myItems, setMyItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Item deletion modal state
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const [outRes, inRes, itemsRes] = await Promise.all([
        borrowApi.getOutgoing({ limit: 50 }),
        borrowApi.getIncoming({ limit: 50 }),
        itemsApi.list({ limit: 100 })
      ])

      if (outRes?.data) setOutgoingRequests(outRes.data)
      if (inRes?.data) setIncomingRequests(inRes.data)
      if (itemsRes?.data && user?.id) {
        // Filter user's own items
        const owned = itemsRes.data.filter((item) => item.ownerId === user.id)
        setMyItems(owned)
      }
    } catch (err) {
      error(err.message || 'Failed to load activity.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user?.id, error])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Real-time synchronization for borrowing / lending requests
  useEffect(() => {
    if (!socket || !isAuthenticated) return

    const handleRequestChange = () => {
      // Reload activity data silently to reflect new or updated requests
      loadData()
    }

    const unCreated = on('borrow-request:created', handleRequestChange)
    const unUpdated = on('borrow-request:updated', handleRequestChange)
    const unAvailability = on('item:availability-updated', handleRequestChange)

    return () => {
      if (unCreated) unCreated()
      if (unUpdated) unUpdated()
      if (unAvailability) unAvailability()
    }
  }, [socket, isAuthenticated, on, loadData])

  // --- Actions ---

  const handleApprove = async (requestId) => {
    setActionLoadingId(requestId)
    try {
      await borrowApi.approve(requestId)
      success('Borrow request approved! The borrower has been notified.')
      loadData()
    } catch (err) {
      error(err.message || 'Failed to approve request.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (requestId) => {
    setActionLoadingId(requestId)
    try {
      await borrowApi.reject(requestId)
      success('Borrow request declined.')
      loadData()
    } catch (err) {
      error(err.message || 'Failed to decline request.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCancel = async (requestId) => {
    setActionLoadingId(requestId)
    try {
      await borrowApi.cancel(requestId)
      success('Borrow request cancelled.')
      loadData()
    } catch (err) {
      error(err.message || 'Failed to cancel request.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleActivate = async (requestId) => {
    setActionLoadingId(requestId)
    try {
      await borrowApi.activate(requestId)
      success('Item marked as Handed Over / Active borrowing!')
      loadData()
    } catch (err) {
      error(err.message || 'Failed to mark as active.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReturn = async (requestId) => {
    setActionLoadingId(requestId)
    try {
      await borrowApi.return(requestId)
      success('Item marked as Returned & Completed! Item is available again.')
      loadData()
    } catch (err) {
      error(err.message || 'Failed to complete return.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return
    setDeleteSubmitting(true)
    try {
      await itemsApi.delete(itemToDelete.id)
      success('Listing deleted.')
      setItemToDelete(null)
      loadData()
    } catch (err) {
      error(err.message || 'Cannot delete item.')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Sign In Required"
        description="Please log in or select a demo account to view your activity, borrowings, and listings."
        actionLabel="Go to Login"
        actionTo="/login"
      />
    )
  }

  // Count pending actions for badge
  const pendingIncomingCount = incomingRequests.filter((r) => r.status === 'PENDING').length
  const activeBorrowingsCount = outgoingRequests.filter((r) => r.status === 'ACTIVE').length

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header & Stats Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            My Community Activity
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Logged in as <strong className="text-stone-800">{user?.name}</strong> • Locality:{' '}
            <span className="text-emerald-800 font-medium">{user?.locality || 'Neighborhood'}</span>
          </p>
        </div>

        <Link
          to="/items/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-900 transition-colors shadow-2xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List Another Item</span>
        </Link>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-stone-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('borrowing')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'borrowing'
              ? 'border-emerald-800 text-emerald-950 font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-700" />
          <span>My Borrowings</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-700 font-semibold">
            {outgoingRequests.length}
          </span>
          {activeBorrowingsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lending')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'lending'
              ? 'border-emerald-800 text-emerald-950 font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-amber-700" />
          <span>My Listings & Lending</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-700 font-semibold">
            {incomingRequests.length} reqs
          </span>
          {pendingIncomingCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
              {pendingIncomingCount} pending
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: My Borrowings (Items I have requested from others) */}
      {activeTab === 'borrowing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">
              Items You Requested from Neighbors
            </h2>
          </div>

          {loading ? (
            <ActivityListSkeleton count={3} />
          ) : outgoingRequests.length === 0 ? (
            <EmptyState
              title="You haven't borrowed any items yet"
              description="Browse the neighborhood catalog to find power tools, camping gear, and appliances you can borrow for free."
              actionLabel="Explore Available Items"
              actionTo="/"
            />
          ) : (
            <div className="space-y-4">
              {outgoingRequests.map((req) => {
                const isLoading = actionLoadingId === req.id

                return (
                  <div
                    key={req.id}
                    className="p-5 bg-white rounded-3xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                  >
                    {/* Item info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <Link
                        to={`/items/${req.item.id}`}
                        className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 block"
                      >
                        <img
                          src={getItemImage(req.item)}
                          alt={req.item.title}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge type="borrow" status={req.status} />
                        </div>
                        <Link
                          to={`/items/${req.item.id}`}
                          className="font-bold text-stone-900 hover:text-emerald-800 text-sm sm:text-base truncate block"
                        >
                          {req.item.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 mt-1">
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                            Owner: <strong className="text-stone-700">{req.owner?.name}</strong>
                          </span>
                          {req.owner?.locality && (
                            <span className="flex items-center gap-1 text-emerald-800">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {req.owner.locality}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-stone-600 font-medium">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            {formatDateRange(req.startDate, req.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons based on status */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 justify-end">
                      {/* PENDING: Allow borrower to cancel */}
                      {req.status === 'PENDING' && (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleCancel(req.id)}
                          className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isLoading ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      )}

                      {/* APPROVED: Can mark active on pickup */}
                      {req.status === 'APPROVED' && (
                        <>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleActivate(req.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isLoading ? 'Updating...' : 'Confirm Pickup (Start)'}
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleCancel(req.id)}
                            className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-500 hover:text-stone-800"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {/* ACTIVE: Can mark returned */}
                      {req.status === 'ACTIVE' && (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleReturn(req.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isLoading ? 'Processing...' : 'Confirm Item Returned'}</span>
                        </button>
                      )}

                      {/* RETURNED / COMPLETED */}
                      {req.status === 'RETURNED' && (
                        <span className="text-xs text-stone-400 italic">
                          Completed on {formatDate(req.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Listings & Lending (Requests received for items I own + my items list) */}
      {activeTab === 'lending' && (
        <div className="space-y-10">
          {/* Section A: Incoming Requests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Incoming Borrow Requests for Your Items
                </h2>
                <p className="text-xs text-stone-500">
                  Review and approve neighbors asking to borrow your items.
                </p>
              </div>
            </div>

            {loading ? (
              <ActivityListSkeleton count={2} />
            ) : incomingRequests.length === 0 ? (
              <div className="p-8 bg-white/60 rounded-3xl border border-dashed border-stone-200 text-center text-stone-500 text-xs sm:text-sm">
                No borrow requests received yet for your items.
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((req) => {
                  const isLoading = actionLoadingId === req.id

                  return (
                    <div
                      key={req.id}
                      className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row gap-5 items-start md:items-center justify-between ${
                        req.status === 'PENDING'
                          ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                          : 'bg-white border-stone-200/90'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <Link
                          to={`/items/${req.item.id}`}
                          className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 block"
                        >
                          <img
                            src={getItemImage(req.item)}
                            alt={req.item.title}
                            className="w-full h-full object-cover"
                          />
                        </Link>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge type="borrow" status={req.status} />
                          </div>
                          <Link
                            to={`/items/${req.item.id}`}
                            className="font-bold text-stone-900 hover:text-emerald-800 text-sm sm:text-base truncate block"
                          >
                            {req.item.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 mt-1">
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                              Requested by:{' '}
                              <strong className="text-stone-800">{req.borrower?.name}</strong>
                            </span>
                            {req.borrower?.locality && (
                              <span className="flex items-center gap-1 text-emerald-800">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                {req.borrower.locality}
                              </span>
                            )}
                            <span className="flex items-center gap-1 font-medium text-stone-700">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              {formatDateRange(req.startDate, req.endDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Owner Response Actions */}
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 justify-end">
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleApprove(req.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isLoading ? 'Approving...' : 'Approve'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleReject(req.id)}
                              className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {req.status === 'APPROVED' && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleActivate(req.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isLoading ? 'Updating...' : 'Mark Handed Over (Active)'}</span>
                          </button>
                        )}

                        {req.status === 'ACTIVE' && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleReturn(req.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{isLoading ? 'Processing...' : 'Confirm Return Received'}</span>
                          </button>
                        )}

                        {req.status === 'RETURNED' && (
                          <span className="text-xs text-stone-400 italic">Returned & Completed</span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="text-xs text-rose-500 font-medium">Declined</span>
                        )}
                        {req.status === 'CANCELLED' && (
                          <span className="text-xs text-stone-400 italic">Cancelled by borrower</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Section B: My Listed Items */}
          <div className="space-y-4 pt-6 border-t border-stone-200/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">Items You Are Lending</h2>
                <p className="text-xs text-stone-500">
                  {myItems.length} active listing{myItems.length === 1 ? '' : 's'} in your community
                </p>
              </div>
              <Link
                to="/items/new"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 font-bold"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Item</span>
              </Link>
            </div>

            {loading ? (
              <ActivityListSkeleton count={2} />
            ) : myItems.length === 0 ? (
              <EmptyState
                title="You haven't listed any items yet"
                description="Got tools, a ladder, camping tent, or lawn equipment sitting idle? List them so your neighbors can borrow them!"
                actionLabel="List Your First Item"
                actionTo="/items/new"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {myItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col justify-between gap-3 text-left"
                  >
                    <div className="flex gap-3 items-start">
                      <img
                        src={getItemImage(item)}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <StatusBadge type="item" status={item.status} />
                        <h4 className="font-bold text-stone-900 text-sm truncate mt-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-stone-500 line-clamp-1">{item.description}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <Link
                        to={`/items/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </Link>

                      <div className="flex items-center gap-1">
                        <Link
                          to={`/items/${item.id}/edit`}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 hover:bg-stone-50 transition-colors"
                          title="Edit Listing"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Confirm Item Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Are you sure you want to delete <strong>"{itemToDelete?.title}"</strong>?
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setItemToDelete(null)}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteSubmitting}
              onClick={confirmDeleteItem}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
            >
              {deleteSubmitting ? 'Deleting...' : 'Delete Listing'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ActivityPage
