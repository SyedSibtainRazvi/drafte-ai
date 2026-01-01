import { cn } from "@/lib/utils";
import type { NavigationDecisions } from "./navigation.types";

export function containerClasses(
  background: NavigationDecisions["background"],
) {
  return cn(
    "relative w-full",
    background === "solid" && "bg-background",
    background === "transparent" && "bg-transparent",
    background === "blur" && "bg-transparent",
  );
}

export function heightClasses(density: NavigationDecisions["density"]) {
  return density === "compact" ? "h-14" : "h-16";
}

export function paddingClasses(density: NavigationDecisions["density"]) {
  return density === "compact" ? "px-3 py-1.5" : "px-4 py-2";
}
