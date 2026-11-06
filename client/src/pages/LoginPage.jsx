import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LogIn,
  UserCheck,
  MapPin,
  Sparkles,
  ArrowRight,
  Shield,
  UserPlus
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, demoLogin, login, register, demoUsers } = useAuth()
  const { success, error } = useToast()

  const [activeTab, setActiveTab] = useState('demo') // 'demo' | 'login' | 'register'
  const [submitting, setSubmitting] = useState(false)

  // Standard Login Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register Fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regLocality, setRegLocality] = useState('')

  const redirectPath = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, navigate, redirectPath])

  const handleDemoLogin = async (demoEmail) => {
    setSubmitting(true)
    try {
      const res = await demoLogin(demoEmail)
      success(`Welcome back, ${res.user.name}!`)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      error(err.message || 'Demo login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStandardLogin = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await login(email, password)
      success(`Welcome back, ${res.user.name}!`)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      error(err.message || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        locality: regLocality.trim()
      })
      success(`Account created! Welcome to BorrowBox, ${res.user.name}.`)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      error(err.message || 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-800 text-white font-bold text-2xl shadow-sm mb-2">
          📦
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Welcome to BorrowBox
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          "Borrow More. Own Less." • Sign in to borrow tools, camping gear, and appliances.
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden p-6 sm:p-8">
        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-stone-100 text-xs font-bold text-stone-600 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'demo' ? 'bg-white text-emerald-950 shadow-2xs font-extrabold' : 'hover:text-stone-900'
            }`}
          >
            Demo Accounts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'login' ? 'bg-white text-emerald-950 shadow-2xs font-extrabold' : 'hover:text-stone-900'
            }`}
          >
            Standard Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'register' ? 'bg-white text-emerald-950 shadow-2xs font-extrabold' : 'hover:text-stone-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Tab 1: Demo Personas (One-Click) */}
        {activeTab === 'demo' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-emerald-900 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Select any pre-seeded neighborhood persona below to instantly test borrowing and lending.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(demoUsers.length > 0
                ? demoUsers
                : [
                    { name: 'Alice Green', email: 'alice@borrowbox.local', locality: 'Oakwood Neighborhood' },
                    { name: 'Bob Builder', email: 'bob@borrowbox.local', locality: 'Maple Heights' },
                    { name: 'Charlie Rivers', email: 'charlie@borrowbox.local', locality: 'Pinecrest District' },
                    { name: 'Dana Hayes', email: 'dana@borrowbox.local', locality: 'Sunnyvale Commons' }
                  ]
              ).map((du) => (
                <button
                  key={du.email}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoLogin(du.email)}
                  className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-emerald-700/60 hover:bg-emerald-50/30 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                      {du.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 text-sm truncate group-hover:text-emerald-900">
                        {du.name}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">{du.email}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-medium flex items-center gap-1 text-[11px] truncate">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {du.locality}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-[11px] text-stone-400 pt-2">
              Default password for all demo accounts: <code className="bg-stone-100 px-1 py-0.5 rounded">BorrowBox123!</code>
            </p>
          </div>
        )}

        {/* Tab 2: Standard Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@borrowbox.local"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-900 disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        )}

        {/* Tab 3: Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Sarah Connor"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Neighborhood / Locality
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={regLocality}
                onChange={(e) => setRegLocality(e.target.value)}
                placeholder="e.g. Westside Park, Riverdale"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Password <span className="text-stone-400 font-normal">(Min 6 characters)</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-900 disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating Account...' : 'Join Community'}</span>
            </button>
          </form>
        )}
      </div>

      <div className="text-center">
        <Link
          to="/"
          className="text-xs text-stone-500 hover:text-stone-800 font-semibold transition-colors"
        >
          ← Return to browsing items
        </Link>
      </div>
    </div>
  )
}

export default LoginPage

