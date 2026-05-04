import axios from 'axios'

const LOCAL_API_CANDIDATES = [
  'http://127.0.0.1:5002/api',
  'http://localhost:5002/api',
  'http://127.0.0.1:5003/api',
  'http://localhost:5003/api',
]

const normalizeApiUrl = (url: string) => (url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`)
const unique = (urls: string[]) => [...new Set(urls)]

const getBaseURLs = () => {
  const envURL = import.meta.env.VITE_API_URL
  if (envURL) {
    const normalizedEnvUrl = normalizeApiUrl(envURL)
    return import.meta.env.DEV ? unique([normalizedEnvUrl, ...LOCAL_API_CANDIDATES]) : [normalizedEnvUrl]
  }

  return LOCAL_API_CANDIDATES
}

const BASE_URLS = getBaseURLs()

const api = axios.create({
  baseURL: BASE_URLS[0],
  headers: { 'Content-Type': 'application/json' },
})

let handlingUnauthorized = false

const isAuthRequest = (url?: string) => {
  if (!url) return false
  return url.includes('/auth/login') || url.includes('/auth/register')
}

const shouldRetryWithNextBaseUrl = (error: {
  config?: { method?: string; __baseUrlRetryIndex?: number }
  request?: unknown
  response?: { status?: number; data?: { message?: string } }
}) => {
  const method = error.config?.method?.toLowerCase()
  if (method && method !== 'get') {
    return false
  }

  if (error.request && !error.response) {
    return true
  }

  const status = error.response?.status
  if (status !== 404 && status !== 405 && status !== 501) {
    return false
  }

  const message = error.response?.data?.message?.toLowerCase() ?? ''
  return message.includes('not found') || message.includes('route') || message.includes('cannot')
}

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const requestConfig = err.config as (typeof err.config & { __baseUrlRetryIndex?: number }) | undefined

    if (requestConfig && shouldRetryWithNextBaseUrl(err)) {
      const currentRetryIndex = requestConfig.__baseUrlRetryIndex ?? 0
      const nextBaseURL = BASE_URLS[currentRetryIndex + 1]

      if (nextBaseURL) {
        requestConfig.__baseUrlRetryIndex = currentRetryIndex + 1
        requestConfig.baseURL = nextBaseURL
        api.defaults.baseURL = nextBaseURL
        return api.request(requestConfig)
      }
    }

    if (err.response?.status === 401 && !handlingUnauthorized && !isAuthRequest(requestConfig?.url)) {
      handlingUnauthorized = true
      localStorage.removeItem('token')
      localStorage.removeItem('auth-store')

      if (window.location.pathname !== '/login') {
        window.location.replace('/login')
      }

      window.setTimeout(() => {
        handlingUnauthorized = false
      }, 250)
    }

    if (
      err.response?.status === 403 &&
      typeof err.response?.data?.message === 'string' &&
      err.response.data.message.toLowerCase().includes('temporarily blocked') &&
      !handlingUnauthorized
    ) {
      handlingUnauthorized = true

      if (window.location.pathname !== '/account-blocked') {
        window.location.replace('/account-blocked')
      }

      window.setTimeout(() => {
        handlingUnauthorized = false
      }, 250)
    }
    return Promise.reject(err)
  }
)

export default api
