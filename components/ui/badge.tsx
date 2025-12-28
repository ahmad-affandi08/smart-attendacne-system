import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "border-transparent bg-black text-white": variant === "default",
          "border-transparent bg-green-600 text-white": variant === "success",
          "border-transparent bg-yellow-600 text-white": variant === "warning",
          "border-transparent bg-red-600 text-white": variant === "danger",
          "border-gray-300 text-gray-900": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
