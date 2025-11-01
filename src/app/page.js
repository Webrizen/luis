"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi there! I'm LUIS, your college assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg, { sender: "bot", text: "..." }]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev.slice(0, -1), { sender: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev.slice(0, -1), { sender: "bot", text: "LUIS is having trouble connecting." }]);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-3xl w-full bg-zinc-800 rounded-2xl border border-zinc-700 shadow-xl overflow-hidden">
        <div className="bg-zinc-900 p-4 border-b border-zinc-700 flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <h1 className="font-medium">LUIS is online</h1>
        </div>

        <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-zinc-900">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-zinc-700 text-zinc-100 rounded-tl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex border-t border-zinc-700 p-4 bg-zinc-800">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your classes..."
            className="flex-1 bg-zinc-700 border border-zinc-600 rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
