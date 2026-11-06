import apiClient from './client.js'

export const itemsApi = {
  list: (params) => apiClient('/items', { params }),
  getById: (id) => apiClient(`/items/${id}`),
  create: (itemData) => apiClient('/items', { method: 'POST', body: itemData }),
  update: (id, itemData) => apiClient(`/items/${id}`, { method: 'PATCH', body: itemData }),
  delete: (id) => apiClient(`/items/${id}`, { method: 'DELETE' })
}

export default itemsApi

