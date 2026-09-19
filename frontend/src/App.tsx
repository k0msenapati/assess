import React from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {RouterProvider} from '@tanstack/react-router'
import {AuthProvider} from './context/AuthContext'
import {ThemeProvider} from './context/ThemeContext'
import {router} from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
