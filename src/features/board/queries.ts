import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, errorMessage } from '@/lib/api'
import type {
  BoardMember,
  BoardResponse,
  MemberDto,
  MemberProbasResponse,
  RequirementState,
  Track,
} from '@/types/api'

export const boardKey = ['board'] as const
export const memberProbasKey = (id: string) => ['member-probas', id] as const

export function useBoard() {
  return useQuery({
    queryKey: boardKey,
    queryFn: () => api.get<BoardResponse>('/board'),
  })
}

export function useMemberProbas(id: string | null) {
  return useQuery({
    queryKey: memberProbasKey(id ?? ''),
    queryFn: () => api.get<MemberProbasResponse>(`/members/${id}/probas`),
    enabled: id !== null,
  })
}

/** Прогрес члена в пробі `track` з кешу панелі проби (якщо вона вже завантажувалась). */
function cachedProgress(
  probas: MemberProbasResponse | undefined,
  track: Track,
): BoardMember['progress'] | undefined {
  return probas?.probas.find((p) => p.track === track)?.progress
}

export interface MoveVars {
  memberId: string
  track: Track
  position: number
  /** Повний новий розклад колонок, як його бачить користувач після drop. */
  columns: Record<string, BoardMember[]>
}

export function useMoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, track, position }: MoveVars) =>
      api.patch<MemberDto>(`/members/${memberId}/move`, { track, position }),
    onMutate: async ({ memberId, track, columns }) => {
      await qc.cancelQueries({ queryKey: boardKey })
      const previous = qc.getQueryData<BoardResponse>(boardKey)
      const probas = qc.getQueryData<MemberProbasResponse>(memberProbasKey(memberId))
      qc.setQueryData<BoardResponse>(boardKey, (old) =>
        old
          ? {
              tracks: old.tracks.map((t) => ({
                ...t,
                members: (columns[t.track] ?? t.members).map((m, idx) =>
                  m.id === memberId
                    ? { ...m, track, position: idx, progress: cachedProgress(probas, track) ?? m.progress }
                    : { ...m, position: idx },
                ),
              })),
            }
          : old,
      )
      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(boardKey, ctx.previous)
      toast.error('Не вдалося перемістити картку', { description: errorMessage(err) })
    },
    onSettled: (_data, _err, { memberId }) => {
      void qc.invalidateQueries({ queryKey: boardKey })
      void qc.invalidateQueries({ queryKey: memberProbasKey(memberId) })
    },
  })
}

export interface ToggleVars {
  memberId: string
  requirementId: string
  completed: boolean
  userName: string
  userId: string
}

export function useToggleRequirement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, requirementId, completed }: ToggleVars) =>
      api.put<RequirementState>(`/members/${memberId}/requirements/${requirementId}`, { completed }),
    onMutate: async ({ memberId, requirementId, completed, userId, userName }) => {
      const key = memberProbasKey(memberId)
      await Promise.all([qc.cancelQueries({ queryKey: key }), qc.cancelQueries({ queryKey: boardKey })])
      const prevProbas = qc.getQueryData<MemberProbasResponse>(key)
      const prevBoard = qc.getQueryData<BoardResponse>(boardKey)

      let affectedTrack: Track | null = null
      let delta = 0
      const next = prevProbas && {
        ...prevProbas,
        probas: prevProbas.probas.map((p) => {
          let pDelta = 0
          const sections = p.sections.map((s) => ({
            ...s,
            requirements: s.requirements.map((r) => {
              if (r.id !== requirementId) return r
              if (!r.isOptional && r.completed !== completed) pDelta = completed ? 1 : -1
              return {
                ...r,
                completed,
                completedAt: completed ? new Date().toISOString() : null,
                completedBy: completed ? { id: userId, name: userName } : null,
              }
            }),
          }))
          if (pDelta !== 0) {
            affectedTrack = p.track
            delta = pDelta
          }
          return { ...p, sections, progress: { ...p.progress, done: p.progress.done + pDelta } }
        }),
      }
      if (next) qc.setQueryData(key, next)

      if (affectedTrack && prevBoard) {
        qc.setQueryData<BoardResponse>(boardKey, {
          tracks: prevBoard.tracks.map((t) => ({
            ...t,
            members: t.members.map((m) =>
              m.id === memberId && m.track === affectedTrack
                ? { ...m, progress: { ...m.progress, done: m.progress.done + delta } }
                : m,
            ),
          })),
        })
      }
      return { prevProbas, prevBoard }
    },
    onError: (err, { memberId }, ctx) => {
      if (ctx?.prevProbas) qc.setQueryData(memberProbasKey(memberId), ctx.prevProbas)
      if (ctx?.prevBoard) qc.setQueryData(boardKey, ctx.prevBoard)
      toast.error('Не вдалося зберегти відмітку', { description: errorMessage(err) })
    },
    onSettled: (_data, _err, { memberId }) => {
      void qc.invalidateQueries({ queryKey: memberProbasKey(memberId) })
      void qc.invalidateQueries({ queryKey: boardKey })
    },
  })
}

export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { firstName: string; lastName: string; track: Track }) =>
      api.post<MemberDto>('/members', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKey }),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; firstName: string; lastName: string }) =>
      api.patch<MemberDto>(`/members/${id}`, body),
    onSuccess: (_data, { id }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: boardKey }),
        qc.invalidateQueries({ queryKey: memberProbasKey(id) }),
      ]),
  })
}

export function useDeleteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    // кеш панелі не чистимо одразу: Sheet ще анімує закриття з цими даними
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKey }),
  })
}
