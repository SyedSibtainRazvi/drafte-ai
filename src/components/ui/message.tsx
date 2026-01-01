"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type MessageProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

export type MessageAvatarProps = {
  src?: string
  alt?: string
  fallback?: string
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

export type MessageContentProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

function Message({ children, className, ...props }: MessageProps) {
  return (
    <div
      className={cn("flex w-full gap-3", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function MessageAvatar({ src, alt, fallback, className, ...props }: MessageAvatarProps) {
  return (
    <div className={cn("shrink-0", className)} {...props}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
      </Avatar>
    </div>
  )
}

function MessageContent({ children, className, ...props }: MessageContentProps) {
  return (
    <div
      className={cn("rounded-lg px-3 py-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Message, MessageAvatar, MessageContent }
