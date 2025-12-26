const API_BASE = "https://chat-assitant-assignment.onrender.com/chat";


export async function sendMessage(
  message: string,
  sessionId?: string
) {
  const res = await fetch(`${API_BASE}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      sessionId,
    }),
  });

  return res.json();
}

export async function fetchHistory(sessionId: string) {
  const res = await fetch(
    `${API_BASE}/history?sessionId=${sessionId}`
  );
  return res.json();
}
