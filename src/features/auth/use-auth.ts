import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import type { UserDto } from '@/types/api'

export const meQueryKey = ['me'] as const

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async (): Promise<UserDto | null> => {
      try {
        return await api.get<UserDto>('/auth/me')
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null
        throw err
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useIsAdmin(): boolean {
  const { data } = useMe()
  return data?.role === 'ADMIN'
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { email: string; password: string }) => api.post<UserDto>('/auth/login', body),
    onSuccess: (user) => {
      qc.clear()
      qc.setQueryData(meQueryKey, user)
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSettled: () => {
      qc.clear()
      qc.setQueryData(meQueryKey, null)
    },
  })
}
