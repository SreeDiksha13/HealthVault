import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import errorMiddleware from './middleware/error.middleware.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";

// Resolve current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//  Load .env from backend directory
dotenv.config({ path: join(__dirname, '.env') });

//  Debug print to confirm env is loading
console.log("🟢 Supabase URL Loaded:", !!process.env.SUPABASE_URL);
console.log("🟢 Supabase Bucket:", process.env.SUPABASE_BUCKET);
console.log("🟢 Mongo URI Loaded:", !!process.env.MONGO_URI);

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiter for auth
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth', authLimiter);

//  Connect Database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

// Serve uploaded files (still needed for older reports)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/auth", authRoutes);

// Error handler
app.use(errorMiddleware);


app.get("/", (req, res) => res.send("Healthcare Backend Running 🚀"));

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🌍 Also accessible on http://localhost:${PORT}`);
});
