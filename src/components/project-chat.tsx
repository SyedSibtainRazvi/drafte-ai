"use client";

import { useEffect, useRef, useState } from "react";

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

  async function sendMessage() {
    if (!input.trim()) return;

    setMessages((m) => [...m, { role: "user", content: input }]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        input,
        runId: projectId, // important: scope chat to project
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
      buffer = parts.pop() || ""; // Keep the last incomplete part in the buffer

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
          }

          if (event.type === "chat_done") {
            setLoading(false);
          }
        } catch (e) {
          console.error("Failed to parse SSE event:", e, "Event content:", evt);
        }
      }
    }
  }

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
