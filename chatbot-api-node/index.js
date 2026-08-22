import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import pg from "pg";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
const { Pool } = pg;

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(express.json());

// Provide the Better Auth API at /api/auth
app.use("/api/auth", toNodeHandler(auth));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Setup Neon DB Postgres Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize DB schema
pool.query(`
  CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES chat_sessions(id),
    role VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS content_cache (
    key VARCHAR(255) PRIMARY KEY,
    content TEXT
  );
  CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    page_id VARCHAR(255) NOT NULL,
    quiz_score INT,
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, page_id)
  );
`).then(() => console.log('Neon DB initialized for chatbot API.')).catch(console.error);

// Load the textbook context
let textbookContext = "";

function readAllMarkdown(dirPath) {
  let content = "";
  if (!fs.existsSync(dirPath)) return content;
  
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      content += readAllMarkdown(fullPath);
    } else if (fullPath.endsWith(".md") || fullPath.endsWith(".mdx")) {
      content += `\n\n--- FILE: ${file} ---\n`;
      content += fs.readFileSync(fullPath, "utf-8");
    }
  }
  return content;
}

try {
  const docsPath = path.join(process.cwd(), "..", "textbook", "docs");
  textbookContext = readAllMarkdown(docsPath);
  console.log(`Loaded textbook context (${textbookContext.length} characters).`);
} catch (error) {
  console.error("Failed to load textbook context:", error);
}

const SYSTEM_PROMPT = `You are the Physical AI & Humanoid Robotics Textbook Assistant. 
You are helping students learn about ROS 2, Gazebo, NVIDIA Isaac, and VLA.
Use the following textbook content as your ONLY source of truth:

${textbookContext}

CRITICAL RULES:
1. You MUST ONLY answer questions related to the provided textbook content. If a user asks a question outside the scope of the textbook (like coding unrelated to the book, general knowledge, etc.), you must politely refuse to answer it and redirect them back to the course topics. Do NOT provide external knowledge.
2. When answering, you MUST base your response strictly on the textbook content provided.
3. You MUST explain the answer in a very easy, simple, and beginner-friendly way.
4. You MUST include explicit references to the book (e.g., mentioning the specific topic, chapter, or file name from the context) to show exactly where the information came from.
`;

async function getSessionHistory(sessionId) {
  // Ensure session exists
  await pool.query(`INSERT INTO chat_sessions (id) VALUES ($1) ON CONFLICT DO NOTHING`, [sessionId]);
  
  const res = await pool.query(`SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY id ASC`, [sessionId]);
  const history = res.rows.map(r => ({ role: r.role, content: r.content }));
  
  if (history.length === 0) {
    history.push({ role: "system", content: SYSTEM_PROMPT });
    await pool.query(`INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)`, [sessionId, "system", SYSTEM_PROMPT]);
  }
  return history;
}

async function appendMessage(sessionId, role, content) {
  await pool.query(`INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)`, [sessionId, role, content]);
}

