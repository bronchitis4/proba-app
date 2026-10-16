import { Navigate, Outlet } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from './use-auth'

export function RequireAuth() {
  const { data, isPending } = useMe()

  if (isPending) {
    return (
      <div className="container mx-auto flex flex-col gap-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }
  if (!data) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { data } = useMe()
  if (data?.role !== 'ADMIN') return <Navigate to="/" replace />
  return <Outlet />
}
