"use client";

import * as Icons from "lucide-react";
import { Menu } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { cn } from "@/lib/utils";
import type { NavigationProps } from "./navigation.types";
import {
  containerClasses,
  heightClasses,
  paddingClasses,
} from "./navigation.utils";

export default function Navigation({
  alignment,
  density,
  background,
  primaryLinks,
  onNavigate,
  interactionMode = "interactive",
}: NavigationProps) {
  const [open, setOpen] = useState(false);
  const isPreview = interactionMode === "preview";

  const Icon = (name?: string) => {
    if (!name) return null;
    const IconComponent = (
      Icons as unknown as Record<
        string,
        React.ComponentType<{ className?: string }>
      >
    )[name];
    return IconComponent ?? null;
  };

  const handleLinkClick = (
    e: React.MouseEvent,
    link: { id: string; href: string; label: string },
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onNavigate?.(link);
  };

  const isCenter = alignment === "center";
  const isRight = alignment === "right";

  return (
    <nav className={containerClasses(background)}>
      <div
        className={cn(
          "flex items-center",
          background === "blur"
            ? "mx-auto max-w-fit rounded-full border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/5 p-2 shadow-2xl backdrop-blur-xl"
            : "mx-auto max-w-7xl px-4",
          isCenter
            ? "justify-center"
            : isRight
              ? "justify-end"
              : "justify-start",
          heightClasses(density),
        )}
      >
        {/* Desktop Navigation */}
        <NavigationMenu className="hidden sm:flex">
          <NavigationMenuList>
            {primaryLinks.map((item) => {
              const IconComp = Icon(item.icon);
              const linkId =
                item.id || item.label.toLowerCase().replace(/\s+/g, "-");
              const link = { id: linkId, href: item.href, label: item.label };
              return (
                <NavigationMenuItem key={item.label}>
                  <NavigationMenuLink
                    href={item.href}
                    onClick={(e) => handleLinkClick(e, link)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
                      paddingClasses(density),
                      "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    {IconComp && <IconComp className="h-4 w-4" />}
                    {item.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Menu */}
        <Sheet
          open={isPreview ? false : open}
          onOpenChange={isPreview ? undefined : setOpen}
        >
          <SheetTrigger asChild className="sm:hidden" disabled={isPreview}>
            <Button
              size="icon"
              variant="ghost"
              disabled={isPreview}
              className={cn(isPreview && "pointer-events-none opacity-50")}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72">
            <div className="flex flex-col gap-2">
              {primaryLinks.map((item) => {
                const IconComp = Icon(item.icon);
                const linkId =
                  item.id || item.label.toLowerCase().replace(/\s+/g, "-");
                const link = { id: linkId, href: item.href, label: item.label };
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="justify-start gap-2"
                    asChild
                  >
                    <a
                      href={item.href}
                      onClick={(e) => handleLinkClick(e, link)}
                    >
                      {IconComp && <IconComp className="h-4 w-4" />}
                      {item.label}
                    </a>
                  </Button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
