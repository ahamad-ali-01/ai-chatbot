import { cn } from "@/lib/utils";
import * as React from "react";
export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={cn("inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium border bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] disabled:opacity-50", className)} {...props} />; }
