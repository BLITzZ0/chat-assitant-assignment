import { useEffect, useRef, useState } from "react";
import { sendMessage, fetchHistory } from "../services/api";

type Message = {
  sender: "user" | "ai";
  text: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("sessionId")
  );
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load chat history
  useEffect(() => {
    if (!sessionId) return;

    fetchHistory(sessionId).then((data) => {
      if (data.messages) {
        setMessages(data.messages);
      }
    });
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const data = await sendMessage(input, sessionId || undefined);

    if (!sessionId) {
      localStorage.setItem("sessionId", data.sessionId);
      setSessionId(data.sessionId);
    }

    const aiMessage: Message = {
      sender: "ai",
      text: data.reply,
    };

    setMessages((prev) => [...prev, aiMessage]);
    setLoading(false);
  }

  function handleReset() {
    localStorage.removeItem("sessionId");
    setSessionId(null);
    setMessages([]);
  }

  return (
    <div className="container">
      <div className="header">
        <h2>Customer Support Chat</h2>
        <button className="resetBtn" onClick={handleReset}>
          New Chat
        </button>
      </div>

      <div className="chatBox">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}

        {loading && <div className="typing">Support is typing…</div>}

        <div ref={bottomRef} />
      </div>

      <div className="inputRow">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
