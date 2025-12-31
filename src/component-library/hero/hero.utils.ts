import { cn } from "@/lib/utils";
import type { HeroDecisions } from "./hero.types";

export function containerClasses(background: HeroDecisions["background"]) {
  return cn(
    "relative w-full overflow-hidden transition-colors duration-500",
    background === "solid" && "bg-background",
    background === "transparent" && "bg-transparent",
  );
}

export function paddingClasses(density: HeroDecisions["density"]) {
  return cn(
    density === "compact"
      ? "py-12 md:py-20 lg:py-24"
      : "py-20 md:py-32 lg:py-40",
    "px-4 md:px-6",
  );
}

export function alignmentClasses(alignment: HeroDecisions["alignment"]) {
  return cn(
    "flex flex-col w-full",
    alignment === "center"
      ? "items-center text-center"
      : alignment === "right"
        ? "items-end text-right"
        : "items-start text-left",
  );
}

export function textClasses() {
  return cn("space-y-6 md:space-y-8", "text-foreground");
}

export function splitLayoutClasses() {
  return cn("grid lg:grid-cols-2 gap-12 lg:gap-20 items-center");
}
