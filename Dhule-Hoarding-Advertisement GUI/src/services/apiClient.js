// Simple axios-like API client for the new GUI
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

class ApiClient {
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      params = null,
      headers = {},
      timeout = 300000,
    } = options

    const baseUrl = `${API_BASE_URL}${endpoint}`
    const query = params ? new URLSearchParams(params).toString() : ''
    const url = query ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${query}` : baseUrl
    
    // Get token from localStorage
    const token = localStorage.getItem('token')
    const finalHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    }

    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: data ? JSON.stringify(data) : null,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(error.message || 'API request failed')
    }
  }

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  post(endpoint, data, options) {
    return this.request(endpoint, { ...options, method: 'POST', data })
  }

  put(endpoint, data, options) {
    return this.request(endpoint, { ...options, method: 'PUT', data })
  }

  patch(endpoint, data, options) {
    return this.request(endpoint, { ...options, method: 'PATCH', data })
  }

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

export default new ApiClient()
