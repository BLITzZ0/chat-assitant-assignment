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

  // reference for auto scroll
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load chat history on refresh
  useEffect(() => {
    if (!sessionId) return;

    fetchHistory(sessionId).then((data) => {
      if (data.messages) {
        setMessages(data.messages);
      }
    });
  }, [sessionId]);

  // Auto scroll whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const data = await sendMessage(input, sessionId || undefined);

    if (!sessionId) {
      localStorage.setItem("sessionId", data.sessionId);
      setSessionId(data.sessionId);
    }

    const aiMsg: Message = {
      sender: "ai",
      text: data.reply,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <h2>Customer Support Chat</h2>

      <div style={styles.chatBox}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              alignSelf:
                msg.sender === "user" ? "flex-end" : "flex-start",
              background:
                msg.sender === "user" ? "#DCF8C6" : "#F1F1F1",
            }}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div style={styles.typing}>Support is typing…</div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    maxWidth: 420,
    margin: "40px auto",
    fontFamily: "Arial, sans-serif",
  },
  chatBox: {
    border: "1px solid #ccc",
    padding: 10,
    height: 350,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 10,
  },
  message: {
    padding: "8px 12px",
    borderRadius: 12,
    maxWidth: "80%",
    wordBreak: "break-word",
  },
  typing: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  inputRow: {
    display: "flex",
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 8,
    fontSize: 14,
  },
  button: {
    padding: "8px 14px",
    cursor: "pointer",
  },
};
