"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoDataIconProps {
  icon?: LucideIcon;
  title?: string;
  className?: string;
  iconClassName?: string;
}

export function NoDataIcon({ 
  icon: Icon, 
  title, 
  className,
  iconClassName
}: NoDataIconProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <div className={cn("rounded-full bg-muted/50 p-4 mb-4", iconClassName)}>
        {Icon && <Icon className="h-10 w-10 text-muted-foreground" />}
      </div>
      <h3 className="text-base font-medium text-muted-foreground mb-2">{title}</h3>
    </div>
  );
}
