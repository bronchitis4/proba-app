import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { errorMessage } from '@/lib/api'
import { TRACKS, type MemberDto, type Track } from '@/types/api'
import { useCreateMember, useUpdateMember } from './queries'
import { TrackIcon } from './track-icon'

const schema = z.object({
  lastName: z.string().trim().min(1, 'Вкажіть прізвище').max(100),
  firstName: z.string().trim().min(1, "Вкажіть ім'я").max(100),
  track: z.enum(TRACKS, 'Оберіть пробу'),
})

type Values = z.infer<typeof schema>

interface MemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tracks: { track: Track; title: string }[]
  /** Якщо передано — режим редагування (проба змінюється перетягуванням). */
  member?: MemberDto
}

export function MemberFormDialog({ open, onOpenChange, tracks, member }: MemberFormDialogProps) {
  const create = useCreateMember()
  const update = useUpdateMember()
  const isEdit = member !== undefined

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', track: tracks[0]?.track ?? 'PRYKHYLNYK' },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      firstName: member?.firstName ?? '',
      lastName: member?.lastName ?? '',
      track: member?.track ?? tracks[0]?.track ?? 'PRYKHYLNYK',
    })
  }, [open, member, tracks, form])

  const onSubmit = async (values: Values) => {
    try {
      if (member) {
        await update.mutateAsync({ id: member.id, firstName: values.firstName, lastName: values.lastName })
        toast.success('Зміни збережено')
      } else {
        await create.mutateAsync(values)
        toast.success('Члена гуртка додано')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Редагувати члена гуртка' : 'Додати члена гуртка'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Змініть прізвище або ім’я.' : 'Новий член з’явиться в кінці колонки обраної проби.'}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="member-last-name">Прізвище</FieldLabel>
                  <Input {...field} id="member-last-name" autoComplete="off" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="member-first-name">Ім’я</FieldLabel>
                  <Input {...field} id="member-first-name" autoComplete="off" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {!isEdit && (
              <Controller
                name="track"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="member-track">Проба</FieldLabel>
                    <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="member-track" className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Оберіть пробу" />
                      </SelectTrigger>
                      <SelectContent>
                        {tracks.map((t) => (
                          <SelectItem key={t.track} value={t.track}>
                            <TrackIcon track={t.track} />
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Скасувати
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? 'Зберегти' : 'Додати'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
