# 🎓 AI Doubt Solver — Your 24/7 Smart AI Tutor

An advanced full-stack AI-powered doubt clearance platform designed for students. Ask questions via **text queries**, **textbook/diagram uploads**, or **voice notes**, and receive instant, step-by-step interactive explanations with structured markdown, code highlight formatting, and automatic subject classification.

---

## ⚡ Key Features

*   **📝 Multi-Modal Inputs**
    *   **Text Doubts:** Ask questions in plain text and receive comprehensive responses formatted in clean Markdown.
    *   **🖼️ Image Doubts:** Upload images of equations, geometry, graphs, or textbook page screenshots analyzed by vision-capable AI models.
    *   **🎙️ Voice Doubts:** Record your question directly in the browser; transcritped instantly by AssemblyAI and answered by LLaMA.
*   **📚 Smart Auto-Subject Classification**
    *   AI automatically detects the context of the doubt and categorizes it under **Mathematics**, **Physics**, **Chemistry**, **Biology**, **Computer Science**, or **Other**, helping students organize their study history.
*   **💬 Persistent Chat History**
    *   Saved secure sessions grouped by subjects, allowing students to return to previous doubts at any time.
*   **🔐 JWT Authentication & Security**
    *   Secure user registration and login endpoints utilizing JSON Web Tokens (JWT) and `bcryptjs` password hashing.
*   **🚀 Premium UI/UX**
    *   Built using React, Vite, and Tailwind CSS.
    *   Features an **Optimistic UI** (messages display instantly as "Sending..." before server response is completed).
    *   Tailored markdown elements and code blocks with syntax highlighting for scientific notation and programming questions.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, React Router DOM v6 | Single Page Application framework |
| **Styling** | Tailwind CSS, Lucide Icons | Responsive modern design |
| **Backend** | Node.js, Express | RESTful API server with modular controllers |
| **Database** | MongoDB, Mongoose | Secure storage for User accounts and Chat histories |
| **AI Processing**| Groq Cloud SDK | LLaMA-based LLM execution (text & vision) |
| **Speech-to-Text**| AssemblyAI | Transcription service for audio messages |
| **Security** | Helmet, CORS, BCrypt, JWT | Hardened security headers, API protection |

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v16+ or newer)
*   [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas Connection URI)
*   [Groq API Key](https://console.groq.com/)
*   [AssemblyAI API Key](https://www.assemblyai.com/)

---

### ⚙️ Backend Setup

1. Navigate to the server folder:
   ```bash
   cd ai-doubt-solver-server-prefilled/ai-doubt-solver-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root of the server folder and configure the following credentials:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_uri
   JWT_SECRET=your_jwt_secret_key_here
   GROQ_API_KEY=your_groq_api_key
   ASSEMBLYAI_API_KEY=your_assemblyai_api_key
   ```

4. Start the server in development mode:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000`.*

---

### 💻 Frontend Setup

1. Navigate to the client folder:
   ```bash
   cd ai-doubt-solver-client-prefilled
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will run on `http://localhost:5173`.*

---

## 📁 Project Structure

```text
├── ai-doubt-solver-client-prefilled/      # React Frontend SPA
│   ├── src/
│   │   ├── components/                    # Layout, Chat, & Voice Components
│   │   ├── context/                       # AuthContext & ChatContext providers
│   │   ├── pages/                         # Dashboard, Login, Register, ChatPage
│   │   ├── services/                      # Axios API helper (with JWT Interceptors)
│   │   ├── App.jsx                        # Routing and Route protection
│   │   └── index.css                      # Tailwind utilities & Global styles
│   └── vite.config.js                     # Proxy configurations (/api to localhost:5000)
│
└── ai-doubt-solver-server-prefilled/      # Node/Express Backend
    └── ai-doubt-solver-server/
        ├── config/                        # Database Connection configuration
        ├── controllers/                   # Auth & Chat controllers (llama + assemblyai API logic)
        ├── middleware/                    # Auth guards & error handlers
        ├── models/                        # Mongoose schemas (User & Chat models)
        ├── routes/                        # Express API route endpoints
        └── index.js                       # Express Application configuration
```

---

## 🛡️ License

This project is open-source and available under the [MIT License](LICENSE).
