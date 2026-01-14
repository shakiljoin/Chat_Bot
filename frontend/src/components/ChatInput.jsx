import { useRef } from "react";
import { GoArrowRight } from "react-icons/go";
import { IoClose } from "react-icons/io5";

export default function ChatInput({
  message,
  setMessage,
  sendMessage,
  loading,
  inputAtBottom,
  stopGenerating,
}) {
  const textareaRef = useRef(null);

  const handleEnter = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);

    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;

    if (el.scrollHeight > 160) el.style.height = "160px";
  };

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 w-full max-w-lg px-4 transition-all duration-500
      ${inputAtBottom ? "bottom-4" : "top-1/2 -translate-y-1/2"}`}
    >
      <div className="relative w-full max-w-lg">
        {/* ✅ Glow behind border */}
        <div
          className="w-full rounded-xl p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
shadow-[0_0_30px_rgba(168,85,247,0.55)]"
        >
          <div className=" flex items-end gap-2 bg-black border border-slate-800 py-2 px-4 rounded-xl">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleEnter}
              placeholder="Ask me anything..."
              rows={1}
              className="border-none outline-none text-white bg-transparent px-4 py-2 rounded-lg
                 resize-none min-h-10 max-h-40 grow overflow-y-auto w-full"
            />

            {/* <button
      onClick={sendMessage}
      disabled={loading}
      className="shrink-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
      text-black px-2 py-2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500"
    >
      <GoArrowRight className="text-xl" />
    </button> */}
            <button
              onClick={loading ? stopGenerating : sendMessage}
              className="shrink-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-1 text-lg
      text-white px-2 py-2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500"
            >
              {loading ?  <IoClose /> : <GoArrowRight /> }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
