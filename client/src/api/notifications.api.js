import apiClient from './client.js'

export const notificationsApi = {
  list: (params) => apiClient('/notifications', { params }),
  getUnreadCount: () => apiClient('/notifications/unread-count'),
  markAsRead: (id) => apiClient(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => apiClient('/notifications/read-all', { method: 'PATCH' })
}

export default notificationsApi

