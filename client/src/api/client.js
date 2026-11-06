const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function apiClient(endpoint, { method = 'GET', body, headers = {}, params } = {}) {
  let url = `${BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const token = localStorage.getItem('borrowbox_token')

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const message = data?.error?.message || `Request failed with status ${response.status}`
      const code = data?.error?.code || 'UNKNOWN_ERROR'
      const details = data?.error?.details || null

      // If token expired or invalid, clear it
      if (response.status === 401 && token) {
        localStorage.removeItem('borrowbox_token')
        localStorage.removeItem('borrowbox_user')
        window.dispatchEvent(new Event('borrowbox_auth_changed'))
      }

      throw new ApiError(message, response.status, code, details)
    }

    return data
  } catch (err) {
    if (err instanceof ApiError) {
      throw err
    }
    // Network / backend unreachable error
    throw new ApiError(
      'Unable to connect to the BorrowBox backend. Please check your server connection.',
      0,
      'NETWORK_ERROR',
      null
    )
  }
}

export default apiClient

