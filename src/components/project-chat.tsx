"use client";

import { useEffect, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ProjectChat({ projectId }: { projectId: string }) {
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

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const events = chunk.split("\n\n");

      for (const evt of events) {
        if (!evt.startsWith("data: ")) continue;
        const event = JSON.parse(evt.replace("data: ", ""));

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
      }
    }
  }

  return (
    <div className="flex flex-col border rounded-md h-[300px]">
      <div className="flex-1 overflow-auto p-3 space-y-2 text-sm">
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
