import { Link } from 'react-router-dom'
import { MapPin, User as UserIcon } from 'lucide-react'
import { getItemImage } from '../../utils/fallbackImages.js'
import { CATEGORY_METADATA } from '../../utils/formatters.js'
import StatusBadge from './StatusBadge.jsx'

export function ItemCard({ item }) {
  const imageUrl = getItemImage(item)
  const categoryLabel = CATEGORY_METADATA[item.category]?.label || item.category || 'General'

  return (
    <Link
      to={`/items/${item.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md hover:border-emerald-700/30 transition-all duration-300 overflow-hidden text-left"
    >
      {/* Image container */}
      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = getItemImage({ category: item.category })
          }}
        />
        {/* Category tag overlay */}
        <div className="absolute top-3 left-3">
          <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow-xs">
            {categoryLabel}
          </span>
        </div>
      </div>

      {/* Details container */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <StatusBadge type="item" status={item.status} />
          </div>
          <h3 className="font-semibold text-stone-900 text-base leading-snug line-clamp-1 group-hover:text-emerald-800 transition-colors">
            {item.title}
          </h3>
          <p className="text-stone-500 text-xs line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Owner & Locality footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5 truncate max-w-[55%]">
            <UserIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate">{item.owner?.name || 'Community Member'}</span>
          </div>
          {item.owner?.locality && (
            <div className="flex items-center gap-1 text-emerald-800 font-medium truncate max-w-[45%]">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{item.owner.locality}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ItemCard

