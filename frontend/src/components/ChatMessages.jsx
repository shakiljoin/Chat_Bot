import ReactMarkdown from "react-markdown";

export default function ChatMessages({ chats, loading, bottomRef }) {
  return (
    <div className="w-full overflow-y-auto flex flex-col gap-4 leading-6">
      {chats.map((c, i) => (
        <div
          key={i}
          className={`px-4 text-base leading-loose items-center justify-between
          rounded-xl ${
  c.role === "user"
    ? "ml-auto bg-gray-700 py-2 text-white rounded-full  w-fit"
    : "mr-auto  text-slate-100 rounded-2xl w-full"
}`}
        >
          <ReactMarkdown
            components={{
              pre: ({ node, ...props }) => (
                <pre
                  className="overflow-x-auto max-w-full whitespace-pre rounded-xl p-4 mt-10 mb-10 bg-black leading-6"
                  {...props}
                />
                
              ),
              code: ({ node, ...props }) => (
                <code className="text-white leading-tight" {...props} />
              ),
            }}
          >
            {c.content}
          </ReactMarkdown>
        </div>
      ))}

      {loading && (
        <div className="mr-auto bg-slate-800 text-slate-100 px-4 py-3 rounded-2xl text-sm">
          Typing...
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
