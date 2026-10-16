import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMe } from '@/features/auth/use-auth'
import { api, errorMessage } from '@/lib/api'
import type { UserDto } from '@/types/api'
import { UserFormDialog } from './user-form-dialog'

const usersKey = ['users'] as const

const ROLE_LABEL = { ADMIN: 'Адмін', VIEWER: 'Перегляд' } as const

export function UsersPage() {
  const { data: me } = useMe()
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const users = useQuery({ queryKey: usersKey, queryFn: () => api.get<UserDto[]>('/users') })
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('Користувача видалено')
      return qc.invalidateQueries({ queryKey: usersKey })
    },
    onError: (err) => toast.error('Не вдалося видалити', { description: errorMessage(err) }),
  })

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Користувачі</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus />
          Додати користувача
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Доступ до платформи</CardTitle>
          <CardDescription>Адміністратори змінюють дані, переглядачі лише бачать дошку та проби.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.isError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Не вдалося завантажити користувачів</AlertTitle>
              <AlertDescription>{errorMessage(users.error)}</AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ім’я</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead className="w-0 text-right">
                  <span className="sr-only">Дії</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.isPending &&
                Array.from({ length: 3 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {users.data?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.name}
                    {u.id === me?.id && <span className="ml-2 text-muted-foreground">(ви)</span>}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{ROLE_LABEL[u.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.id !== me?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Видалити ${u.name}`}>
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Видалити користувача {u.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Користувач втратить доступ до платформи. Його відмітки в пробах залишаться без автора.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Скасувати</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={() => remove.mutate(u.id)}>
                              <Trash2 />
                              Видалити
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserFormDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  )
}
