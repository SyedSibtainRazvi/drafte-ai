"use client"

import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

export type MarkdownProps = {
  children: string
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

function Markdown({ children, className, ...props }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        className === "prose-xs" && "text-[12px] leading-relaxed prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-li:my-0",
        className
      )}
      {...props}
    >
      <ReactMarkdown
        components={{
          // Custom components for better styling
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName?.includes("language-")
            return isInline ? (
              <code
                className={cn(
                  "rounded bg-muted px-1.5 py-0.5 text-sm font-mono",
                  codeClassName
                )}
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="rounded-md bg-muted p-4 overflow-x-auto">
              {children}
            </pre>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

export { Markdown }