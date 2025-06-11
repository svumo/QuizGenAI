export let currentQuestionIndex = 0;
export let score = 0;
let questionsData = [];

export function startQuiz(data) {
    console.log('[QuizHandler.js] startQuiz called.');
    
    if (!Array.isArray(data) || data.length === 0) {
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