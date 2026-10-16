import { AlertCircle, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMe } from '@/features/auth/use-auth'
import { MemberFormDialog } from '@/features/board/member-form-dialog'
import { useDeleteMember, useMemberProbas, useToggleRequirement } from '@/features/board/queries'
import { errorMessage } from '@/lib/api'
import { TrackIcon } from '@/features/board/track-icon'
import { fullName, percent } from '@/lib/tracks'
import type { Track } from '@/types/api'
import { ProbaSectionList } from './proba-section-list'

interface ProbaSheetProps {
  memberId: string | null
  open: boolean
  tracks: { track: Track; title: string }[]
  onOpenChange: (open: boolean) => void
}

export function ProbaSheet({ memberId, open, tracks, onOpenChange }: ProbaSheetProps) {
  const { data: me } = useMe()
  const isAdmin = me?.role === 'ADMIN'
  const query = useMemberProbas(memberId)
  const toggle = useToggleRequirement()
  const remove = useDeleteMember()
  const [editOpen, setEditOpen] = useState(false)

  const data = query.data
  const member = data?.member
  const current = data?.probas.find((p) => p.track === member?.track)

  const onToggle = (requirementId: string, completed: boolean) => {
    if (!member || !me) return
    toggle.mutate({ memberId: member.id, requirementId, completed, userId: me.id, userName: me.name })
  }

  const onDelete = () => {
    if (!member) return
    remove.mutate(member.id, {
      onSuccess: () => {
        toast.success(`${fullName(member)} видалено`)
        onOpenChange(false)
      },
      onError: (err) => toast.error('Не вдалося видалити', { description: errorMessage(err) }),
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader className="gap-3 border-b">
          {member && current ? (
            <>
              <SheetTitle className="pr-8 font-serif text-2xl font-semibold">{fullName(member)}</SheetTitle>
              <SheetDescription className="sr-only">Прогрес проби та відмітки виконаних точок</SheetDescription>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  <TrackIcon track={member.track} />
                  {current.title}
                </Badge>
                <span className="text-sm text-muted-foreground">{current.subtitle}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Progress value={percent(current.progress.done, current.progress.total)} />
                <span className="text-sm text-muted-foreground">
                  виконано <span className="tabular-nums">{current.progress.done}</span> з{' '}
                  <span className="tabular-nums">{current.progress.total}</span>
                </span>
              </div>
            </>
          ) : (
            <>
              <SheetTitle className="sr-only">Панель проби</SheetTitle>
              <SheetDescription className="sr-only">Завантаження</SheetDescription>
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-2 w-full" />
            </>
          )}
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4">
            {query.isError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{errorMessage(query.error)}</AlertDescription>
              </Alert>
            )}
            {query.isPending && (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-8 w-full" />
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
            {data && member && (
              <Tabs key={`${member.id}:${member.track}`} defaultValue={member.track}>
                <TabsList className="w-full">
                  {data.probas.map((p) => {
                    return (
                      <Tooltip key={p.track}>
                        <TooltipTrigger asChild>
                          <TabsTrigger value={p.track}>
                            <TrackIcon track={p.track} />
                            <span className="hidden sm:inline">{p.title}</span>
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          {p.title}: {p.progress.done} з {p.progress.total}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </TabsList>
                {data.probas.map((p) => (
                  <TabsContent key={p.track} value={p.track} className="flex flex-col gap-2 pt-2">
                    {p.track !== member.track && (
                      <p className="text-sm text-muted-foreground">
                        {p.subtitle} · збережений прогрес: {p.progress.done} з {p.progress.total}
                      </p>
                    )}
                    <ProbaSectionList proba={p} canEdit={isAdmin} onToggle={onToggle} />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </ScrollArea>

        {isAdmin && member && (
          <>
            <Separator />
            <SheetFooter className="flex-row justify-end">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil />
                Редагувати
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 />
                    Видалити
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Видалити {fullName(member)}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Буде видалено картку і всі відмітки по всіх пробах. Цю дію не можна скасувати.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={onDelete} disabled={remove.isPending}>
                      <Trash2 />
                      Видалити
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SheetFooter>
            <MemberFormDialog open={editOpen} onOpenChange={setEditOpen} tracks={tracks} member={member} />
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
