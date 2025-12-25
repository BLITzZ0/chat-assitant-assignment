import { Router } from "express";
import { db } from "../db/database";
import { randomUUID } from "crypto";
import { generateAIReply } from "../services/llmservice";

const router = Router();

function isStoreRelated(message: string): boolean {
  const keywords = [
    "ship", "shipping", "delivery",
    "return", "refund",
    "order", "payment",
    "support", "hours"
  ];

  return keywords.some(k => message.toLowerCase().includes(k));
}


router.post("/message", (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  const sid = sessionId || randomUUID();

  db.get(
    "SELECT id FROM conversations WHERE sessionId = ?",
    [sid],
    (err, conversation : any) => {
      if (!conversation) {
        db.run(
          "INSERT INTO conversations (sessionId) VALUES (?)",
          [sid],
          function () {
            saveMessage(this.lastID);
          }
        );
      } else {
        saveMessage(conversation.id);
      }
    }
  );

  async function saveMessage(conversationId: number) {
  // save user message
  db.run(
    "INSERT INTO messages (conversationId, sender, text) VALUES (?, ?, ?)",
    [conversationId, "user", message]
  );

  // generate AI reply
  let aiReply: string;

if (!isStoreRelated(message)) {
  aiReply =
    "I can help with shipping, returns, orders, or payments. Please let me know how I can assist you with our store.";
} else {
  aiReply = await generateAIReply(conversationId, message);
}


  // save AI message
  db.run(
    "INSERT INTO messages (conversationId, sender, text) VALUES (?, ?, ?)",
    [conversationId, "ai", aiReply]
  );

  // return response
  res.json({
    reply: aiReply,
    sessionId: sid
  });
}
});

router.get("/history", (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId required" });
  }

  db.get(
    "SELECT id FROM conversations WHERE sessionId = ?",
    [sessionId],
    (err, conversation: any) => {
      if (!conversation) {
        return res.json({ messages: [] });
      }

      db.all(
        "SELECT sender, text, createdAt FROM messages WHERE conversationId = ? ORDER BY createdAt ASC",
        [conversation.id],
        (err, rows) => {
          res.json({ messages: rows });
        }
      );
    }
  );
});


export default router;
