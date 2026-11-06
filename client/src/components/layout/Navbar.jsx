import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Package,
  PlusCircle,
  Activity,
  Bell,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  MapPin,
  ChevronDown,
  Wifi,
  WifiOff,
  BookOpen
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSocket } from '../../context/SocketContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import notificationsApi from '../../api/notifications.api.js'
import NotificationDrawer from '../notifications/NotificationDrawer.jsx'
import EvaluationGuideModal from '../common/EvaluationGuideModal.jsx'

export function Navbar() {
  const { user, isAuthenticated, logout, demoUsers, demoLogin } = useAuth()
  const { socket, isConnected, isReconnecting, on } = useSocket()
  const { info } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  // Fetch unread notification count
  const refreshUnreadCount = async () => {
    if (!isAuthenticated) return
    try {
      const res = await notificationsApi.getUnreadCount()
      if (res?.data?.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount)
      }
    } catch {
      // Ignored
    }
  }

  // Initial load when auth changes
  useEffect(() => {
    refreshUnreadCount()
  }, [isAuthenticated])

  // Real-time notification count listeners via Socket.IO (replaces periodic polling)
  useEffect(() => {
    if (!isAuthenticated || !socket) return

    const handleNewNotification = (notification) => {
      setUnreadCount((prev) => prev + 1)
      info(notification.title || 'New Notification', notification.message)
    }

    const handleNotificationRead = () => {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    const handleAllRead = () => {
      setUnreadCount(0)
    }

    const cleanupNew = on('notification:new', handleNewNotification)
    const cleanupRead = on('notification:read', handleNotificationRead)
    const cleanupReadAll = on('notification:read-all', handleAllRead)

    return () => {
      if (cleanupNew) cleanupNew()
      if (cleanupRead) cleanupRead()
      if (cleanupReadAll) cleanupReadAll()
    }
  }, [isAuthenticated, socket, on, info])

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserDropdownOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setUserDropdownOpen(false)
    navigate('/')
  }

  const handleSwitchDemo = async (email) => {
    await demoLogin(email)
    setUserDropdownOpen(false)
    refreshUnreadCount()
  }

  const navLinks = [
    { to: '/', label: 'Explore', icon: Package },
    { to: '/activity', label: 'My Activity', icon: Activity, requireAuth: true },
    { to: '/items/new', label: 'List an Item', icon: PlusCircle, requireAuth: true }
  ]

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-emerald-900 group-hover:scale-105 transition-all">
                📦
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-stone-900 leading-none">
                  Borrow<span className="text-emerald-800">Box</span>
                </span>
                <span className="text-[10px] text-stone-500 font-medium tracking-wider uppercase mt-0.5">
                  Borrow More. Own Less.
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.to
                if (link.requireAuth && !isAuthenticated) return null

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-stone-500'}`} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Evaluator Guide Button */}
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                title="Open Evaluator Testing Guide & Persona Info"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Evaluator Guide</span>
                <span className="sm:hidden">Guide</span>
              </button>

              {isAuthenticated ? (
                <>
                  {/* Real-time Connection Status Indicator */}
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-all"
                    title={
                      isConnected
                        ? 'Live updates connected'
                        : isReconnecting
                        ? 'Reconnecting live updates...'
                        : 'Live updates offline'
                    }
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                          : isReconnecting
                          ? 'bg-amber-500 animate-ping'
                          : 'bg-stone-300'
                      }`}
                    />
                    <span className="hidden lg:inline text-[11px] text-stone-500">
                      {isConnected ? 'Live' : isReconnecting ? 'Connecting...' : 'Offline'}
                    </span>
                  </div>

                  {/* Notifications Bell */}
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="relative p-2.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold ring-2 ring-[#FAF9F5] animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* User Profile Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen((prev) => !prev)}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-stone-200 bg-white hover:border-emerald-700/40 hover:shadow-2xs transition-all cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-semibold text-stone-800 hidden sm:inline max-w-[100px] truncate">
                        {user?.name?.split(' ')[0]}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200/90 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        {/* Current User Info */}
                        <div className="px-4 py-2 border-b border-stone-100">
                          <p className="text-xs font-bold text-stone-900 truncate">{user?.name}</p>
                          <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                          {user?.locality && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-800 font-medium">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              <span className="truncate">{user.locality}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Persona Switcher */}
                        {demoUsers.length > 0 && (
                          <div className="py-2 border-b border-stone-100">
                            <p className="px-4 text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                              Switch Demo Persona
                            </p>
                            <div className="space-y-0.5 px-2">
                              {demoUsers.map((du) => (
                                <button
                                  key={du.id}
                                  type="button"
                                  onClick={() => handleSwitchDemo(du.email)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    du.id === user?.id
                                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                                  }`}
                                >
                                  <span className="truncate">{du.name}</span>
                                  <span className="text-[10px] text-stone-400 shrink-0">
                                    {du.locality?.split(' ')[0]}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Logout Option */}
                        <div className="pt-1 px-2">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-800 text-white hover:bg-emerald-900 transition-all shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log in / Demo</span>
                </Link>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 md:hidden cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200/80 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.to
              if (link.requireAuth && !isAuthenticated) return null

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive ? 'bg-emerald-800 text-white font-semibold' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              )}
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full mt-2 py-2.5 rounded-xl bg-emerald-800 text-white font-semibold text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Log in / Demo Personas</span>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Persistent Notification Flyout Drawer */}
      <NotificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        unreadCount={unreadCount}
        onCountChange={(newCount) => setUnreadCount(newCount)}
      />

      {/* Evaluator Quick Guide Modal */}
      <EvaluationGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </>
  )
}

export default Navbar

