export const CATEGORY_FALLBACK_IMAGES = {
  TOOLS: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
  GARDENING: 'https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=800&q=80',
  OUTDOORS_CAMPING: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
  HOME_APPLIANCES: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  ELECTRONICS: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
  PARTY_GAMES: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
  SPORTS_FITNESS: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  BOOKS_MEDIA: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
  OTHER: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80'
}

export function getItemImage(item) {
  if (item?.imageUrl && item.imageUrl.trim().length > 0) {
    return item.imageUrl
  }
  return CATEGORY_FALLBACK_IMAGES[item?.category] || CATEGORY_FALLBACK_IMAGES.OTHER
}

