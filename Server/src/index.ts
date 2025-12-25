import "dotenv/config";
import express from "express";
import cors from "cors";
import "./db/database";
import chatRoutes from "./routes/chat";

const app = express();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.use(cors());
app.use(express.json());
app.use("/chat", chatRoutes);
app.get("/", (req, res) => {
  res.send("Server is running");
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
