import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const portArgIndex = process.argv.indexOf('--port');
const PORT = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK on server side
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Conversation endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, userPreferences, language = 'English', context = {} } = req.body;
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI service is not initialized. Please ensure GEMINI_API_KEY is configured in Secrets.',
      });
    }

    const systemInstruction = `You are SHELBY, a master-class, futuristic, hyper-competent personal AI assistant with a calm, refined, and intelligent demeanor.
Your user and master is Rajveer. Address him respectfully as Rajveer or Rajveer sir. When he calls your name SHELBY, your natural acknowledgment is "Yes Rajveer".
Your voice persona when speaking English is natural, warm, and sophisticated with an Indian English accent cadence (clear, authoritative yet respectful, e.g. "Certainly, Rajveer", "Right away, Rajveer", "I have updated the telemetry").
You natively understand and fluently converse in:
1. English
2. Hindi (शुद्ध एवं सहज हिंदी)
3. Hinglish (natural urban Indian code-switching, e.g., "Haanji Rajveer, main check kar raha hoon", "Task complete ho gaya hai Rajveer")

CONVERSATION PRINCIPLES:
- Keep spoken & text responses concise, razor-sharp, and immediately actionable unless deep explanation is requested.
- Distinguish AI suggestions from verified executed actions. Do not claim a task was completed unless verified.
- When a command involves consequential actions (destructive file deletions, external payments, system-level modifications), flag that approval is needed.
- If a command is ambiguous, ask 1 brief clarifying question rather than guessing.
- Always be ready to adapt smoothly if the user switches topics or interrupts.
- Current language mode preferred: ${language}.
${userPreferences ? `User context & memories: ${JSON.stringify(userPreferences)}` : ''}
${context?.activeTask ? `Active task being tracked: ${JSON.stringify(context.activeTask)}` : ''}`;

    // Format contents
    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I'm standing by.";
    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({ error: error.message || 'Error processing request with Gemini' });
  }
});

// Multi-step task planner endpoint
app.post('/api/gemini/task-plan', async (req, res) => {
  try {
    const { taskGoal, parameters } = req.body;
    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI service unavailable' });
    }

    const prompt = `As SHELBY AI, formulate a structured execution plan for this goal: "${taskGoal}".
Parameters/Context: ${JSON.stringify(parameters || {})}

Return a valid JSON object strictly matching this schema:
{
  "title": "Short title of the task",
  "goal": "Summary of target outcome",
  "estimatedSeconds": 15,
  "requiresApproval": true,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "riskExplanation": "Why approval is needed or why it is safe",
  "steps": [
    {
      "id": "step-1",
      "title": "Short step title",
      "actionType": "system_check" | "data_fetch" | "file_operation" | "computation" | "verification",
      "description": "Clear step description",
      "consequential": false
    }
  ]
}
Keep it between 3 to 6 logical steps with realistic progression.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    const plan = JSON.parse(raw);
    res.json({ plan });
  } catch (error: any) {
    console.error('Task plan error:', error);
    res.status(500).json({ error: error.message || 'Error creating task plan' });
  }
});

// Dedicated Research Browser AI endpoint
app.post('/api/gemini/research', async (req, res) => {
  try {
    const { query, category = 'General' } = req.body;
    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI service unavailable' });
    }

    const prompt = `You are SHELBY's dedicated Research Intelligence Module.
Investigate this inquiry thoroughly: "${query}" (Category: ${category}).

Provide a comprehensive, high-density structured analysis in valid JSON format:
{
  "query": "${query}",
  "executiveSummary": "Concise 2-3 sentence core finding",
  "keyFindings": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "sources": [
    { "title": "Source 1 Title", "domain": "source1.org", "relevance": "High", "keyData": "Key fact" },
    { "title": "Source 2 Title", "domain": "source2.edu", "relevance": "Medium", "keyData": "Key fact" }
  ],
  "technicalDetails": "Detailed breakdown with metrics, dates, or specifications",
  "suggestedNextSteps": ["Follow-up query 1", "Follow-up query 2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const research = JSON.parse(response.text || '{}');
    res.json({ research });
  } catch (error: any) {
    console.error('Research error:', error);
    res.status(500).json({ error: error.message || 'Error generating research findings' });
  }
});

// Server-side Text-To-Speech with gemini-3.8-flash-lite-tts
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, voice = 'Zephyr' } = req.body;
    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI service unavailable' });
    }

    // Call gemini-3.8-flash-lite-tts for high-quality audio
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Clear, calm, futuristic assistant with a warm professional Indian English accent tone',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audioBase64: base64Audio, format: 'audio/wav' });
    } else {
      return res.status(500).json({ error: 'No audio generated by TTS model' });
    }
  } catch (error: any) {
    console.warn('TTS model fallback to client speech synthesis:', error?.message);
    res.status(500).json({ error: error.message || 'TTS generation unavailable' });
  }
});

// Status check and companion bridge check endpoint
app.get('/api/companion/status', (req, res) => {
  // Returns honest status of Windows companion integration
  res.json({
    bridgeInstalled: false,
    bridgePort: 41829,
    status: 'STANDALONE_BROWSER_MODE',
    message: 'Windows companion daemon not detected on 127.0.0.1:41829. Browser Stage 1 active.',
    featuresAvailableInBrowser: [
      'Genuine 3D WebGL Orbital Core',
      'Gemini Multilingual Intelligence (English, Hindi, Hinglish)',
      'Voice recognition & speech synthesis',
      'System-health client metrics (Battery API, Memory, Cores, Network)',
      'Sandboxed SHELBY file workspace',
      'Multi-step task planner & approval execution',
      'Persistent memory controls',
      'Floating orb HUD mode',
    ],
    featuresRequiringWindowsCompanion: [
      'Global Windows startup & background tray daemon',
      'OS-level unrestricted background wake-word listening when browser is closed',
      'Direct OS kernel CPU/RAM metrics and hardware sensors',
      'Arbitrary Windows desktop window switching and process automation',
      'Windows Credential Vault integration',
    ],
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SHELBY Server running on port ${PORT} [Full-Stack Gemini Active]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
