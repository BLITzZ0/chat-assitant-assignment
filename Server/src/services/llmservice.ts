import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateAIReply(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      max_tokens: 80,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    return (
      response.choices[0]?.message?.content ||
      "I can help with shipping, returns, orders, payments, or support hours."
    );
  } catch (err) {
    console.error("GROQ ERROR:", err);
    return "I can help with shipping, returns, orders, payments, or support hours.";
  }
}
