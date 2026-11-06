import {
  Sparkles,
  Users,
  Layers,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
  ExternalLink,
  BookOpen
} from 'lucide-react'

export function EvaluationGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col text-stone-900">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              📦
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
                BorrowBox Evaluator Guide
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Demo Checklist
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Key features, test workflows, and demo persona instructions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* 1. How BorrowBox Works */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              1. How BorrowBox Works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-1">
                  1
                </span>
                <p className="font-bold text-stone-900 text-xs">Discover & Browse</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Browse 20 community items across 8 categories with live search, filtering, and neighborhood locality tags.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-1">
                  2
                </span>
                <p className="font-bold text-stone-900 text-xs">Request & Coordinate</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Select start and end dates. Overlap prevention blocks conflicting double-bookings in real-time.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-1">
                  3
                </span>
                <p className="font-bold text-stone-900 text-xs">Pickup, Use & Return</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Owner approves request, hands over item (ACTIVE loan), and marks it returned to restore availability.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Demo Personas (1-Click Login) */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              2. Pre-Seeded Demo Personas (1-Click Switcher)
            </h3>
            <p className="text-stone-600 text-xs">
              Switch personas instantly via the top-right profile dropdown or the Login page without entering passwords:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                  A
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-xs">Alice Green (Oakwood)</p>
                  <p className="text-[11px] text-stone-500">
                    Owns Power Drill, Lawn Aerator, Inflatable Kayak, YETI Cooler. Has an approved tent trip with Bob.
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                  B
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-xs">Bob Builder (Maple Heights)</p>
                  <p className="text-[11px] text-stone-500">
                    Owns Camping Tent, Ladder, Bike Rack. Currently has an active loan of Charlie's Pressure Washer!
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                  C
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-xs">Charlie Rivers (Pinecrest)</p>
                  <p className="text-[11px] text-stone-500">
                    Owns Pressure Washer, Theater Projector, Cornhole set, Tool Kit.
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                  D
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-xs">Dana Hayes (Sunnyvale)</p>
                  <p className="text-[11px] text-stone-500">
                    Owns Circular Saw, String Trimmer, Lawn Jenga blocks, Travel Atlas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Recommended Test Workflows */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-700" />
              3. Recommended Evaluation Workflows
            </h3>
            <div className="space-y-2">
              {/* Test A: Two Browser Test */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Test A: Two-Browser Real-Time Sync (Socket.IO)</span>
                </div>
                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  Open an incognito window. Log in as <strong>Bob</strong> in Window 1 and <strong>Alice</strong> in Window 2.
                  From Window 1 (Bob), request to borrow Alice's Power Drill. Watch Window 2 (Alice) immediately receive a live notification badge and banner alert without refreshing!
                </p>
              </div>

              {/* Test B: Overlap Conflict Prevention */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Test B: Double-Booking Conflict Prevention</span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Notice that Bob's <em>Coleman Tent</em> is already approved for Alice for upcoming dates.
                  Log in as Dana and attempt to request the same tent for overlapping dates: the system will reject it with a clear 409 Conflict message.
                </p>
              </div>

              {/* Test C: Full Borrowing Lifecycle */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sky-950 text-xs">
                  <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Test C: Complete State Machine Progression</span>
                </div>
                <p className="text-[11px] text-sky-900/90 leading-relaxed">
                  Go to <strong>My Activity</strong>. Observe real examples of <code>PENDING</code>, <code>APPROVED</code>, <code>ACTIVE</code> (on loan), and <code>RETURNED</code>.
                  Approve a pending request, click <em>"Mark as Picked Up / Active"</em> (item becomes BORROWED), and finally <em>"Confirm Item Returned"</em> (restores availability).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-medium">
            BorrowBox v1.0.0 • Full Stack Production Build
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Got it, Start Testing
          </button>
        </div>
      </div>
    </div>
  )
}

export default EvaluationGuideModal

