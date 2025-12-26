import { Router } from "express";
import { db } from "../db/database";
import { randomUUID } from "crypto";
import { generateAIReply } from "../services/llmservice";

const router = Router();

//STORE KNOWLEDGE (FACTS)
const STORE_INFO = {
  shipping: "We ship within 5–7 days and also ship internationally.",
  returns: "We offer a 30-day return policy on unused items in original condition.",
  payments: "We accept standard online payment methods.",
  support: "Our support hours are from 9am to 6pm IST.",
};

//INTENT DETECTION
function detectIntent(message: string): keyof typeof STORE_INFO | null {
  const msg = message.toLowerCase();

  if (msg.includes("ship") || msg.includes("delivery")) return "shipping";
  if (msg.includes("return") || msg.includes("refund") || msg.includes("exchange"))
    return "returns";
  if (msg.includes("pay") || msg.includes("payment") || msg.includes("card"))
    return "payments";
  if (msg.includes("support") || msg.includes("contact") || msg.includes("hours"))
    return "support";

  return null;
}

//SYSTEM PROMPT BUILDER
function buildSystemPrompt(intent: keyof typeof STORE_INFO | null): string {
  let prompt = `
You are a customer support AI assistant for a small ecommerce store.

Rules:
- Answer ONLY using the store information provided.
- Keep responses short (1–2 sentences).
- Do NOT answer non-store-related questions.
- Do NOT add extra facts or assumptions.
`;

  if (intent) {
    prompt += `
Store information:
${STORE_INFO[intent]}
`;
  } else {
    prompt += `
If no store information is provided, reply ONLY with:
"I can help with shipping, returns, orders, payments, or support hours."
`;
  }

  return prompt;
}


//CHAT MESSAGE API

router.post("/message", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  const sid = sessionId || randomUUID();
  const intent = detectIntent(message);
  const systemPrompt = buildSystemPrompt(intent);

  const aiReply = await generateAIReply(systemPrompt, message);

  db.get(
    "SELECT id FROM conversations WHERE sessionId = ?",
    [sid],
    (_err, conversation: any) => {
      if (!conversation) {
        db.run(
          "INSERT INTO conversations (sessionId) VALUES (?)",
          [sid],
          function () {
            saveMessages(this.lastID);
          }
        );
      } else {
        saveMessages(conversation.id);
      }
    }
  );

  function saveMessages(conversationId: number) {
    db.run(
      "INSERT INTO messages (conversationId, sender, text) VALUES (?, ?, ?)",
      [conversationId, "user", message]
    );

    db.run(
      "INSERT INTO messages (conversationId, sender, text) VALUES (?, ?, ?)",
      [conversationId, "ai", aiReply]
    );

    res.json({
      reply: aiReply,
      sessionId: sid,
    });
  }
});

//CHAT HISTORY API
router.get("/history", (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId required" });
  }

  db.get(
    "SELECT id FROM conversations WHERE sessionId = ?",
    [sessionId],
    (_err, conversation: any) => {
      if (!conversation) {
        return res.json({ messages: [] });
      }

      db.all(
        "SELECT sender, text, createdAt FROM messages WHERE conversationId = ? ORDER BY createdAt ASC",
        [conversation.id],
        (_err, rows) => {
          res.json({ messages: rows });
        }
      );
    }
  );
});

export default router;
