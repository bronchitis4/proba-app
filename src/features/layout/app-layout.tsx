import { Outlet } from 'react-router-dom'
import { AppHeader } from './app-header'

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="container mx-auto flex flex-1 flex-col gap-4 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
