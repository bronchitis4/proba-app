import { LogOut, Monitor, Moon, Sun, SunMoon, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '@/components/theme-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogout, useMe } from '@/features/auth/use-auth'

const ROLE_LABEL = { ADMIN: 'Адмін', VIEWER: 'Перегляд' } as const

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function AppHeader() {
  const { data: me } = useMe()
  const { theme, setTheme } = useTheme()
  const logout = useLogout()
  const navigate = useNavigate()

  if (!me) return null

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <Link to="/" className="text-lg font-semibold">
          Пластовий гурток
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Меню користувача">
              <Avatar>
                <AvatarFallback>{initials(me.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="truncate">{me.name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{me.email}</span>
              <Badge variant={me.role === 'ADMIN' ? 'default' : 'secondary'}>{ROLE_LABEL[me.role]}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <SunMoon />
                  Тема
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}
                  >
                    <DropdownMenuRadioItem value="light">
                      <Sun />
                      Світла
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon />
                      Темна
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Monitor />
                      Системна
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {me.role === 'ADMIN' && (
                <DropdownMenuItem asChild>
                  <Link to="/users">
                    <Users />
                    Користувачі
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })}
            >
              <LogOut />
              Вийти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
