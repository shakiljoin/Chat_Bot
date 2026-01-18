export default function ChatHeader() {
  return (
    <div className="p-4 border-b border-slate-800 text-center">
      <h1
        className="text-3xl font-bold"
        style={{
          background: "linear-gradient(to right, #4F46E5, #E11D48)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Shakil's Chat Bot
      </h1>
      <p className="text-gray-500 text-sm mt-1">
        Your shakil AI chat assistant
      </p>
    </div>
  );
}
