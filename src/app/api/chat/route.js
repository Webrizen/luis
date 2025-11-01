import { GoogleGenerativeAI } from "@google/generative-ai";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req) {
  try {
    const { message } = await req.json();
    const userMsg = message?.toLowerCase().trim() || "";
    const today = dayjs();

    const filePath = path.join(process.cwd(), "schedule.json");
    const schedule = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let targetDay;
    if (userMsg.includes("tomorrow")) {
      targetDay = today.add(1, "day").format("dddd").toLowerCase();
    } else if (userMsg.includes("today")) {
      targetDay = today.format("dddd").toLowerCase();
    } else {
      const match = Object.keys(schedule).find((day) => userMsg.includes(day));
      targetDay = match || today.format("dddd").toLowerCase();
    }

    const classes = schedule[targetDay] || ["No class info found"];

    const prompt = `
User asked: "${userMsg}"
Today is ${today.format("dddd")}.
Timetable: ${JSON.stringify(schedule, null, 2)}
Classes for ${targetDay}: ${classes.join(", ")}.
Respond naturally as LUIS, a friendly college assistant.
Be concise. If it's a holiday, say it clearly.
    `;

    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ reply: "Error fetching response." }), {
      status: 500,
    });
  }
}
