import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { fullName, percent } from '@/lib/tracks'
import type { BoardMember } from '@/types/api'

interface MemberCardViewProps extends React.ComponentProps<typeof Card> {
  member: BoardMember
}

/** Компактна картка: «Прізвище Ім'я» і тонкий прогрес під ним. */
export function MemberCardView({ member, className, ...props }: MemberCardViewProps) {
  const { done, total } = member.progress
  return (
    <Card size="sm" className={cn('gap-0 py-2.5', className)} {...props}>
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium">{fullName(member)}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {done} / {total}
          </span>
        </div>
        <Progress value={percent(done, total)} className="h-1.5" aria-label={`Виконано ${done} з ${total}`} />
      </CardContent>
    </Card>
  )
}

interface MemberCardProps {
  member: BoardMember
  draggable: boolean
  onOpen: (id: string) => void
}

export function MemberCard({ member, draggable, onOpen }: MemberCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.id,
    data: { track: member.track },
    disabled: !draggable,
  })

  return (
    <MemberCardView
      ref={setNodeRef}
      member={member}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      role="button"
      tabIndex={0}
      aria-roledescription={draggable ? 'картка, яку можна перетягнути' : undefined}
      onClick={() => onOpen(member.id)}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onOpen(member.id)
          return
        }
        if (draggable) listeners?.onKeyDown?.(e)
      }}
      className={cn(
        'touch-manipulation outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        isDragging && 'opacity-40',
      )}
      // dnd-kit передає позицію лише через transform — це єдиний допустимий inline style
      style={{ transform: CSS.Transform.toString(transform), transition }}
    />
  )
}
