import "dotenv/config";
import express from "express";
import cors from "cors";
import "./db/database";
import chatRoutes from "./routes/chat";

const app = express();



app.use(cors());
app.use(express.json());
app.use("/chat", chatRoutes);
app.get("/", (req, res) => {
  res.send("Server is running");
});

console.log("GROQ KEY LOADED:", !!process.env.GROQ_API_KEY);

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
