import { createRequire } from "module";
import fs from "fs";
import axios from "axios"; 
import { GoogleGenerativeAI } from "@google/generative-ai";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

class AIService {
  constructor() {
    this.genAI = null;
  }

  _getGenAI() {
    if (!this.genAI) {
      if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is not set in environment variables");
        throw new Error("GEMINI_API_KEY is required");
      }
      console.log("✅ Initializing Gemini AI with API key");
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return this.genAI;
  }

  // ✅ Updated to support Supabase URLs
  async processFile(filePath, mimeType) {
    try {
      let fileBuffer;

      // ✅ If file is stored on Supabase (URL)
      if (filePath.startsWith("http")) {
        const response = await axios.get(filePath, { responseType: "arraybuffer" });
        fileBuffer = response.data;
      } 
      // ✅ If file was local
      else {
        fileBuffer = fs.readFileSync(filePath);
      }

      let textContent = "";

      if (mimeType === "application/pdf") {
        const pdfData = await pdfParse(fileBuffer);
        textContent = pdfData.text;
      } else if (mimeType.startsWith("text/")) {
        textContent = fileBuffer.toString("utf-8");
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      return await this.summarizeMedicalRecord(textContent);

    } catch (error) {
      console.error("Error processing file:", error.message);
      return {
        doctor_name: "Not specified",
        report_date: "Not specified",
        diagnosis: "Not specified",
        medications: "None listed",
        allergies: "None listed",
        summary: "File could not be processed",
        status: "failed",
      };
    }
  }

  async summarizeMedicalRecord(text) {
    const prompt = `
Extract from this medical record:
1. Doctor's name
2. Date of the report/visit
3. A brief 1-2 line summary of the diagnosis/condition
4. Current medications (name, dosage if available)
5. Known allergies

IMPORTANT RULES:
- If a word appears as part of a test name, do NOT use it as the diagnosis
- Look for the actual medical condition being treated or diagnosed
- Focus on what the patient HAS, not what they're being tested FOR
- Use exact wording from diagnosis sections only

Return as JSON with these exact keys:
{
  "doctor_name": "...",
  "report_date": "...",
  "diagnosis": "...",
  "medications": "...",
  "allergies": "...",
  "summary": "...",
  "status": "completed"
}

If any field is not found, use "Not specified" or "None listed".

Medical Record:
${text.slice(0, 5000)}
`;

    try {
      const genAI = this._getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;

      let generatedText = response.text();

      if (generatedText.includes("```json")) {
        generatedText = generatedText.replace(/```json|```/g, "").trim();
      }

      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) generatedText = jsonMatch[0];

      return JSON.parse(generatedText);

    } catch (error) {
      console.error("Gemini summarization failed:", error.message);
      return {
        doctor_name: "Not specified",
        report_date: "Not specified",
        diagnosis: "Not specified",
        medications: "None listed",
        allergies: "None listed",
        summary: "Error processing medical record - API unavailable or invalid key",
        status: "completed",
      };
    }
  }
}

export default new AIService();
