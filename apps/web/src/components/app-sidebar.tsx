"use client";

import {
  Github,
  Home,
  Inbox,
  Search,
  Activity,
  Building2,
  Settings,
  FolderGit2,
} from "lucide-react";
import type * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    shortcut: "g h",
  },
  {
    title: "Inbox",
    url: "/inbox",
    icon: Inbox,
    shortcut: "g i",
  },
  {
    title: "Repos",
    url: "/repos",
    icon: FolderGit2,
    shortcut: "g r",
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
    shortcut: "g s",
  },
  {
    title: "Activity",
    url: "/activity",
    icon: Activity,
    shortcut: "g a",
  },
  {
    title: "Orgs",
    url: "/orgs",
    icon: Building2,
    shortcut: "g o",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          asChild
          tooltip="Octomod"
        >
          <Link to="/">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Github className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Octomod</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-1 items-center">
        <SidebarMenu className="flex flex-col gap-1 items-center">
          {navItems.map((item) => {
            const isActive = currentPath === item.url || (item.url === "/" && currentPath === "/");
            return (
              <SidebarMenuItem key={item.title} className="w-min">
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                >
                  <Link to={item.url}>
                    <item.icon />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              isActive={currentPath === "/settings"}
            >
              <Link to="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
