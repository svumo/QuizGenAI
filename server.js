import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import open from 'open';
import path from 'path';        // Needed for __dirname equivalent
import { fileURLToPath } from 'url'; // Needed for __dirname equivalent

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Load environment variables

// Initialize Express app
const app = express();

// Enable CORS
app.use(cors());

// Enable JSON parsing for request bodies
app.use(express.json());

// Serve static files from the current directory (project root)
app.use(express.static(__dirname));

// Define the port
const PORT = process.env.PORT || 5000;

// Function to generate MCQs using OpenAI API
async function generateMCQs(textInput, numQuestions = 5, apiKey, model = 'gpt-3.5-turbo-0125') {
    console.log('[QuizMaster][aiService] Starting question generation...');

    const prompt = `
        Generate ${numQuestions} multiple-choice questions based on the following text:
        "${textInput}"
        Each question should include:
        - A "question" field (string).
        - An "options" field (array of 4 strings).
        - A "correctAnswer" field (string, matching one of the options).
        - An "explanation" field (string, explaining the correct answer).
        Return the result as a JSON object with a "questions" key containing an array of questions. Ensure the output is valid JSON.
    `;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('[QuizMaster][aiService] OpenAI API raw response data:', response.data);

        if (!response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
            console.error('[QuizMaster][aiService] ERROR: OpenAI response missing, malformed, or empty `choices` array:', response.data);
            throw new Error('Missing, malformed, or empty `choices` array in OpenAI response.');
        }

        const message = response.data.choices[0].message;
        if (!message || typeof message.content !== 'string') {
            console.error('[QuizMaster][aiService] ERROR: OpenAI response `message.content` is missing or not a string:', message);
            throw new Error('Missing or malformed `message.content` in OpenAI response.');
        }

        let questionsDataParsed;
        try {
            questionsDataParsed = JSON.parse(message.content);
        } catch (parseError) {
            console.error('[QuizMaster][aiService] ERROR: Failed to parse `message.content` as JSON:', message.content, parseError);
            const jsonMatch = message.content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    questionsDataParsed = JSON.parse(jsonMatch[1]);
                    console.log('[QuizMaster][aiService] Successfully parsed extracted JSON from triple backticks.');
                } catch (nestedParseError) {
                    console.error('[QuizMaster][aiService] ERROR: Failed to parse extracted JSON:', jsonMatch[1], nestedParseError);
                    throw new Error(`Failed to parse message.content as JSON, even after attempting to extract from backticks. Content: ${message.content}`);
                }
            } else {
                 throw new Error(`Failed to parse message.content as JSON. Content: ${message.content}`);
            }
        }
        
        const questionsArray = questionsDataParsed.questions;

        if (!questionsArray || !Array.isArray(questionsArray)) {
             console.error('[QuizMaster][aiService] ERROR: Parsed content does not contain a "questions" array:', questionsDataParsed);
             throw new Error('Parsed content does not contain a "questions" array.');
        }

        const validQuestions = questionsArray.filter(q => {
            return (
                q && 
                typeof q.question === 'string' && q.question.trim() !== '' &&
                Array.isArray(q.options) && q.options.length >= 2 && 
                q.options.every(opt => typeof opt === 'string' && opt.trim() !== '') &&
                typeof q.correctAnswer === 'string' && q.options.includes(q.correctAnswer) &&
                typeof q.explanation === 'string' 
            );
        });

        if (validQuestions.length === 0 && questionsArray.length > 0) {
            console.warn('[QuizMaster][aiService] WARNING: No questions passed validation. Original questions:', questionsArray);
            throw new Error('No valid questions generated after validation.');
        }
         if (validQuestions.length === 0 && questionsArray.length === 0) {
            console.error('[QuizMaster][aiService] ERROR: No questions generated or extracted.');
            throw new Error('No questions generated or extracted from AI response.');
        }

        console.log('[QuizMaster][aiService] Valid questions generated:', validQuestions);
        return validQuestions;
    } catch (error) {
        if (error.isAxiosError) {
            console.error('[QuizMaster][aiService] Axios error details:', error.toJSON());
        } else {
            console.error('[QuizMaster][aiService] Error in generateMCQs function:', error.message);
        }
        throw new Error(`Error generating questions: ${error.message}`);
    }
}

// API endpoint to generate questions
app.post('/api/generate-questions', async (req, res) => {
    console.log('[Server API] Received request body:', req.body); // Logging request body
    const { text, numQuestions = 5, model = 'gpt-3.5-turbo-0125' } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ error: 'Source text cannot be empty.' });
    }
    if (!Number.isInteger(numQuestions) || numQuestions <= 0) {
        return res.status(400).json({ error: 'Number of questions must be a positive integer.' });
    }
    if (!apiKey) {
        console.error('[QuizMaster][API] OpenAI API key is missing from environment variables.');
        return res.status(500).json({ error: 'Server configuration error: OpenAI API key is missing.' });
    }

    try {
        const generatedQuestions = await generateMCQs(text, numQuestions, apiKey, model);
        res.status(200).json({ questions: generatedQuestions });
    } catch (error) {
        console.error('[QuizMaster][API] Error during question generation process:', error.message);
        res.status(500).json({ error: 'An error occurred while generating questions. Please try again later.' });
    }
});

// Start the server
app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`[QuizMaster] Server running on port ${PORT}`);
    console.log(`[QuizMaster] Frontend available at ${url}`);
    open(url).catch(err => console.error('Error opening browser:', err));
});