export const CATEGORY_METADATA = {
  ALL: { label: 'All Items', icon: 'Sparkles' },
  TOOLS: { label: 'Tools & DIY', icon: 'Wrench' },
  GARDENING: { label: 'Lawn & Garden', icon: 'Flower2' },
  OUTDOORS_CAMPING: { label: 'Outdoors & Camping', icon: 'Tent' },
  HOME_APPLIANCES: { label: 'Home Appliances', icon: 'Home' },
  ELECTRONICS: { label: 'Electronics', icon: 'Tv' },
  PARTY_GAMES: { label: 'Games & Events', icon: 'Dice5' },
  SPORTS_FITNESS: { label: 'Sports & Fitness', icon: 'Bike' },
  BOOKS_MEDIA: { label: 'Books & Media', icon: 'BookOpen' },
  OTHER: { label: 'Other Items', icon: 'Package' }
}

export const BORROW_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Approval',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500'
  },
  APPROVED: {
    label: 'Approved (Ready for Pickup)',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500'
  },
  ACTIVE: {
    label: 'Currently On Loan',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500 animate-pulse'
  },
  RETURNED: {
    label: 'Returned & Completed',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
    dotClass: 'bg-stone-400'
  },
  REJECTED: {
    label: 'Declined by Owner',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500'
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeClass: 'bg-stone-100 text-stone-500 border-stone-200',
    dotClass: 'bg-stone-300'
  }
}

export const ITEM_STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available to Borrow',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500'
  },
  BORROWED: {
    label: 'Currently Borrowed',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500'
  },
  MAINTENANCE: {
    label: 'In Maintenance',
    badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
    dotClass: 'bg-stone-400'
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    badgeClass: 'bg-stone-100 text-stone-500 border-stone-200',
    dotClass: 'bg-stone-300'
  }
}

export function formatDate(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatTimeAgo(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(dateInput)
}

export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return ''
  const s = new Date(startDate)
  const e = new Date(endDate)
  const diffDays = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)))
  return `${formatDate(s)} – ${formatDate(e)} (${diffDays} ${diffDays === 1 ? 'day' : 'days'})`
}

