import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { BoardMember, Track } from '@/types/api'
import { MemberCard } from './member-card'
import { TrackIcon } from './track-icon'

interface BoardColumnProps {
  track: Track
  title: string
  subtitle: string
  members: BoardMember[]
  draggable: boolean
  highlighted: boolean
  onOpen: (id: string) => void
}

const COLUMN_CARD = 'border-t-4 border-foreground md:h-[calc(100svh-11rem)] md:min-h-96'

export function BoardColumn({ track, title, subtitle, members, draggable, highlighted, onOpen }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: track, disabled: !draggable })

  return (
    <Card className={cn(COLUMN_CARD, highlighted && 'ring-2 ring-foreground/20')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-serif text-xl font-semibold">
          <TrackIcon track={track} className="size-5" aria-hidden />
          {title}
        </CardTitle>
        <CardDescription className="font-serif">{subtitle}</CardDescription>
        <CardAction>
          <Badge variant="outline" className="tabular-nums" aria-label={`Членів: ${members.length}`}>
            {members.length}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-0">
        <ScrollArea className="min-h-0 flex-1">
          <SortableContext id={track} items={members.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} className="flex min-h-24 flex-col gap-2 px-4 pb-1">
              {members.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Поки нікого немає</p>
              ) : (
                members.map((m) => <MemberCard key={m.id} member={m} draggable={draggable} onOpen={onOpen} />)
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function BoardColumnSkeleton() {
  return (
    <Card className={COLUMN_CARD}>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}
