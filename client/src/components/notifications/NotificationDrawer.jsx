import { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  Inbox,
  X,
  CheckCheck,
  PackageCheck,
  RefreshCw
} from 'lucide-react'
import notificationsApi from '../../api/notifications.api.js'
import { formatTimeAgo } from '../../utils/formatters.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useSocket } from '../../context/SocketContext.jsx'

export function NotificationDrawer({ isOpen, onClose, unreadCount, onCountChange }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const { error } = useToast()
  const { socket, on } = useSocket()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await notificationsApi.list({ limit: 40 })
      if (res?.data) {
        setNotifications(res.data)
        if (onCountChange && typeof res.unreadCount === 'number') {
          onCountChange(res.unreadCount)
        }
      }
    } catch (err) {
      error(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [error, onCountChange])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Real-time notification updates directly into the drawer list
  useEffect(() => {
    if (!socket) return

    const handleNew = (notification) => {
      setNotifications((prev) => [notification, ...prev])
    }

    const handleRead = ({ notificationId }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    }

    const handleReadAll = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }

    const unNew = on('notification:new', handleNew)
    const unRead = on('notification:read', handleRead)
    const unAll = on('notification:read-all', handleReadAll)

    return () => {
      if (unNew) unNew()
      if (unRead) unRead()
      if (unAll) unAll()
    }
  }, [socket, on])

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      if (onCountChange && unreadCount > 0) {
        onCountChange(unreadCount - 1)
      }
    } catch {
      // Ignored
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      if (onCountChange) {
        onCountChange(0)
      }
    } catch (err) {
      error(err.message || 'Failed to mark all as read')
    }
  }

  if (!isOpen) return null

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BORROW_REQUEST':
        return <Inbox className="w-4 h-4 text-amber-600" />
      case 'REQUEST_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-sky-600" />
      case 'REQUEST_REJECTED':
      case 'REQUEST_CANCELLED':
        return <XCircle className="w-4 h-4 text-rose-600" />
      case 'BORROW_ACTIVE':
        return <Clock className="w-4 h-4 text-emerald-600" />
      case 'ITEM_RETURNED':
        return <PackageCheck className="w-4 h-4 text-emerald-700" />
      default:
        return <Bell className="w-4 h-4 text-stone-500" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-stone-200 flex flex-col animate-in slide-in-from-right duration-200 text-stone-900">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Notifications</h3>
              <p className="text-xs text-stone-500">
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-950 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Close notifications panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-stone-400 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-800" />
              <p className="text-xs">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-stone-400">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-stone-400" />
              </div>
              <p className="font-medium text-stone-700 text-sm">No notifications yet</p>
              <p className="text-xs text-stone-400 max-w-xs mt-1">
                Updates regarding your borrow requests and item activity will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${
                  notif.read
                    ? 'bg-white border-stone-200/60 opacity-75 hover:opacity-100 hover:border-stone-300'
                    : 'bg-emerald-50/40 border-emerald-200/90 shadow-2xs hover:bg-emerald-50/70'
                }`}
              >
                <div className="p-2 rounded-lg bg-white border border-stone-200/60 shrink-0 mt-0.5 shadow-2xs">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={`text-xs font-semibold ${notif.read ? 'text-stone-800' : 'text-emerald-950 font-bold'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{notif.message}</p>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-2" title="Unread" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationDrawer

