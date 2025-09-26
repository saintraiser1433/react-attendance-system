"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, GraduationCap, UserCheck } from "lucide-react";

interface AvatarFallbackProps {
  image?: string | null;
  name: string;
  role?: "admin" | "teacher" | "student";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({ 
  image, 
  name, 
  role = "student", 
  size = "md", 
  className = "" 
}: AvatarFallbackProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm": return "h-8 w-8 text-xs";
      case "md": return "h-10 w-10 text-sm";
      case "lg": return "h-16 w-16 text-lg";
      case "xl": return "h-24 w-24 text-xl";
      default: return "h-10 w-10 text-sm";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "teacher": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "student": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getRoleIcon = (role: string) => {
    const iconClasses = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : size === "xl" ? "h-8 w-8" : "h-4 w-4";
    
    switch (role) {
      case "admin": return <UserCheck className={iconClasses} />;
      case "teacher": return <GraduationCap className={iconClasses} />;
      case "student": return <User className={iconClasses} />;
      default: return <User className={iconClasses} />;
    }
  };

  return (
    <Avatar className={`${getSizeClasses(size)} ${className}`}>
      <AvatarImage src={image || undefined} alt={name} />
      <AvatarFallback className={getRoleColor(role)}>
        {image ? getInitials(name) : getRoleIcon(role)}
      </AvatarFallback>
    </Avatar>
  );
}
