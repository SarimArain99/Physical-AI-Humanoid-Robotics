# 🤖 Physical AI & Humanoid Robotics: Interactive AI Textbook

Welcome to the **Physical AI & Humanoid Robotics Interactive Textbook**, a next-generation learning platform designed to bridge the gap between digital intelligence and physical embodiment. 

This platform is built for the **Panaversity Physical AI Hackathon**, transforming a static curriculum into a highly personalized, interactive, and AI-driven educational experience.

---

## 🚀 Key Features

### 1. 🧠 Dynamic AI Quizzes
* At the bottom of every chapter, users can take an interactive, AI-generated quiz to test their knowledge.
* Generates 3 unique multiple-choice questions per chapter on-demand.
* Tracks answers, scores, and saves results directly to the database.

### 2. ⚡ Personalized Readability & Flashcards
* **Custom Reading Levels:** Switch between **Original**, **Beginner**, and **Intermediate** difficulty levels. The AI dynamically simplifies the text to match the user's background.
* **Flashcards Mode (⚡):** Instantly generates exactly 5 high-yield, exam-focused review points for rapid revision.
* **Global Database Cache:** AI-generated simplified text and flashcards are permanently cached in Neon Postgres so other users get them instantly without extra API cost.

### 3. 🎧 AI Audiobook Mode (Text-to-Speech)
* A floating audio dock is permanently available in the bottom-right corner of the app.
* Reads the page content aloud using the free, native Web Speech API.
* **Dynamic Adaptation:** The reader automatically reads the active content mode (e.g. if you select the "Beginner" simplified version or the Urdu translation, the audiobook dynamically reads that version instead!).

### 4. 🌐 Real-Time Urdu Translation
* Instantly translates dense technical English concepts into Urdu.
* Translations are cached in the database globally to eliminate duplicate API costs.

### 5. 📈 Learning Progress Dashboard
* A sleek, modern dashboard that logs and visualizes user metrics.
* Displays **Chapters Completed**, **Average Quiz Score**, **Total Quizzes Taken**, and a historical timeline of recent activity.
* Securely persisted via Neon PostgreSQL.

### 6. 💬 Locked AI Teaching Assistant
* An on-page floating chatbot to help students digest course material.
* **Safety Lock:** Strictly restricted to answering only textbook-related questions to ensure academic focus.

---

## 🛠️ Tech Stack

* **Frontend:** Docusaurus 3 (React, Rspack, Custom CSS)
* **Backend:** Node.js (Express)
* **Authentication:** Better Auth (Secure sign-up, sign-in, and session management)
* **Database & Cache:** Neon PostgreSQL (Serverless Postgres) with Kysely Adapter
* **AI Integration:** OpenAI API (`gpt-4.1-nano`)

---

## 📂 File System Layout

```bash
├── textbook/                  # Docusaurus Frontend Application
│   ├── src/
│   │   ├── components/        # Interactive widgets (QuizWidget, ChatWidget, AudioPlayer, ChapterTools)
│   │   ├── pages/             # Custom pages (Dashboard, Home)
│   │   ├── theme/             # Custom Theme overrides & swizzles (Root, DocItem)
│   │   └── utils/             # Utility files (authClient, apiConfig)
│   └── docusaurus.config.js   # Site configuration
├── chatbot-api-node/          # Consolidated Node.js Backend API
│   ├── auth.js                # Better Auth configuration
│   ├── index.js               # Express Server & AI Endpoints (Chat, Quiz, Flashcards, Progress, Cache)
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

Please reference [deployment_guide.md](./deployment_guide.md) for a comprehensive, step-by-step walkthrough to deploy this application for free on:
* **Frontend:** Vercel (Free CDN hosting)
* **Backend:** Render.com (Free web service hosting)
* **Database:** Neon Console (Free serverless database)

---

## 👤 Author
* **Developer:** Sarim Arain
* **GitHub:** [@SarimArain99](https://github.com/SarimArain99)
* **Portfolio:** [portfoliosarim.vercel.app](https://portfoliosarim.vercel.app/)
