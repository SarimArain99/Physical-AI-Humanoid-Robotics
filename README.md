# 🤖 Physical AI & Humanoid Robotics: Interactive AI Textbook

Welcome to the **Physical AI & Humanoid Robotics Interactive Textbook**, a next-generation learning platform designed to bridge the gap between digital intelligence and physical embodiment. 

This platform is built for the **Panaversity Physical AI Hackathon**, transforming a curriculum into a highly personalized, interactive, and AI-driven educational experience.

---

## 🚀 Key Features

### 1. 🧠 Dynamic AI Quizzes (Logged-In Only)
* **Access Control:** Locked exclusively for registered students to incentivize sign-ups and track progress.
* **On-Demand Generation:** Scans the active chapter markdown and requests OpenAI to generate a valid 3-question multiple-choice quiz.
* **Interactive Elements:** Features selected-state options, instant correct/incorrect visual feedback, and overall score results.
* **Database Persisted:** Saves the final score securely to the Neon Postgres database.

### 2. 🔍 Highlight-to-Explain (Inline AI)
* When a student highlights any block of text on a page, they can click a button to ask the AI to explain or clarify that specific selected passage. The chatbot uses the highlighted text as context for the response.

### 3. 🌐 Real-Time Urdu Translation
* Instantly translates dense technical English concepts into natural, accurate Urdu.
* Translations are cached in the database globally to eliminate duplicate API costs.

### 4. 🎚️ Level Personalization
* Rewrites textbook paragraphs on-the-fly based on the student's background:
  * **Beginner:** Simplifies language and defines complex jargon.
  * **Intermediate:** Expands with additional context and technical code examples.

### 🎧 5. AI Audiobook Mode (Text-to-Speech)
* A floating audio dock is permanently available in the bottom-right corner of the app.
* Reads the page content aloud using the free, native Web Speech API.
* **Dynamic Adaptation:** The reader automatically reads the active content mode (e.g. if you select the "Beginner" simplified version or the Urdu translation, the audiobook dynamically reads that version instead!).

### 🔐 6. Unified Auth System (Better Auth)
* Email & Password registration and login.
* Saves user profiles along with their software and hardware experience backgrounds.
* **Password Visibility Toggle:** Show/Hide passwords in form inputs using interactive eye icons.
* **Password Recovery:** Forgot Password request flow linked to nodemailer SMTP (or console logging) with a secure `/reset-password` page.

### 📊 7. Professional Progress Dashboard
* Displays analytics: Chapters Completed, average quiz scores, and recent activities.
* **Syllabus Progress Map:** A structured checklist showing all 5 textbook modules, highlighting which ones are completed (with scores) or pending (with "Start" study links).
* **Real-Time Info Sync:** Uses a Cache-Control cache-buster and a manual **"Refresh Stats"** button to guarantee up-to-the-second progress stats from the database.

### 🛡️ 8. Rate Limit Protection
* Integrated `express-rate-limit` on the backend to limit requests to all AI-related endpoints (60 requests per 15 minutes per IP address) to prevent API key abuse.

---

## 🛠️ Tech Stack

* **Frontend:** Docusaurus 3 (React, Rspack, Custom CSS)
* **Backend:** Node.js (Express)
* **Authentication:** Better Auth (Secure sign-up, sign-in, and session management)
* **Database & Cache:** Neon PostgreSQL (Serverless Postgres) with Kysely Adapter
* **AI Integration:** OpenAI API (`gpt-4.1-nano`)
* **Security & Limits:** express-rate-limit

---

## 📂 File System Layout

```bash
├── textbook/                  # Docusaurus Frontend Application
│   ├── src/
│   │   ├── components/        # Interactive widgets (QuizWidget, ChatWidget, AudioPlayer, ChapterTools)
│   │   ├── pages/             # Custom pages (Dashboard, Home, Reset Password)
│   │   ├── theme/             # Custom Theme overrides & swizzles (Root, DocItem)
│   │   └── utils/             # Utility files (authClient, apiConfig)
│   └── docusaurus.config.js   # Site configuration
├── chatbot-api-node/          # Consolidated Node.js Backend API
│   ├── auth.js                # Better Auth configuration
│   ├── index.js               # Express Server & AI Endpoints (Chat, Quiz, Flashcards, Progress, Cache)
│   ├── vercel.json            # Vercel Serverless routing config
│   └── package.json
└── README.md                  # Project documentation
```

---

## 💻 Local Setup & Development

### 1. Prerequisites
Ensure you have **Node.js** (v20 or higher) and an **OpenAI API Key** ready.

### 2. Set Up the Backend
1. Navigate to the backend directory:
   ```bash
   cd chatbot-api-node
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Create a `.env` file in the `chatbot-api-node` folder:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=your_neon_postgres_db_url
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   BETTER_AUTH_SECRET=a_random_32_character_string
   BETTER_AUTH_URL=http://localhost:8000
   ```
4. Start the server:
   ```bash
   node index.js
   ```
   The backend will run on `http://localhost:8000`.

### 3. Set Up the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd textbook
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Docusaurus:
   ```bash
   npm start -- --port 3001
   ```
   Open `http://localhost:3001` in your browser.

---

## 🚀 Production Deployment

Please reference [deployment_guide.md](./deployment_guide.md) or the copy inside your artifacts folder for a comprehensive, step-by-step walkthrough to deploy this application for free on:
* **Frontend:** Vercel (Free static hosting)
* **Backend:** Vercel (Free Node.js Serverless Functions)
* **Database:** Neon Console (Free serverless database)

---

## 👤 Author
* **Developer:** Sarim Arain
* **GitHub:** [@SarimArain99](https://github.com/SarimArain99)
* **Portfolio:** [portfoliosarim.vercel.app](https://portfoliosarim.vercel.app/)
