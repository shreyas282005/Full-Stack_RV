import {
  Sparkles,
  Wrench,
  Flower2,
  Tent,
  Home,
  Tv,
  Dice5,
  Bike,
  BookOpen,
  Package
} from 'lucide-react'
import { CATEGORY_METADATA } from '../../utils/formatters.js'

const ICON_MAP = {
  Sparkles,
  Wrench,
  Flower2,
  Tent,
  Home,
  Tv,
  Dice5,
  Bike,
  BookOpen,
  Package
}

export function CategoryPills({ selectedCategory, onSelectCategory }) {
  const categories = Object.keys(CATEGORY_METADATA)

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
      {categories.map((catKey) => {
        const meta = CATEGORY_METADATA[catKey]
        const isSelected =
          (catKey === 'ALL' && (!selectedCategory || selectedCategory === 'ALL')) ||
          selectedCategory === catKey
        const IconComponent = ICON_MAP[meta.icon] || Package

        return (
          <button
            key={catKey}
            type="button"
            onClick={() => onSelectCategory(catKey === 'ALL' ? '' : catKey)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
              isSelected
                ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-800 ring-offset-1'
                : 'bg-white/80 text-stone-700 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80 shadow-2xs'
            }`}
          >
            <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-200' : 'text-stone-500'}`} />
            <span>{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default CategoryPills

