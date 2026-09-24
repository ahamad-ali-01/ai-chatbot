"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: string;
  content: string;
};

export function ChatWindow({
  conversationId,
  onCreated,
}: {
  conversationId: string | null;
  onCreated: (id: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const model =
    process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini";

  // Load conversation messages
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    fetch(`/api/conversations/${conversationId}/messages`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load messages.");
        }

        return response.json();
      })
      .then((data) => {
        setMessages(data.messages || []);
      })
      .catch((error) => {
        console.error("[CHAT] Failed to load messages:", error);
      });
  }, [conversationId]);

  async function send() {
    if (!input.trim() || loading) {
      return;
    }

    const content = input.trim();

    let cid = conversationId;

    try {
      // Create conversation if needed
      if (!cid) {
  	const response = await fetch("/api/conversations", {
  	  method: "POST",
   	 headers: {
   	   "Content-Type": "application/json",
   	 },
  	  body: JSON.stringify({}),
 	 });

 	 if (!response.ok) {
 	   throw new Error("Failed to create conversation.");
 	 }

  const data = await response.json();

  const newConversationId: string = data.conversation.id;

  cid = newConversationId;

  onCreated(newConversationId);
}

      // Clear input
      setInput("");

      // Add user message immediately
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };

      setMessages((current) => [
        ...current,
        userMessage,
      ]);

      // Add empty assistant message
      const assistantId = crypto.randomUUID();

      setMessages((current) => [
        ...current,
        {
          id: assistantId,
          role: "assistant",
          content: "",
        },
      ]);

      setLoading(true);

      console.log("[CHAT] Sending message...");
      console.log("[CHAT] Conversation:", cid);
      console.log("[CHAT] Model:", model);

      // Call API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: cid,
          content,
          model,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.error || "AI request failed."
        );
      }

      if (!response.body) {
        throw new Error("AI response stream is unavailable.");
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, {
          stream: true,
        });

        if (!chunk) {
          continue;
        }

        console.log("[CHAT] Received chunk:", chunk);

        assistantText += chunk;

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: assistantText,
                }
              : message
          )
        );
      }

      // Flush decoder
      assistantText += decoder.decode();

      console.log(
        "[CHAT] Final response:",
        assistantText
      );

      if (!assistantText.trim()) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content:
                    "The AI returned an empty response. Check the server terminal for the error.",
                }
              : message
          )
        );
      }
    } catch (error) {
      console.error("[CHAT] Error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong.";

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 border-b flex items-center px-5 font-medium">
        NexaAI
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {!conversationId &&
            messages.length === 0 && (
              <div className="h-full min-h-[50vh] grid place-items-center text-center opacity-60">
                <div>
                  <h2 className="text-2xl font-semibold opacity-100">
                    How can I help?
                  </h2>

                  <p className="mt-2">
                    Ask a question to start a new
                    conversation.
                  </p>
                </div>
              </div>
            )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-[hsl(var(--muted))]"
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-sm dark:prose-invert max-w-none"
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t">
        <div className="max-w-3xl mx-auto flex gap-2 border rounded-2xl p-2">
          <textarea
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Message NexaAI..."
            className="flex-1 resize-none outline-none bg-transparent p-2"
          />

          <button
            disabled={loading || !input.trim()}
            onClick={send}
            className="rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 disabled:opacity-40"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>

        <p className="text-center text-xs opacity-50 mt-2">
          AI responses may be inaccurate. Shift+Enter
          for a new line.
        </p>
      </div>
    </div>
  );
}