app.post("/api/chat", async (req, res) => {
  const { message, session_id } = req.body;
  if (!message || !session_id) {
    return res.status(400).json({ error: "Missing message or session_id" });
  }

  const history = await getSessionHistory(session_id);
  history.push({ role: "user", content: message });
  await appendMessage(session_id, "user", message);

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: history,
      stream: true,
    });

    let assistantContent = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        assistantContent += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await appendMessage(session_id, "assistant", assistantContent);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error(error);
    res.write(`data: ${JSON.stringify({ content: "Error connecting to AI." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

app.post("/api/chat/selected", async (req, res) => {
  const { message, selected_text, session_id } = req.body;
  if (!message || !selected_text || !session_id) {
    return res.status(400).json({ error: "Missing message, selected_text, or session_id" });
  }

  const history = await getSessionHistory(session_id);
  const prompt = `The user has highlighted the following text from the textbook:\n"${selected_text}"\n\nUser's Question:\n${message}`;

  history.push({ role: "user", content: prompt });
  await appendMessage(session_id, "user", prompt);

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: history,
      stream: true,
    });

    let assistantContent = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        assistantContent += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await appendMessage(session_id, "assistant", assistantContent);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error(error);
    res.write(`data: ${JSON.stringify({ content: "Error connecting to AI." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

app.post("/api/translate", async (req, res) => {
  const { text, target_language = "Urdu" } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "Missing text to translate" });
  }

  const systemPrompt = `You are a professional technical translator. Translate the following educational text into natural, accurate ${target_language}. Preserve all formatting, technical terms (keep them in English if they don't have a direct common translation), and markdown structure. Provide ONLY the translated text, without any introductory conversational filler.`;

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 4096,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error(error);
    res.write(`data: ${JSON.stringify({ content: "Error connecting to AI for translation." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

app.post("/api/personalize", async (req, res) => {
  const { text, level } = req.body;
  
  if (!text || !level) {
    return res.status(400).json({ error: "Missing text or level" });
  }

  let systemPrompt = "";
  if (level === "beginner") {
    systemPrompt = "You are a professional technical educator. Rewrite the following educational text in very simple, beginner-friendly language. Keep the core meaning accurate, remove unnecessary complexity, and explain difficult terminology in simple words. Return ONLY the rewritten text, preserving markdown formatting where appropriate. Do not add introductory filler.";
  } else if (level === "intermediate") {
    systemPrompt = "You are a professional technical educator. Rewrite the following educational text to provide a more detailed and clearer explanation than the original. Add useful context, clarification, and practical examples where appropriate. Maintain factual accuracy and original meaning. Return ONLY the rewritten text, preserving markdown formatting where appropriate. Do not add introductory filler.";
  } else {
    return res.status(400).json({ error: "Invalid level" });
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 4096,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error(error);
    res.write(`data: ${JSON.stringify({ content: "Error connecting to AI for personalization." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

app.post("/api/quiz", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  const systemPrompt = `You are a technical educator. Generate a 3-question multiple-choice quiz based on the provided text. Return ONLY a valid JSON object with a "questions" array. Format exactly like this:
{
  "questions": [
    {
      "question": "What is ROS 2?",
      "options": ["An OS", "A middleware", "A robot", "A programming language"],
      "answerIndex": 1
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" } 
    });
    res.json({ content: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

app.post("/api/flashcards", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  const systemPrompt = `You are a technical educator. Summarize the provided text into exactly 5 concise, high-yield bullet points for exam review (Flashcards). Use markdown bullet points. Return ONLY the bullet points, no introductory filler.`;

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      stream: true,
      temperature: 0.2,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ content: "Error generating flashcards." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// Progress Endpoints
app.post("/api/progress", async (req, res) => {
  try {
    const { user_id, page_id, quiz_score, completed } = req.body;
    if (!user_id || !page_id) return res.status(400).json({ error: "Missing user_id or page_id" });

    await pool.query(
      `INSERT INTO user_progress (user_id, page_id, quiz_score, completed) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, page_id) 
       DO UPDATE SET 
          quiz_score = GREATEST(user_progress.quiz_score, EXCLUDED.quiz_score),
          completed = EXCLUDED.completed`,
      [user_id, page_id, quiz_score || 0, completed || true]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/progress/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await pool.query(`SELECT page_id, quiz_score, completed, created_at FROM user_progress WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    res.json({ progress: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Cache Endpoints
app.get("/api/cache/:key", async (req, res) => {
  try {
    const key = req.params.key;
    const result = await pool.query(`SELECT content FROM content_cache WHERE key = $1`, [key]);
    if (result.rows.length > 0) {
      res.json({ content: result.rows[0].content });
    } else {
      res.status(404).json({ error: "Cache miss" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/cache", async (req, res) => {
  try {
    const { key, content } = req.body;
    if (!key || !content) return res.status(400).json({ error: "Missing key or content" });
    
    await pool.query(
      `INSERT INTO content_cache (key, content) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content`,
      [key, content]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Node Chatbot API running on port ${PORT}`);
});
