import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { AlertCircle, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useIsAdmin } from '@/features/auth/use-auth'
import { ProbaSheet } from '@/features/proba/proba-sheet'
import { errorMessage } from '@/lib/api'
import type { BoardMember, BoardResponse, Track } from '@/types/api'
import { BoardColumn, BoardColumnSkeleton } from './board-column'
import { MemberCardView } from './member-card'
import { MemberFormDialog } from './member-form-dialog'
import { useBoard, useMoveMember } from './queries'

type Columns = Record<string, BoardMember[]>

function toColumns(board: BoardResponse): Columns {
  return Object.fromEntries(board.tracks.map((t) => [t.track, t.members]))
}

function findContainer(columns: Columns, id: UniqueIdentifier): string | undefined {
  if (id in columns) return String(id)
  return Object.keys(columns).find((k) => columns[k].some((m) => m.id === id))
}

export function BoardPage() {
  const isAdmin = useIsAdmin()
  const board = useBoard()
  const move = useMoveMember()

  const [dragColumns, setDragColumns] = useState<Columns | null>(null)
  const [active, setActive] = useState<BoardMember | null>(null)
  const [origin, setOrigin] = useState<{ track: string; index: number } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter відкриває панель проби, тож перетягування з клавіатури — лише пробілом
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  )

  const serverColumns = useMemo(() => (board.data ? toColumns(board.data) : {}), [board.data])
  const columns = dragColumns ?? serverColumns
  const tracks = useMemo(
    () => board.data?.tracks.map((t) => ({ track: t.track, title: t.title })) ?? [],
    [board.data],
  )

  const openMember = (id: string) => {
    setSelectedId(id)
    setSheetOpen(true)
  }

  const resetDrag = () => {
    setDragColumns(null)
    setActive(null)
    setOrigin(null)
  }

  const onDragStart = ({ active: a }: DragStartEvent) => {
    const track = findContainer(serverColumns, a.id)
    if (!track) return
    const index = serverColumns[track].findIndex((m) => m.id === a.id)
    setDragColumns(serverColumns)
    setActive(serverColumns[track][index] ?? null)
    setOrigin({ track, index })
  }

  // Переносимо картку між колонками «наживо», щоб цільова колонка розсувалась під неї
  const onDragOver = ({ active: a, over }: DragOverEvent) => {
    if (!over) return
    setDragColumns((prev) => {
      if (!prev) return prev
      const from = findContainer(prev, a.id)
      const to = findContainer(prev, over.id)
      if (!from || !to || from === to) return prev

      const fromItems = prev[from]
      const toItems = prev[to]
      const moving = fromItems.find((m) => m.id === a.id)
      if (!moving) return prev

      const overIndex = toItems.findIndex((m) => m.id === over.id)
      const isBelow =
        over.rect && a.rect.current.translated && a.rect.current.translated.top > over.rect.top + over.rect.height / 2
      const insertAt = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : toItems.length

      return {
        ...prev,
        [from]: fromItems.filter((m) => m.id !== a.id),
        [to]: [...toItems.slice(0, insertAt), { ...moving, track: to as Track }, ...toItems.slice(insertAt)],
      }
    })
  }

  const onDragEnd = ({ active: a, over }: DragEndEvent) => {
    const current = dragColumns
    const start = origin
    if (!current || !start || !over) {
      resetDrag()
      return
    }
    const track = findContainer(current, a.id)
    const overTrack = findContainer(current, over.id)
    if (!track || track !== overTrack) {
      resetDrag()
      return
    }

    let items = current[track]
    const fromIndex = items.findIndex((m) => m.id === a.id)
    const overIndex = items.findIndex((m) => m.id === over.id)
    if (overIndex >= 0 && overIndex !== fromIndex) items = arrayMove(items, fromIndex, overIndex)
    const position = items.findIndex((m) => m.id === a.id)
    const finalColumns = { ...current, [track]: items }

    if (track !== start.track || position !== start.index) {
      move.mutate({ memberId: String(a.id), track: track as Track, position, columns: finalColumns })
    }
    resetDrag()
  }

  const activeTrack = active ? findContainer(columns, active.id) : undefined

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Проби гуртка</h1>
        {isAdmin && (
          <Button onClick={() => setAddOpen(true)} disabled={!board.data}>
            <Plus />
            Додати члена
          </Button>
        )}
      </div>

      {board.isError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Не вдалося завантажити дошку</AlertTitle>
          <AlertDescription>{errorMessage(board.error)}</AlertDescription>
        </Alert>
      )}

      {board.isPending ? (
        <div className="grid gap-4 md:grid-cols-3">
          <BoardColumnSkeleton />
          <BoardColumnSkeleton />
          <BoardColumnSkeleton />
        </div>
      ) : (
        board.data && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={resetDrag}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {board.data.tracks.map((t) => (
                <BoardColumn
                  key={t.track}
                  track={t.track}
                  title={t.title}
                  subtitle={t.subtitle}
                  members={columns[t.track] ?? []}
                  draggable={isAdmin}
                  highlighted={active !== null && activeTrack === t.track}
                  onOpen={openMember}
                />
              ))}
            </div>
            <DragOverlay>
              {active ? <MemberCardView member={active} className="cursor-grabbing" /> : null}
            </DragOverlay>
          </DndContext>
        )
      )}

      <ProbaSheet
        memberId={selectedId}
        open={sheetOpen}
        tracks={tracks}
        onOpenChange={setSheetOpen}
      />

      {isAdmin && <MemberFormDialog open={addOpen} onOpenChange={setAddOpen} tracks={tracks} />}
    </>
  )
}
