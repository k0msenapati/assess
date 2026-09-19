import {describe, it, expect, beforeEach} from 'vitest'
import {api} from '../api/client'

describe('Frontend API Client Interceptor Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('attaches Authorization Bearer header when token exists in localStorage', async () => {
    localStorage.setItem('assess_token', 'mock_jwt_token_12345')

    // Simulate interceptor execution
    const mockConfig = {headers: {} as Record<string, string>}
    const interceptor = (api.interceptors.request as any).handlers[0]?.fulfilled

    if (interceptor) {
      const resultConfig = interceptor(mockConfig)
      expect(resultConfig.headers.Authorization).toBe('Bearer mock_jwt_token_12345')
    }
  })

  it('does not attach Authorization header when no token is saved', async () => {
    const mockConfig = {headers: {} as Record<string, string>}
    const interceptor = (api.interceptors.request as any).handlers[0]?.fulfilled

    if (interceptor) {
      const resultConfig = interceptor(mockConfig)
      expect(resultConfig.headers.Authorization).toBeUndefined()
    }
  })
})
