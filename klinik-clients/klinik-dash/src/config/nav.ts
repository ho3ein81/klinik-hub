import type { ComponentType } from 'react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  CalendarClock,
  Stethoscope,
  BadgeCheck,
  Newspaper,
  Settings,
} from 'lucide-react'

export interface NavItem {
  key: string
  href: string
  icon: ComponentType<{ className?: string }>
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'appointments', href: '/appointments', icon: Calendar },
  { key: 'users', href: '/users', icon: UserCog },
  {
    key: 'doctorAvailabilities',
    href: '/doctor-availabilities',
    icon: CalendarClock,
  },
  { key: 'patients', href: '/patients', icon: Users },
  { key: 'services', href: '/services', icon: Stethoscope },
  { key: 'articles', href: '/articles', icon: Newspaper },
  { key: 'specialties', href: '/specialties', icon: BadgeCheck },
  { key: 'settings', href: '/settings', icon: Settings },
]
