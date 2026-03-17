"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  DollarSign,
  Activity,
  Terminal,
  Radio,
  FolderKanban,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

const analyticsItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Cost & Tokens", url: "/cost", icon: DollarSign },
  { title: "Productivity", url: "/productivity", icon: Activity },
]

const sessionItems = [
  { title: "All Sessions", url: "/sessions", icon: Terminal },
  { title: "Live Monitor", url: "/live", icon: Radio },
]

const projectItems = [
  { title: "All Projects", url: "/projects", icon: FolderKanban },
]

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/"
    return pathname.startsWith(url)
  }

  return (
    <Sidebar className="border-r border-[#302C26] bg-sidebar">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4714E] to-[#D4A04E] shadow-lg shadow-[#D4714E]/20">
            <Terminal className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Claude Dashboard</h1>
            <p className="text-[10px] text-[#7A7267]">Usage Analytics</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-[#7A7267]">
            Analytics
          </SidebarGroupLabel>
          <SidebarMenu>
            {analyticsItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  isActive={isActive(item.url)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-[#7A7267]">
            Sessions
          </SidebarGroupLabel>
          <SidebarMenu>
            {sessionItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  isActive={isActive(item.url)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-[#7A7267]">
            Projects
          </SidebarGroupLabel>
          <SidebarMenu>
            {projectItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  isActive={isActive(item.url)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              isActive={isActive("/settings")}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="text-[10px] text-[#564F47] mt-2 px-2">v0.1.0</p>
      </SidebarFooter>
    </Sidebar>
  )
}
