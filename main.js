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

    // Add event listeners for navigation and Revision Mode logic

    // Landing Page Navigation
    const generateQuizButton = document.getElementById('generateQuizButton');
    const revisionModeButton = document.getElementById('revisionModeButton');
    const goBackButtonQuiz = document.getElementById('goBackButtonQuiz');
    const goBackButtonRevision = document.getElementById('goBackButtonRevision');
    const landingPage = document.getElementById('landingPage');
    const quizSection = document.getElementById('quizSection');
    const revisionModeSection = document.getElementById('revisionModeSection');

    if (generateQuizButton) {
        generateQuizButton.addEventListener('click', () => {
            landingPage.style.display = 'none';
            quizSection.style.display = 'block';
        });
    }

    if (revisionModeButton) {
        revisionModeButton.addEventListener('click', () => {
            landingPage.style.display = 'none';
            revisionModeSection.style.display = 'block';
        });
    }

    if (goBackButtonQuiz) {
        goBackButtonQuiz.addEventListener('click', () => {
            quizSection.style.display = 'none';
            landingPage.style.display = 'block';
        });
    }

    if (goBackButtonRevision) {
        goBackButtonRevision.addEventListener('click', () => {
            revisionModeSection.style.display = 'none';
            landingPage.style.display = 'block';
        });
    }

    // Revision Mode Logic
    const generateInfoButton = document.getElementById('generateInfoButton');
    const expandInfoButton = document.getElementById('expandInfoButton');
    const topicInput = document.getElementById('topicInput');
    const infoDisplayArea = document.getElementById('infoDisplayArea');
    const expandSection = document.getElementById('expandSection');
    const expandQueryInput = document.getElementById('expandQueryInput');

    if (generateInfoButton) {
        generateInfoButton.addEventListener('click', async () => {
            const topic = topicInput.value.trim();
            if (!topic) {
                infoDisplayArea.textContent = 'Error: Topic cannot be empty.';
                return;
            }
            infoDisplayArea.value = 'Generating information...';
            try {
                const response = await fetch('/api/generate-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic })
                });
                const data = await response.json();
                if (response.ok) {
                    infoDisplayArea.value = data.informationalText;
                    expandSection.style.display = 'block';
                } else {
                    infoDisplayArea.value = `Error: ${data.error}`;
                }
            } catch (error) {
                infoDisplayArea.value = 'Error: Failed to fetch information.';
            }
        });
    }

    if (expandInfoButton) {
        expandInfoButton.addEventListener('click', async () => {
            const expansionQuery = expandQueryInput.value.trim();
            const currentText = infoDisplayArea.value;
            if (!expansionQuery) {
                infoDisplayArea.value += '\n\nError: Expansion query cannot be empty.';
                return;
            }
            infoDisplayArea.value += '\n\nExpanding information...';
            try {
                const response = await fetch('/api/generate-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic: topicInput.value.trim(), currentText, expansionQuery })
                });
                const data = await response.json();
                if (response.ok) {
                    infoDisplayArea.value = data.informationalText;
                } else {
                    infoDisplayArea.value += `\nError: ${data.error}`;
                }
            } catch (error) {
                infoDisplayArea.value += '\n\nError: Failed to fetch expanded information.';
            }
        });
    }
});