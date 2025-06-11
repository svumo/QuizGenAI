export let currentQuestionIndex = 0;
export let score = 0;
let questionsData = [];

export function startQuiz(data) {
    console.log('[QuizHandler.js] startQuiz called.');
    
    if (!Array.isArray(data) || data.length === 0) { // More robust check
        console.error('[QuizHandler.js] ERROR: Data received in startQuiz is not a valid array or is empty!', data);
        const resultsArea = document.getElementById('resultsArea');
        resultsArea.textContent = 'Error: Could not load questions properly.';
        resultsArea.style.display = 'block';
        document.getElementById('quizContainer').style.display = 'none';
        return;
    }

    questionsData = data;
    currentQuestionIndex = 0;
    score = 0;

    const resultsArea = document.getElementById('resultsArea');
    resultsArea.innerHTML = ''; 
    resultsArea.style.display = 'none'; 

    const quizContainer = document.getElementById('quizContainer');
    quizContainer.innerHTML = ''; 
    quizContainer.style.display = 'block'; 

    displayCurrentQuestion();
}

function displayCurrentQuestion() {
    const questionContainer = document.getElementById('quizContainer');
    if (!questionsData || questionsData.length === 0 || !questionsData[currentQuestionIndex]) {
        console.error('[QuizHandler.js] ERROR: No question data available or invalid index for displayCurrentQuestion.');
        questionContainer.innerHTML = '<p>Error: Could not display question.</p>';
        return;
    }
    const question = questionsData[currentQuestionIndex];

    if (!question || typeof question.question !== 'string' || !Array.isArray(question.options)) {
        console.error('[QuizHandler.js] ERROR: Current question object is malformed:', question);
        questionContainer.innerHTML = `<p>Error: Question data is malformed for question ${currentQuestionIndex + 1}.</p>`;
        const nextButton = document.getElementById('nextQuestionButton');
        if (nextButton) nextButton.style.display = 'block'; 
        const submitButton = document.getElementById('submitAnswerButton');
        if (submitButton) submitButton.style.display = 'none';
        return;
    }

    questionContainer.innerHTML = `
        <h2>${question.question}</h2>
        <div id="optionsContainer">
            ${question.options.map((option, index) => `
                <div class="option-item">
                    <input type="radio" name="option" id="option${index}" value="${option}" class="sr-only-radio">
                    <label for="option${index}" class="option-label">${option}</label>
                </div>
            `).join('')}
        </div>
        <button id="submitAnswerButton">Submit Answer</button>
        <button id="nextQuestionButton" style="display: none;">Next Question</button>
        <div id="feedback"></div>
    `;

    document.getElementById('submitAnswerButton').addEventListener('click', checkAnswer);
    document.getElementById('nextQuestionButton').addEventListener('click', loadNextQuestion);
}

function checkAnswer() {
    const selectedOptionRadio = document.querySelector('input[name="option"]:checked');
    const feedback = document.getElementById('feedback');

    if (!selectedOptionRadio) {
        feedback.textContent = 'Please select an option.';
        return;
    }

    const selectedAnswer = selectedOptionRadio.value;
    const question = questionsData[currentQuestionIndex];

    if (!question || typeof question.correctAnswer !== 'string') {
        console.error('[QuizHandler.js] ERROR: Malformed question or missing correctAnswer during checkAnswer:', question);
        feedback.textContent = 'Error: Cannot check answer due to malformed question data.';
        document.getElementById('submitAnswerButton').style.display = 'none';
        document.getElementById('nextQuestionButton').style.display = 'block';
        return;
    }

    if (selectedAnswer === question.correctAnswer) {
        score++;
        feedback.innerHTML = `<p style="color: green;">Correct!</p>`;
    } else {
        feedback.innerHTML = `<p style="color: red;">Incorrect. The correct answer was: ${question.correctAnswer}</p>`;
    }

    if (question.explanation && typeof question.explanation === 'string' && question.explanation.trim() !== '') {
        feedback.innerHTML += `<p>${question.explanation}</p>`;
    }

    document.getElementById('submitAnswerButton').style.display = 'none';
    document.getElementById('nextQuestionButton').style.display = 'block';

    const optionsRadios = document.querySelectorAll('input[name="option"]');
    optionsRadios.forEach(radio => radio.disabled = true);
}

function loadNextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < questionsData.length) {
        displayCurrentQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    const questionContainer = document.getElementById('quizContainer');
    questionContainer.innerHTML = `
        <h2>Quiz Completed!</h2>
        <p>You scored ${score} out of ${questionsData.length}.</p>
        <button id="restartQuizButton">Restart Quiz</button>
    `;

    document.getElementById('restartQuizButton').addEventListener('click', () => {
        document.getElementById('resultsArea').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        startQuiz(questionsData); 
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateButton'); // Corrected ID
    const resultsArea = document.getElementById('resultsArea');

    generateButton.addEventListener('click', async () => {
        console.log('Button clicked');

        const sourceText = document.getElementById('sourceText').value;
        const numQuestions = parseInt(document.getElementById('numQuestions').value, 10);

        console.log('Source Text:', sourceText);
        console.log('Number of Questions:', numQuestions);

        if (!sourceText.trim()) {
            console.log('Validation failed: Source text empty.');
            resultsArea.textContent = 'Error: Source text cannot be empty.';
            return;
        }

        if (isNaN(numQuestions) || numQuestions <= 0) {
            console.log('Validation failed: Invalid number of questions.');
            resultsArea.textContent = 'Error: Number of questions must be a positive number.';
            return;
        }

        console.log('Validation passed. Proceeding to API call.');
        resultsArea.textContent = 'Generating...';

        try {
            const response = await fetch('/api/generate-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sourceText, numQuestions }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (Array.isArray(data.questions)) {
                resultsArea.textContent = '';
                startQuiz(data.questions);
            } else {
                resultsArea.textContent = 'Error: Invalid response from server.';
            }
        } catch (error) {
            console.error('Error during API call:', error);
            resultsArea.textContent = 'Error: Could not generate questions.';
        }
    });
});