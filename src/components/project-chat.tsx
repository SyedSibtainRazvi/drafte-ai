"use client";

import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import { Markdown } from "@/components/ui/markdown";
import {
  Message as MessageComponent,
  MessageContent,
} from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { cn } from "@/lib/utils";

import type { DiscoveryOutput } from "@/lib/agents/skills/discovery/schema";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface ProjectChatProps {
  projectId: string;
  onDiscoveryDone?: (discovery: DiscoveryOutput) => void;
}

export function ProjectChat({ projectId, onDiscoveryDone }: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      const res = await fetch(`/api/chat/history?projectId=${projectId}`);
      if (!res.ok) return;
      const data: Message[] = await res.json();
      setMessages(
        data.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      );
    }
    loadHistory();
  }, [projectId]);

  const hasTriggeredRef = useRef(false);

  const streamResponse = useCallback(
    async (userInput: string) => {
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            input: userInput,
            runId: projectId,
          }),
        });

        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let assistantContent = "";
        setMessages((m) => [...m, { role: "assistant", content: "" }]);

        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const evt of parts) {
            if (!evt.startsWith("data: ")) continue;
            const msgBody = evt.replace("data: ", "").trim();
            if (!msgBody) continue;

            try {
              const event = JSON.parse(msgBody);
              if (event.type === "chat_token") {
                assistantContent += event.value;
                setMessages((m) => {
                  const copy = [...m];
                  copy[copy.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return copy;
                });
              } else if (event.type === "discovery_done") {
                // Notify parent component about discovery completion
                if (onDiscoveryDone && event.value) {
                  onDiscoveryDone(event.value);
                }
              } else if (event.type === "chat_done") {
                setLoading(false);
              }
            } catch (e) {
              console.error("Failed to parse SSE", e);
            }
          }
        }
      } catch (error) {
        console.error("Stream error", error);
        setLoading(false);
      }
    },
    [projectId, onDiscoveryDone],
  );

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const currentInput = input;
    setMessages((m) => [...m, { role: "user", content: currentInput }]);
    setInput("");
    await streamResponse(currentInput);
  }

  useEffect(() => {
    if (
      messages.length === 1 &&
      messages[0].role === "user" &&
      !loading &&
      !hasTriggeredRef.current
    ) {
      hasTriggeredRef.current = true;
      streamResponse(messages[0].content);
    }
  }, [messages, loading, streamResponse]);

  return (
    <div className="flex flex-col bg-background/50 border border-border/60 rounded-xl overflow-hidden h-full w-full text-xs">
      <ChatContainerRoot className="flex-1 px-4 py-4">
        <ChatContainerContent className="space-y-4">
          {messages.map((m, i) => {
            const isAssistant = m.role === "assistant";
            return (
              <MessageComponent
                key={`${m.role}-${i}`}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-2 duration-300",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div className="max-w-[90%] sm:max-w-[80%]">
                  <MessageContent
                    className={cn(
                      "shadow-sm transition-all py-2 px-3",
                      isAssistant
                        ? "bg-muted/50 border border-border/60 rounded-2xl rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-2xl rounded-br-none",
                    )}
                  >
                    {isAssistant ? (
                      <Markdown className="prose-xs">{m.content}</Markdown>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {m.content}
                      </p>
                    )}
                  </MessageContent>
                </div>
              </MessageComponent>
            );
          })}
          {loading && messages[messages.length - 1]?.content === "" && (
            <MessageComponent className="justify-start animate-in fade-in duration-300">
              <div className="max-w-[90%] sm:max-w-[80%]">
                <MessageContent className="bg-muted/50 border border-border/60 rounded-2xl rounded-tl-none py-3 px-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="font-medium">Assistant is thinking…</span>
                  </div>
                </MessageContent>
              </div>
            </MessageComponent>
          )}
          <ChatContainerScrollAnchor />
        </ChatContainerContent>
      </ChatContainerRoot>

      <div className="p-4 pt-0">
        <PromptInput
          value={input}
          onValueChange={setInput}
          onSubmit={sendMessage}
          isLoading={loading}
          className="w-full bg-background border border-border/60 rounded-md shadow focus-within:ring-1 focus-within:ring-ring flex items-end pr-2"
        >
          <PromptInputTextarea
            placeholder="Ask something about your project…"
            className="flex-1 text-xs bg-transparent dark:bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <PromptInputActions className="ml-2">
            <PromptInputAction tooltip="Send message">
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="h-7 w-7 rounded-full transition-all active:scale-95 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
}
