import React from 'react'
import {Link, useNavigate, useRouterState} from '@tanstack/react-router'
import {useAuth} from '../context/AuthContext'
import {useTheme} from '../context/ThemeContext'
import {
  FileCheck2,
  BookOpen,
  PlusCircle,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Sun,
  Moon,
  LogOut
} from 'lucide-react'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Separator} from '@/components/ui/separator'
import {Button} from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({children}) => {
  const {user, role, logout} = useAuth()
  const {theme, toggleTheme} = useTheme()
  const navigate = useNavigate()
  const currentPath = useRouterState({select: s => s.location.pathname})

  const handleLogout = () => {
    logout()
    navigate({to: '/'})
  }

  const navItems = [
    {
      label: 'Assignments',
      path: '/',
      icon: BookOpen,
      show: true
    },
    {
      label: 'My Submissions',
      path: '/my-submissions',
      icon: CheckCircle2,
      show: role === 'student'
    },
    {
      label: 'New Assignment',
      path: '/create-assignment',
      icon: PlusCircle,
      show: role === 'professor' || role === 'admin'
    },
    {
      label: 'Grading Analytics',
      path: '/analytics',
      icon: BarChart3,
      show: role === 'professor' || role === 'admin'
    },
    {
      label: 'Admin Console',
      path: '/admin',
      icon: ShieldCheck,
      show: role === 'admin'
    }
  ].filter(item => item.show)

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  const getPageTitle = () => {
    if (currentPath === '/') return 'Assignments'
    if (currentPath.startsWith('/assignments/')) return 'Assignment Overview'
    if (currentPath.startsWith('/submit/')) return 'Submit Work'
    if (currentPath.startsWith('/review/')) return 'Grading Studio'
    if (currentPath.startsWith('/feedback/')) return 'Grading Report'
    if (currentPath === '/my-submissions') return 'My Submissions'
    if (currentPath === '/create-assignment') return 'Create Assignment'
    if (currentPath === '/analytics') return 'Grading Analytics'
    if (currentPath === '/admin') return 'Admin Console'
    return 'Workspace'
  }

  return (
    <SidebarProvider defaultOpen={true} className="h-svh max-h-svh overflow-hidden">
      <Sidebar collapsible="icon" variant="sidebar">
        {/* Sidebar Header: Brand Logo & Assess Title */}
        <SidebarHeader className="h-14 border-b border-sidebar-border justify-center p-2 group-data-[collapsible=icon]:p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-transparent active:bg-transparent group-data-[collapsible=icon]:!p-0"
              >
                <Link to="/" className="flex items-center gap-2.5">
                  <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-xs">
                    <FileCheck2 className="size-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden [[data-collapsible=icon]_&]:hidden">
                    <span className="font-bold text-base tracking-tight text-sidebar-foreground">
                      Assess
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Sidebar Content: Navigation Menu */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 group-data-[collapsible=icon]:hidden [[data-collapsible=icon]_&]:hidden">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map(item => {
                  const active = isActive(item.path)
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className="font-medium text-xs"
                      >
                        <Link to={item.path}>
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="group-data-[collapsible=icon]:hidden [[data-collapsible=icon]_&]:hidden">
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Sidebar Footer: Theme Toggle & Consolidated User Account Menu */}
        <SidebarFooter className="border-t border-sidebar-border p-2 space-y-1">
          <SidebarMenu>
            {/* Theme Toggle Button */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleTheme}
                tooltip={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                <span className="group-data-[collapsible=icon]:hidden [[data-collapsible=icon]_&]:hidden">
                  {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* User Profile Card & Direct Sign Out */}
            {user && (
              <>
                <SidebarMenuItem>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-sidebar-accent/50 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:justify-center">
                    <Avatar className="h-8 w-8 rounded-lg text-xs bg-primary/20 text-primary shrink-0">
                      <AvatarFallback className="rounded-lg font-semibold">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden [[data-collapsible=icon]_&]:hidden">
                      <span className="truncate font-semibold text-foreground">
                        {user.username}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground capitalize">
                        {role}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      title="Sign Out"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer group-data-[collapsible=icon]:hidden [[data-collapsible=icon]_&]:hidden transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </SidebarMenuItem>

                {/* Direct Sign Out when Sidebar is Collapsed */}
                <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block [[data-collapsible=icon]_&]:block">
                  <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip={`Sign Out (${user.username})`}
                    className="cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span className="hidden">Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Main Content Inset with Fixed Header and Scrollable Content Only */}
      <SidebarInset className="h-svh max-h-svh overflow-hidden flex flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/60 px-4 transition-[width,height] ease-linear">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-sm font-semibold text-foreground">{getPageTitle()}</h1>
          </div>
        </header>

        {/* Scrollable Content Container (Scrollbar is only for content) */}
        <div className="flex-1 overflow-y-auto">
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
