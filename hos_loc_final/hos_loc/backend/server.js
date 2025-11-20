import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import hospitalRoutes from "./src/routes/hospital.routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo Connected"))
  .catch((err) => console.error("❌ Mongo Connection Error:", err.message));

// ✅ Routes
app.use("/api/hospitals", hospitalRoutes);

app.get("/", (req, res) => {
  res.send("Hospital Location Backend Running ✅");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
