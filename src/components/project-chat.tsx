"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ProjectChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Reusable streaming function
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
                // Handle discovery results (e.g. log them or update UI)
                console.log("Discovery complete:", event.value);
                // If there was no token stream, we'll get the fallback message
                // from the chat history when things finish or from a final token.
              } else if (event.type === "chat_done") {
                setLoading(false);
                // Re-fetch history to get the finalized assistant message if needed
                // or just rely on the stream.
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
    [projectId],
  );

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const currentInput = input;
    setMessages((m) => [...m, { role: "user", content: currentInput }]);
    setInput("");
    await streamResponse(currentInput);
  }

  // Auto-trigger if history only contains the initial prompt
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

  // Auto-scroll to bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: We need to trigger scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col border rounded-md h-[400px]">
      <div
        ref={scrollRef}
        id="chat-messages"
        className="flex-1 overflow-auto p-3 space-y-2 text-sm"
      >
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`}>
            <strong className="capitalize">{m.role}:</strong> {m.content}
          </div>
        ))}
        {loading && (
          <div className="text-muted-foreground animate-pulse">
            Assistant is thinking…
          </div>
        )}
      </div>

      <div className="border-t p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Ask something about your project…"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={loading}
          className="border rounded px-3"
        >
          Send
        </button>
      </div>
    </div>
  );
}
