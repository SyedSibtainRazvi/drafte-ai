import { cn } from "@/lib/utils";
import type { FooterDecisions } from "./footer.types";

export function containerClasses() {
  return cn("w-full border-t bg-background");
}

export function paddingClasses(density: FooterDecisions["density"]) {
  return density === "compact" ? "py-4" : "py-8";
}
