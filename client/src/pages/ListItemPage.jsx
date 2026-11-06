import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { PackagePlus, ArrowLeft, Image, Sparkles } from 'lucide-react'
import itemsApi from '../api/items.api.js'
import { CATEGORY_METADATA } from '../utils/formatters.js'
import { CATEGORY_FALLBACK_IMAGES } from '../utils/fallbackImages.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

export function ListItemPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { success, error } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('TOOLS')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState('AVAILABLE')
  const [submitting, setSubmitting] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(isEditing)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (isEditing) {
      itemsApi
        .getById(id)
        .then((res) => {
          if (res?.data) {
            const item = res.data
            setTitle(item.title)
            setDescription(item.description)
            setCategory(item.category || 'OTHER')
            setImageUrl(item.imageUrl || '')
            setStatus(item.status || 'AVAILABLE')
          }
        })
        .catch((err) => {
          error(err.message || 'Could not load item details for editing.')
          navigate('/activity')
        })
        .finally(() => {
          setLoadingInitial(false)
        })
    }
  }, [id, isEditing, isAuthenticated, navigate, error])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (title.trim().length < 3) {
      error('Title must be at least 3 characters.')
      return
    }
    if (description.trim().length < 5) {
      error('Description must be at least 5 characters.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        imageUrl: imageUrl.trim() || undefined
      }

      if (isEditing) {
        payload.status = status
        const res = await itemsApi.update(id, payload)
        success('Item updated successfully!')
        navigate(`/items/${res.data.id}`)
      } else {
        const res = await itemsApi.create(payload)
        success('Item listed successfully! Neighbors can now borrow it.')
        navigate(`/items/${res.data.id}`)
      }
    } catch (err) {
      error(err.message || 'Failed to save item listing.')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryKeys = Object.keys(CATEGORY_METADATA).filter((k) => k !== 'ALL')

  if (loadingInitial) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-stone-400">
        <p>Loading item details...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Back</span>
        </Link>
      </div>

      <div className="p-6 sm:p-10 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3">
            <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Community Lending</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {isEditing ? 'Edit Your Item Listing' : 'List an Item for Neighbors'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Share what you already own to help reduce consumption and empower your neighborhood.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Item Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DeWalt Cordless Drill, 4-Person Camping Tent, Pressure Washer"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800/40 focus:border-emerald-800"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/40 focus:border-emerald-800 cursor-pointer"
            >
              {categoryKeys.map((k) => (
                <option key={k} value={k}>
                  {CATEGORY_METADATA[k]?.label || k}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Description & Condition <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              minLength={5}
              maxLength={2000}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is included (accessories, manuals, batteries), condition, and any tips for using it safely..."
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800/40 focus:border-emerald-800 leading-relaxed"
            />
          </div>

          {/* Image URL with Preset Fallbacks */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Photo URL <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Image className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800/40 focus:border-emerald-800"
              />
            </div>

            {/* Quick Preset Suggestion */}
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Need a photo?</span>
              <button
                type="button"
                onClick={() => setImageUrl(CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.OTHER)}
                className="text-emerald-800 font-semibold hover:underline cursor-pointer"
              >
                Use high-res photo for {CATEGORY_METADATA[category]?.label || 'Category'}
              </button>
            </div>

            {/* Image Preview */}
            {(imageUrl || category) && (
              <div className="pt-2 flex items-center gap-3">
                <div className="w-20 h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                  <img
                    src={imageUrl || CATEGORY_FALLBACK_IMAGES[category]}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = CATEGORY_FALLBACK_IMAGES.OTHER
                    }}
                  />
                </div>
                <p className="text-xs text-stone-400">Preview of your listing image</p>
              </div>
            )}
          </div>

          {/* Availability Status (Editing only) */}
          {isEditing && (
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Item Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/40"
              >
                <option value="AVAILABLE">Available</option>
                <option value="BORROWED">Borrowed</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-900 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              {submitting ? 'Saving Item...' : isEditing ? 'Update Listing' : 'Publish Item Listing'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="py-3.5 px-5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ListItemPage
