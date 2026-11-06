export function ItemCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden animate-pulse">
      <div className="aspect-4/3 w-full bg-stone-200" />
      <div className="p-4 space-y-3">
        <div className="w-24 h-4 bg-stone-200 rounded-full" />
        <div className="w-full h-5 bg-stone-200 rounded" />
        <div className="w-3/4 h-3.5 bg-stone-100 rounded" />
        <div className="pt-3 border-t border-stone-100 flex justify-between">
          <div className="w-20 h-3 bg-stone-200 rounded" />
          <div className="w-24 h-3 bg-stone-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export function ItemGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ActivityListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-stone-200 shrink-0" />
            <div className="space-y-2">
              <div className="w-32 h-4 bg-stone-200 rounded" />
              <div className="w-48 h-3.5 bg-stone-100 rounded" />
            </div>
          </div>
          <div className="w-28 h-8 bg-stone-200 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  )
}

export default ItemGridSkeleton

