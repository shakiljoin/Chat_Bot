

// import { useEffect, useRef, useState } from "react";
// import ChatHeader from "./ChatHeader";
// import ChatMessages from "./ChatMessages";
// import ChatInput from "./ChatInput";

// export default function ChatApp() {
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   // ✅ start in center (false), after send make true
//   const [inputAtBottom, setInputAtBottom] = useState(false);

//   const [chats, setChats] = useState([
//     {
//       role: "assistant",
//       content: "",
//     },
//   ]);

//   const bottomRef = useRef(null);

//   useEffect(() => {
//     if (inputAtBottom) {
//       bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [chats, loading, inputAtBottom]);

//   const sendMessage = async () => {
//     if (!message.trim() || loading) return;

//     // ✅ move input to bottom after first message
//     setInputAtBottom(true);

//     const userMsg = { role: "user", content: message };

//     const history = [...chats, userMsg].filter(
//       (m) => m.role === "user" || m.role === "assistant"
//     );

//     setChats((prev) => [...prev, userMsg]);
//     setMessage("");
//     setLoading(true);

//     // assistant streaming bubble
//     setChats((prev) => [...prev, { role: "assistant", content: "" }]);

//     try {
//       const res = await fetch("http://127.0.0.1:8000/chat-stream", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ messages: history }),
//       });

//       const reader = res.body.getReader();
//       const decoder = new TextDecoder("utf-8");
//       let buffer = "";
//       let fullText = "";

//       while (true) {
//         const { value, done } = await reader.read();
//         if (done) break;

//         buffer += decoder.decode(value, { stream: true });
//         const lines = buffer.split("\n");
//         buffer = lines.pop();

//         for (const line of lines) {
//           if (line.startsWith("data:")) {
//             const data = line.replace("data:", "").trim();

//             if (data === "DONE") {
//               setLoading(false);
//               return;
//             }

//             try {
//               const parsed = JSON.parse(data);
//               if (parsed.token) {
//                 fullText += parsed.token;

//                 setChats((prev) => {
//                   const updated = [...prev];
//                   updated[updated.length - 1] = {
//                     role: "assistant",
//                     content: fullText,
//                   };
//                   return updated;
//                 });
//               }
//             } catch (e) {}
//           }
//         }
//       }
//     } catch (error) {
//       setChats((prev) => [
//         ...prev,
//         { role: "assistant", content: "❌ Backend not connected!" },
//       ]);
//       setLoading(false);
//     }
//   };

//   return (
//     // ✅ IMPORTANT: stop page scrolling, full screen
//     <div className="min-h-screen bg-black/90 text-white">
//   <div className="flex flex-col items-center">
//     <ChatHeader />

//     {inputAtBottom && (
//       <div className="w-full max-w-6xl px-4 pb-40 pt-4">
//         <ChatMessages chats={chats} loading={loading} bottomRef={bottomRef} />
//       </div>
//     )}

//     <ChatInput
//       message={message}
//       setMessage={setMessage}
//       sendMessage={sendMessage}
//       loading={loading}
//       inputAtBottom={inputAtBottom}
//     />
//   </div>
// </div>

//   );
// }

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

    // ✅ create controller
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("http://127.0.0.1:8000/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      const data = await res.json();
      console.log(data.reply);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data:")) {
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
            } catch {}
          }
        }
      }

      setLoading(false);
      abortRef.current = null;
    } catch (err) {
      // ✅ when stop clicked
      if (err.name === "AbortError") return;

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
