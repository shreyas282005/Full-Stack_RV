import { Link } from 'react-router-dom'
import { PackageOpen } from 'lucide-react'

export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'Try adjusting your search filters or check back soon for new community listings.',
  actionLabel,
  actionTo,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white/60 rounded-3xl border border-dashed border-stone-200">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-4 shadow-2xs">
        <Icon className="w-7 h-7 text-stone-500" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-stone-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-stone-500 max-w-sm leading-relaxed mb-5">
        {description}
      </p>

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-xs"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-xs cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState

