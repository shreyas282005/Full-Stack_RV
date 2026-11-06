import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-5">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-stone-100 text-stone-500 flex items-center justify-center">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Page Not Found</h1>
      <p className="text-sm text-stone-500 leading-relaxed">
        The page you are looking for doesn't exist or may have been moved.
      </p>
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-900 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage

