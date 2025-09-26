"use client";

import { Menu, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { GITLogo } from "@/components/ui/git-logo";

export function MobileNav() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="container flex h-14 items-center px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <AppSidebar />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2 flex-1">
          <GITLogo size="sm" />
          <span className="font-semibold">GIT</span>
          {role && (
            <Badge variant="secondary" className="ml-2">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          )}
        </div>
        
        <ThemeToggle />
      </div>
    </header>
  );
}
