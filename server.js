require('dotenv').config();
const express = require('express');
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ──────────────────────────────
// ⚙️ Basic Setup
// ──────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// Security & performance middlewares
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.static('public', { maxAge: '1d' }));

// Rate limit to prevent abuse
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { reply: "Too many requests, please slow down." }
}));

// ──────────────────────────────
// 🧠 AI Setup
// ──────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// ──────────────────────────────
// 📚 Load Timetable
// ──────────────────────────────
let schedule = {};
try {
  const filePath = path.join(process.cwd(), 'schedule.json');
  schedule = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (err) {
  console.error("❌ Error loading schedule.json:", err.message);
  schedule = {};
}

// ──────────────────────────────
// 🌐 Routes
// ──────────────────────────────

// Serve frontend
app.get('/', (_, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const userMsg = req.body.message?.toLowerCase().trim() || "";
    const today = dayjs();
    let targetDay;

    // Detect which day user refers to
    if (userMsg.includes("tomorrow")) {
      targetDay = today.add(1, "day").format("dddd").toLowerCase();
    } else if (userMsg.includes("today")) {
      targetDay = today.format("dddd").toLowerCase();
    } else {
      const match = Object.keys(schedule).find((day) =>
        userMsg.includes(day)
      );
      targetDay = match || today.format("dddd").toLowerCase();
    }

    const classes = schedule[targetDay] || ["No class info found"];

    const prompt = `
User asked: "${userMsg}"
Today is ${today.format("dddd")}.
Timetable: ${JSON.stringify(schedule, null, 2)}
Classes for ${targetDay}: ${classes.join(", ")}.

Respond naturally as LUIS, a friendly college assistant.
Keep it short and realistic (one or two lines).
If it's a holiday or OFF, say it clearly.
    `;

    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();
    res.json({ reply });

  } catch (err) {
    console.error("LUIS Error:", err);
    res.status(500).json({ reply: "Server error. Please try again later." });
  }
});

// ──────────────────────────────
// 🚀 Start Server
// ──────────────────────────────
app.listen(PORT, () =>
  console.log(`🧠 LUIS is live → http://localhost:${PORT}`)
);
