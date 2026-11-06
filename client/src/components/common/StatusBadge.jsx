import { BORROW_STATUS_CONFIG, ITEM_STATUS_CONFIG } from '../../utils/formatters.js'

export function StatusBadge({ type = 'borrow', status }) {
  const config =
    type === 'borrow'
      ? BORROW_STATUS_CONFIG[status] || { label: status, badgeClass: 'bg-stone-100 text-stone-700 border-stone-200', dotClass: 'bg-stone-400' }
      : ITEM_STATUS_CONFIG[status] || { label: status, badgeClass: 'bg-stone-100 text-stone-700 border-stone-200', dotClass: 'bg-stone-400' }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  )
}

export default StatusBadge

