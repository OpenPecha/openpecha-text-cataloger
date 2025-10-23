import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './tailwind.css'
import App from './App.tsx'
import { UserbackProvider } from './context/UserbackProvider.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})
console.log('hello')
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
    <UserbackProvider>

      <BrowserRouter>
        <App />
      </BrowserRouter>
      </UserbackProvider>
    </QueryClientProvider>
  </StrictMode>,
)
