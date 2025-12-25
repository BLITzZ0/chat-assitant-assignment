import Groq from "groq-sdk";
import { db } from "../db/database";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateAIReply(
  conversationId: number,
  userMessage: string
): Promise<string> {
  return new Promise((resolve) => {
    db.all(
      "SELECT sender, text FROM messages WHERE conversationId = ? ORDER BY createdAt ASC",
      [conversationId],
      async (_err: any, rows: any[]) => {
        const history: {
          role: "user" | "assistant";
          content: string;
        }[] = rows.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: String(m.text),
        }));

        try {
          const response = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: `
You are a customer support chatbot for a small ecommerce store.

ABSOLUTE RULES:
- You must ONLY answer store-related questions.
- Store-related topics are LIMITED to: shipping, delivery, returns, refunds, orders, payments, and support hours.
- If a question is NOT related to the store, you MUST NOT answer it.
- For non-store questions, reply with EXACTLY this message and nothing else:

"I can help with shipping, returns, orders, or payments. Please let me know how I can assist you with our store."

- Do NOT apologize.
- Do NOT explain why you cannot answer.
- Do NOT mention being an AI.
- Do NOT suggest searching online.
- Keep responses short and professional.

Store info:
- Shipping: 5–7 days
- Returns: 30 days
- Support hours: 9am–6pm IST
`


              },
              ...history,
              { role: "user", content: userMessage },
            ],
          });

          resolve(
            response.choices[0]?.message?.content || "Sorry, please try again."
          );
        } catch (err) {
          console.error("GROQ ERROR:", err);
          resolve("Sorry, the support agent is unavailable right now.");
        }
      }
    );
  });
}
