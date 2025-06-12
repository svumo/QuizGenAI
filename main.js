// main.js - CORRECTED AND COMPLETE
import { startQuiz } from './quizHandler.js';

document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateButton');
    const resultsArea = document.getElementById('resultsArea');
    const quizContainer = document.getElementById('quizContainer');

    if (generateButton) {
        generateButton.addEventListener('click', async () => {
            console.log('[Main.js] Generate Questions button CLICKED!');

            const sourceTextElement = document.getElementById('sourceText');
            const numQuestionsElement = document.getElementById('numQuestions');

            const sourceTextValue = sourceTextElement.value; // Use a different variable name to avoid confusion
            const numQuestionsValue = parseInt(numQuestionsElement.value, 10);

            console.log('[Main.js] Source Text from textarea:', sourceTextValue);
            console.log('[Main.js] Number of Questions from input:', numQuestionsValue);

            // --- Frontend Validation ---
            if (!sourceTextValue.trim()) {
                resultsArea.textContent = 'Error: Source text cannot be empty.';
                resultsArea.style.display = 'block';
                quizContainer.style.display = 'none';
                console.log('[Main.js] Validation failed: Source text empty.');
                return;
            }

            if (isNaN(numQuestionsValue) || numQuestionsValue <= 0) {
                resultsArea.textContent = 'Error: Number of questions must be a positive number.';
                resultsArea.style.display = 'block';
                quizContainer.style.display = 'none';
                console.log('[Main.js] Validation failed: Invalid number of questions.');
                return;
            }
            // --- End of Frontend Validation ---

            console.log('[Main.js] Validation passed. Proceeding to API call.');
            resultsArea.textContent = 'Generating...';
            resultsArea.style.display = 'block';
            quizContainer.style.display = 'none';

            try {
                const response = await fetch('/api/generate-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: sourceTextValue, numQuestions: numQuestionsValue }) // Send correct values
                });

                // Clear "Generating..." or previous error message from resultsArea once response starts coming.
                // We will update it again based on success or failure.
                resultsArea.innerHTML = ''; 
                resultsArea.style.display = 'none';

                if (!response.ok) {
                    let errorMsg = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || `Server error: ${response.statusText}`;
                    } catch (e) {
                        // If response is not JSON, use statusText or a generic message
                        console.warn('[Main.js] Could not parse error response as JSON for !response.ok.', e);
                        errorMsg = `Server error: ${response.statusText || 'Failed to get detailed error.'}`;
                    }
                    console.error('[Main.js] Error during API call:', errorMsg);
                    resultsArea.textContent = `Error: ${errorMsg}`;
                    resultsArea.style.display = 'block';
                    quizContainer.style.display = 'none';
                    return; 
                }

                const data = await response.json();
                console.log('[Main.js] Data received from backend:', data);

                if (data.questions && data.questions.length > 0) {
                    sourceTextElement.value = ''; // Clear textarea
                    numQuestionsElement.value = '5'; // Reset num questions to default

                    quizContainer.style.display = 'block';
                    startQuiz(data.questions);
                } else {
                    console.error('[Main.js] No questions received or questions array is empty.');
                    resultsArea.textContent = 'Error: No questions were returned by the server. The AI might have had an issue or the source text was unsuitable.';
                    resultsArea.style.display = 'block';
                    quizContainer.style.display = 'none';
                }

            } catch (error) {
                console.error('[Main.js] Network or other fetch error:', error);
                resultsArea.textContent = 'Error: Failed to connect to the server or a network issue occurred. Please check your connection and ensure the server is running.';
                resultsArea.style.display = 'block';
                quizContainer.style.display = 'none';
            }
        });
    } else {
        console.error('[Main.js] CRITICAL: Generate button not found on the page!');
    }
});