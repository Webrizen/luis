const dotenv = require('dotenv');
const express = require('express');
const dayjs = require('dayjs');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// Load timetable
const schedule = JSON.parse(fs.readFileSync("schedule.json", "utf8"));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

app.post("/api/chat", async (req, res) => {
  const userMsg = req.body.message?.toLowerCase() || "";
  const today = dayjs();
  let targetDay;

  // detect day from user text
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
User question: "${userMsg}"
Today is ${today.format("dddd")}.
Timetable data: ${JSON.stringify(schedule, null, 2)}
Classes for ${targetDay}: ${classes.join(", ")}.

Respond like a small friendly college assistant.
Be concise and natural, e.g. "Yes Sir, you’ve got C and Logic tomorrow."
If the day is OFF, say it clearly.
  `;

  try {
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Error fetching response." });
  }
});

app.listen(PORT, () =>
  console.log(`🧠 CollegeBot running → http://localhost:${PORT}`)
);