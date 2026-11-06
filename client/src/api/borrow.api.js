import apiClient from './client.js'

export const borrowApi = {
  create: (data) => apiClient('/borrow-requests', { method: 'POST', body: data }),
  getOutgoing: (params) => apiClient('/borrow-requests/outgoing', { params }),
  getIncoming: (params) => apiClient('/borrow-requests/incoming', { params }),
  getById: (id) => apiClient(`/borrow-requests/${id}`),
  approve: (id) => apiClient(`/borrow-requests/${id}/approve`, { method: 'POST' }),
  reject: (id) => apiClient(`/borrow-requests/${id}/reject`, { method: 'POST' }),
  cancel: (id) => apiClient(`/borrow-requests/${id}/cancel`, { method: 'POST' }),
  activate: (id) => apiClient(`/borrow-requests/${id}/activate`, { method: 'POST' }),
  return: (id) => apiClient(`/borrow-requests/${id}/return`, { method: 'POST' })
}

export default borrowApi

