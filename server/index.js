import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Upload + Transcription Endpoint
app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const videoPath = req.file.path;
    const audioPath = `uploads/${req.file.filename}.mp3`;

    console.log(`📹 Video uploaded: ${videoPath}`);
    console.log("🎧 Converting to audio using ffmpeg...");

    execSync(`ffmpeg -i ${videoPath} -ar 16000 -ac 1 -f mp3 ${audioPath}`);

    if (!fs.existsSync(audioPath)) {
      console.error("❌ Audio file not created.");
      return res.status(500).json({ error: "Failed to extract audio from video." });
    }

    console.log("✅ Audio conversion successful. Running Whisper transcription...");

    const result = execSync(`python3 whisper_transcribe.py ${audioPath}`);
    const transcript = result.toString();

    if (!transcript || transcript.trim().length === 0) {
      console.error("❌ Empty or invalid transcript.");
      return res.status(400).json({ error: "Failed to transcribe video." });
    }

    console.log("📝 Transcription complete.");
    res.json({ transcript });
  } catch (err) {
    console.error("❌ Transcription error:", err);
    res.status(500).json({ error: "Transcription failed." });
  }
});

// Study Notes Generator
app.post("/generate-notes", async (req, res) => {
  const { transcript } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: "Transcript is required." });
  }

  try {
    const maxLength = 4000;
    let fullNotes = "";

    // Split into chunks if too long
    const chunks = transcript.length > maxLength
      ? transcript.match(new RegExp(`.{1,${maxLength}}`, "g"))
      : [transcript];

    for (const chunk of chunks) {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
You are an expert tutor.Convert the transcript into very short notes just like a gist of whole transcript which help student to get topic in few minutes 
            `,
          },
          { role: "user", content: chunk },
        ],
      });

      fullNotes += response.choices[0].message.content + "\n";
    }

    res.json({ notes: fullNotes });
  } catch (err) {
    console.error("❌ Error generating notes:", err);
    res.status(500).json({ error: "Failed to generate notes." });
  }
});

app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
