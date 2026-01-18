

import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

export default function ChatApp() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputAtBottom, setInputAtBottom] = useState(false);

  const [chats, setChats] = useState([
    { role: "assistant", content: "Hi 👋 I am shakil assistent. Ask me anything!" },
  ]);

  const bottomRef = useRef(null);

  // ✅ abort controller ref (for STOP)
  const abortRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, loading]);

  const stopGenerating = () => {
    abortRef.current?.abort(); // ✅ stops fetch + stream
    abortRef.current = null;
    setLoading(false);
  };

  const sendMessage = async () => {
  if (!message.trim() || loading) return;

  setInputAtBottom(true);

  const userMsg = { role: "user", content: message };
  const history = [...chats, userMsg].filter(
    (m) => m.role === "user" || m.role === "assistant"
  );

  setChats((prev) => [...prev, userMsg]);
  setMessage("");
  setLoading(true);

  // add empty assistant message
  setChats((prev) => [...prev, { role: "assistant", content: "" }]);

  const controller = new AbortController();
  abortRef.current = controller;

  const BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "https://chat-bot-backend-rk9u.onrender.com";

  try {
    const res = await fetch(`${BASE_URL}/chat-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let fullText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;

        const data = line.replace("data:", "").trim();

        if (data === "DONE") {
          setLoading(false);
          abortRef.current = null;
          return;
        }

        try {
          const parsed = JSON.parse(data);

          if (parsed.token) {
            fullText += parsed.token;

            setChats((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: fullText,
              };
              return updated;
            });
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }

    setLoading(false);
    abortRef.current = null;
  } catch (err) {
    if (err.name === "AbortError") return;

    console.error("❌ API ERROR:", err);

    setChats((prev) => [
      ...prev,
      { role: "assistant", content: "❌ Backend not connected!" },
    ]);

    setLoading(false);
    abortRef.current = null;
  }
};


  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col items-center">
        <ChatHeader />

        {inputAtBottom && (
          <div className="w-full max-w-2xl px-4 pb-40 pt-4">
            <ChatMessages chats={chats} loading={loading} bottomRef={bottomRef} />
          </div>
        )}

        <ChatInput
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          stopGenerating={stopGenerating}
          loading={loading}
          inputAtBottom={inputAtBottom}
        />
      </div>
    </div>
  );
}
