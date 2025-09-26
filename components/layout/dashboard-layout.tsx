"use client";

import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];
    
    if (segments.length === 0) {
      return [{ title: "Dashboard", href: "/" }];
    }
    
    breadcrumbs.push({ title: "Dashboard", href: "/" });
    
    let currentPath = "";
    for (let i = 0; i < segments.length; i++) {
      currentPath += `/${segments[i]}`;
      const isLast = i === segments.length - 1;
      
      let title = segments[i].charAt(0).toUpperCase() + segments[i].slice(1);
      
      // Customize titles
      if (title === "Qr-generate") title = "Generate QR";
      if (title === "Academic-years") title = "Academic Years";
      
      breadcrumbs.push({
        title,
        href: isLast ? undefined : currentPath,
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <MobileNav />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.title}>
                      <BreadcrumbItem className="hidden md:block">
                        {crumb.href ? (
                          <BreadcrumbLink href={crumb.href}>
                            {crumb.title}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto px-4">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
