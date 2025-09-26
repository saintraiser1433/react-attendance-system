"use client";

import { Calendar, ChevronUp, Home, Users, GraduationCap, BarChart3, QrCode, FileText, User2, Clock, BookOpen, School, Building2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { GITLogo } from "@/components/ui/git-logo";

const adminNavItems = [
  { title: "Analytics", url: "/", icon: BarChart3 },
  { title: "Teachers", url: "/admin/teachers", icon: Users },
  { title: "Subjects", url: "/admin/subjects", icon: BookOpen },
  { title: "Courses", url: "/admin/courses", icon: School },
  { title: "Academic Years", url: "/admin/academic-years", icon: Calendar },
  { title: "Departments", url: "/admin/departments", icon: GraduationCap },
  { title: "Sections", url: "/admin/sections", icon: Building2 },
  { title: "Schedules", url: "/admin/schedules", icon: Clock },
  { title: "Schedule Overrides", url: "/admin/schedule-overrides", icon: AlertCircle },
];

const teacherNavItems = [
  { title: "Analytics", url: "/", icon: BarChart3 },
  { title: "Students", url: "/teacher/students", icon: Users },
  { title: "Subjects", url: "/teacher/subjects", icon: BookOpen },
  { title: "Enrollments", url: "/teacher/enrollments", icon: GraduationCap },
  { title: "Schedule", url: "/teacher/schedule", icon: Calendar },
];

const studentNavItems = [
  { title: "Profile", url: "/", icon: User2 },
  { title: "My QR Code", url: "/student/qr", icon: QrCode },
  { title: "Attendance", url: "/student/attendance", icon: FileText },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;
  const role = user?.role;

  const getNavItems = () => {
    switch (role) {
      case "admin":
        return adminNavItems;
      case "teacher":
        return teacherNavItems;
      case "student":
        return studentNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <GITLogo size="md" />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">GIT</span>
            <span className="truncate text-xs text-muted-foreground">
              Student Management
            </span>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {role?.charAt(0).toUpperCase() + role?.slice(1)}
          </Badge>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.image} alt={user?.name} />
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
