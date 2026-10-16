import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider, useTheme } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LoginPage } from '@/features/auth/login-page'
import { RequireAdmin, RequireAuth } from '@/features/auth/require-auth'
import { meQueryKey } from '@/features/auth/use-auth'
import { BoardPage } from '@/features/board/board-page'
import { AppLayout } from '@/features/layout/app-layout'
import { UsersPage } from '@/features/users/users-page'
import { ApiError } from '@/lib/api'

// Якщо сесія закінчилась — будь-який 401 повертає на сторінку входу
function onUnauthorized(err: unknown) {
  if (err instanceof ApiError && err.status === 401) queryClient.setQueryData(meQueryKey, null)
}

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onUnauthorized }),
  mutationCache: new MutationCache({ onError: onUnauthorized }),
  defaultOptions: {
    queries: { retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2 },
  },
})

function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} position="bottom-right" />
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="plast-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route index element={<BoardPage />} />
                  <Route element={<RequireAdmin />}>
                    <Route path="/users" element={<UsersPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <ThemedToaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
