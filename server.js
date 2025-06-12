import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// --- CRITICAL: API Key Check ---
// Check for the API key right at the start.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error("\x1b[31m%s\x1b[0m", "FATAL ERROR: OPENAI_API_KEY is not defined in your .env file.");
    console.error("Please create a .env file in the root of your project.");
    console.error("Add your key to it, for example: OPENAI_API_KEY=sk-YourActualKey");
    process.exit(1); // Exit the application immediately
}

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Constants
const PORT = process.env.PORT || 5000;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// --- API Helper Functions ---

async function callOpenAI(prompt, model = 'gpt-3.5-turbo', isJson = false) {
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
    };
    const body = {
        model,
        messages: [{ role: 'user', content: prompt }],
    };
    if (isJson) {
        body.response_format = { type: 'json_object' };
    }

    try {
        const response = await axios.post(OPENAI_API_URL, body, { headers });
        if (!response.data.choices || response.data.choices.length === 0) {
            throw new Error('Invalid response structure from OpenAI API.');
        }
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('[AI_CALL_ERROR] Error calling OpenAI API:', error.message);
        if (error.response) {
            console.error('[AI_CALL_ERROR] Details:', error.response.data);
        }
        // Re-throw a more user-friendly error to be caught by the endpoint
        throw new Error('Failed to get a response from the AI service.');
    }
}

// --- API Endpoints ---

app.post('/api/generate-questions', async (req, res) => {
    console.log('[API /generate-questions] Received request.');
    const { text, numQuestions = 5 } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ error: 'Source text cannot be empty.' });
    }
    if (!Number.isInteger(numQuestions) || numQuestions <= 0) {
        return res.status(400).json({ error: 'Number of questions must be a positive integer.' });
    }

    const prompt = `
        Generate ${numQuestions} multiple-choice questions based on the following text: "${text}"
        Each question must include "question", "options" (array of 4 strings), "correctAnswer", and "explanation" fields.
        Return the result as a single, valid JSON object with a root key "questions" containing an array of these question objects.
    `;

    try {
        const jsonString = await callOpenAI(prompt, 'gpt-3.5-turbo-0125', true);
        const data = JSON.parse(jsonString); // The AI should return valid JSON now
        if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error("AI response did not contain a 'questions' array.");
        }
        res.status(200).json({ questions: data.questions });
    } catch (error) {
        console.error('[API /generate-questions] Failed to generate questions:', error.message);
        res.status(500).json({ error: 'An error occurred while generating questions.' });
    }
});

app.post('/api/generate-info', async (req, res) => {
    console.log('[API /generate-info] Received request.');
    const { topic, currentText, expansionQuery } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
        return res.status(400).json({ error: 'Topic cannot be empty.' });
    }

    let prompt;
    if (expansionQuery && currentText) {
        prompt = `The user is learning about "${topic}" from this text: "${currentText}". Expand on this specific query: "${expansionQuery}". Provide a detailed, well-structured response.`;
    } else {
        prompt = `Generate comprehensive information about the topic: "${topic}". Structure it in clear paragraphs, suitable for a beginner.`;
    }

    try {
        const informationalText = await callOpenAI(prompt);
        res.json({ informationalText });
    } catch (error) {
        console.error('[API /generate-info] Failed to generate info:', error.message);
        res.status(500).json({ error: 'An error occurred while generating information.' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log("\x1b[32m%s\x1b[0m", `[OK] Server is running on port ${PORT}`);
    console.log(`[INFO] Frontend available at ${url}`);
    open(url).catch(err => console.error('Could not automatically open browser:', err));
});