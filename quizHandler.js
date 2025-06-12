// quizHandler.js - CORRECTED AND COMPLETE
export let currentQuestionIndex = 0;
export let score = 0;
let questionsData = [];
let userAnswers = [];

export function startQuiz(data) {
    console.log('[QuizHandler.js] startQuiz called with data:', data);
    
    if (!Array.isArray(data) || data.length === 0) {
        console.error('[QuizHandler.js] ERROR: Data received in startQuiz is not a valid array or is empty!', data);
        const resultsArea = document.getElementById('resultsArea');
        resultsArea.textContent = 'Error: Could not load questions properly. Invalid data received.';
        resultsArea.style.display = 'block';
        document.getElementById('quizContainer').style.display = 'none';
        return;
    }

    questionsData = data;
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = []; // Reset user answers for a new quiz

    const resultsArea = document.getElementById('resultsArea');
    if(resultsArea) { // Defensive check
        resultsArea.innerHTML = ''; 
        resultsArea.style.display = 'none'; 
    }

    const quizContainer = document.getElementById('quizContainer');
    if(quizContainer) { // Defensive check
        quizContainer.innerHTML = ''; 
        quizContainer.style.display = 'block'; 
    } else {
        console.error("[QuizHandler.js] CRITICAL: quizContainer not found!");
        return;
    }

    displayCurrentQuestion();
}

function displayCurrentQuestion() {
    const questionContainer = document.getElementById('quizContainer');
    if (!questionContainer) {
        console.error("[QuizHandler.js] CRITICAL: quizContainer not found during displayCurrentQuestion!");
        return;
    }

    if (!questionsData || questionsData.length === 0 || !questionsData[currentQuestionIndex]) {
        console.error('[QuizHandler.js] ERROR: No question data available or invalid index for displayCurrentQuestion.');
        questionContainer.innerHTML = '<p>Error: Could not display current question. Data missing or index out of bounds.</p>';
        return;
    }
    const question = questionsData[currentQuestionIndex];

    if (!question || typeof question.question !== 'string' || !Array.isArray(question.options)) {
        console.error('[QuizHandler.js] ERROR: Current question object is malformed:', question);
        questionContainer.innerHTML = `<p>Error: Question data is malformed for question ${currentQuestionIndex + 1}. Please check server logs.</p>`;
        // Attempt to provide a way to move forward or indicate failure
        const nextButton = document.getElementById('nextQuestionButton'); // Assuming it might be created by now
        if (nextButton) nextButton.style.display = 'block'; 
        const submitButton = document.getElementById('submitAnswerButton');
        if (submitButton) submitButton.style.display = 'none';
        return;
    }

    questionContainer.innerHTML = `
        <p style="text-align: right; font-size: 0.9em; color: #555;">Question ${currentQuestionIndex + 1} of ${questionsData.length}</p>
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

    const submitButton = document.getElementById('submitAnswerButton');
    const nextButtonElement = document.getElementById('nextQuestionButton'); // Renamed to avoid conflict

    if (submitButton) {
        submitButton.addEventListener('click', checkAnswer);
    } else {
        console.error("[QuizHandler.js] Submit Answer button not found after rendering question.");
    }
    if (nextButtonElement) {
        nextButtonElement.addEventListener('click', loadNextQuestion);
    } else {
        console.error("[QuizHandler.js] Next Question button not found after rendering question.");
    }
}

function checkAnswer() {
    const selectedOptionRadio = document.querySelector('input[name="option"]:checked');
    const feedback = document.getElementById('feedback');

    if (!feedback) {
        console.error("[QuizHandler.js] Feedback element not found!");
        return;
    }
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

    userAnswers[currentQuestionIndex] = selectedAnswer; // Store the user's answer

    if (selectedAnswer === question.correctAnswer) {
        score++;
        feedback.innerHTML = `<p style="color: green;">Correct!</p>`;
    } else {
        feedback.innerHTML = `<p style="color: red;">Incorrect. The correct answer was: ${question.correctAnswer}</p>`;
    }

    if (question.explanation && typeof question.explanation === 'string' && question.explanation.trim() !== '') {
        feedback.innerHTML += `<p>${question.explanation}</p>`;
    }

    const submitButton = document.getElementById('submitAnswerButton');
    const nextButton = document.getElementById('nextQuestionButton');
    if (submitButton) submitButton.style.display = 'none';
    if (nextButton) nextButton.style.display = 'block';

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
    if (!questionContainer) {
        console.error("[QuizHandler.js] CRITICAL: quizContainer not found during showResults!");
        return;
    }

    const percentage = questionsData.length > 0 ? (score / questionsData.length) * 100 : 0;
    let reviewHtml = '';

    questionsData.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        reviewHtml += `
            <div class="review-item" style="margin-bottom: 15px; padding: 10px; border: 1px solid ${isCorrect ? 'green' : 'red'}; border-radius: 4px;">
                <p><strong>Question ${index + 1}:</strong> ${question.question}</p>
                <p>Your answer: <span style="color: ${isCorrect ? 'green' : 'red'};">${userAnswer || 'Not answered'}</span></p>
                ${!isCorrect ? `<p>Correct answer: ${question.correctAnswer}</p>` : ''}
                ${question.explanation ? `<p style="font-size: 0.9em; color: #444;"><em>Explanation: ${question.explanation}</em></p>` : ''}
            </div>
        `;
    });

    questionContainer.innerHTML = `
        <h2>Quiz Completed!</h2>
        <p>You scored ${score} out of ${questionsData.length} (${percentage.toFixed(1)}%).</p>
        <h3>Answer Review:</h3>
        <div id="answerReviewContainer">${reviewHtml}</div>
        <button id="restartQuizButton">Restart Quiz</button>
    `;

    const restartButton = document.getElementById('restartQuizButton');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            const resultsArea = document.getElementById('resultsArea');
            const quizContainerInner = document.getElementById('quizContainer');
            if(resultsArea) resultsArea.style.display = 'none';
            if(quizContainerInner) quizContainerInner.style.display = 'block';
            startQuiz(questionsData); 
        });
    } else {
        console.error("[QuizHandler.js] Restart Quiz button not found after rendering results.");
    }
}