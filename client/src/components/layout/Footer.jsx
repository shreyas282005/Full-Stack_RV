import { Heart, Package, ShieldCheck, Users } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-20 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Borrow<span className="text-emerald-400">Box</span>
              </span>
            </div>
            <p className="text-emerald-400 font-semibold text-sm">
              "Borrow More. Own Less."
            </p>
            <p className="text-stone-400 text-xs sm:text-sm max-w-md leading-relaxed">
              A community-powered platform where people list everyday items they own and allow others to borrow them temporarily. Saving money, cutting waste, and connecting neighbors.
            </p>
          </div>

          {/* Core Values Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">How It Works</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Local neighborhood sharing</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Verified community profiles</span>
              </li>
              <li className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tools, camping, gear & games</span>
              </li>
            </ul>
          </div>

          {/* Quick Demo Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Technology Stack</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Built on React 19, Vite, Tailwind CSS v4, Express, PostgreSQL, and Prisma ORM.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Step 3B Active
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} BorrowBox. Community Resource Network.</p>
          <div className="flex items-center gap-1 text-stone-400">
            <span>Crafted for sustainable communities with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

