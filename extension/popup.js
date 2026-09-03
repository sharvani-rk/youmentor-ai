import {
    saveAgentToNotebook,
    isAgentSaved
} from "./utils/notebook.js";
// ======================================================
// DOM ELEMENTS
// ======================================================

const summaryBtn = document.getElementById("summaryBtn");
const explainBtn = document.getElementById("explainBtn");
const quizBtn = document.getElementById("quizBtn");
const vocabularyBtn = document.getElementById("vocabularyBtn");
const flashcardsBtn = document.getElementById("flashcardsBtn");

const output = document.getElementById("output");
const notesBtn = document.getElementById("notesBtn");


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentVideoUrl = "";
let currentVideoTitle = "";

let currentSummary = null;
let currentQuiz = null;
let currentVocabulary = null;
let currentFlashcards = null;


// ======================================================
// GET VIDEO ID
// ======================================================

function getVideoId(url) {

    try {

        const parsed = new URL(url);

        return parsed.searchParams.get("v");

    }

    catch (error) {

        return null;

    }

}


// ======================================================
// GET CURRENT VIDEO
// ======================================================

async function getCurrentVideo() {

    const [tab] = await chrome.tabs.query({

        active: true,
        currentWindow: true

    });


    if (!tab || !tab.url) {

        throw new Error(
            "Unable to detect current YouTube video."
        );

    }


    if (
        !tab.url.includes("youtube.com/watch") &&
        !tab.url.includes("youtu.be/")
    ) {

        throw new Error(
            "Please open a YouTube video first."
        );

    }


    currentVideoUrl = tab.url;

    currentVideoTitle =
        tab.title || "YouTube Video";


    return tab;

}


// ======================================================
// SHOW LOADING
// ======================================================

function showLoading(message) {

    output.innerHTML = `

        <div class="loading">

            <div class="spinner"></div>

            <p>${message}</p>

        </div>

    `;

}


// ======================================================
// SHOW ERROR
// ======================================================

function showError(message) {

    output.innerHTML = `

        <div class="section error-section">

            <h2>
                ❌ Error
            </h2>

            <p>
                ${message}
            </p>

        </div>

    `;

}


// ======================================================
// TOAST
// ======================================================

function showToast(message, success = true) {

    const toast =
        document.createElement("div");

    toast.className = "toast";

    if (!success) {

        toast.classList.add("error");

    }

    toast.textContent = message;

    document.body.appendChild(toast);


    setTimeout(() => {

        toast.classList.add("show");

    }, 100);


    setTimeout(() => {

        toast.remove();

    }, 3000);

}


// ======================================================
// MY NOTES
// ======================================================

notesBtn.addEventListener("click", () => {

    chrome.tabs.create({

        url: chrome.runtime.getURL(
            "notes.html"
        )

    });

});


// ======================================================
// SUMMARY AGENT
// ======================================================

summaryBtn.addEventListener(
    "click",
    async () => {

        showLoading(
            "Generating AI Summary..."
        );


        try {

            await getCurrentVideo();


            const response = await fetch(
                "http://127.0.0.1:5000/summary",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        url: currentVideoUrl
                    })

                }
            );


            if (!response.ok) {

                throw new Error(
                    `Backend returned ${response.status}`
                );

            }


            const data =
                await response.json();


            if (data.success === false) {

                throw new Error(
                    data.message
                );

            }


            currentSummary =
                data.summary;


            renderSummary();

        }

        catch (error) {

            console.error(error);

            showError(error.message);

        }

    }
);


// ======================================================
// RENDER SUMMARY
// ======================================================

async function renderSummary() {

    const videoId =
        getVideoId(currentVideoUrl);


    let alreadySaved = false;


    if (videoId) {

        alreadySaved =
            await isAgentSaved(
            videoId,
            "summary"
        );

    }


    output.innerHTML = `

        <div class="section">

            <h2>
                📄 Overview
            </h2>

            <p>
                ${currentSummary.overview || ""}
            </p>

        </div>


        <div class="section">

            <h2>
                🔑 Key Points
            </h2>

            <ul>

                ${
                    Array.isArray(
                        currentSummary.key_points
                    )

                    ?

                    currentSummary.key_points
                        .map(
                            point =>
                                `<li>${point}</li>`
                        )
                        .join("")

                    :

                    "<li>No key points available.</li>"
                }

            </ul>

        </div>


        <div class="section">

            <h2>
                💡 Important Concepts
            </h2>

            ${
                Array.isArray(
                    currentSummary.important_concepts
                )

                ?

                currentSummary.important_concepts
                    .map(
                        concept => `

                            <div class="concept">

                                <strong>
                                    ${concept.term}
                                </strong>

                                <p>
                                    ${concept.meaning}
                                </p>

                            </div>

                        `
                    )
                    .join("")

                :

                "<p>No concepts available.</p>"
            }

        </div>


        <div class="section">

            <h2>
                🎯 Final Takeaway
            </h2>

            <p>
                ${currentSummary.takeaway || ""}
            </p>

        </div>


        <button
            id="saveSummaryBtn"
            class="save-btn"
            ${alreadySaved ? "disabled" : ""}
        >

            ${
                alreadySaved
                ? "✔ Saved to Notes"
                : "📥 Add to Notes"
            }

        </button>

    `;


    const saveButton =
        document.getElementById(
            "saveSummaryBtn"
        );


    if (!alreadySaved) {

        saveButton.addEventListener(
            "click",
            async () => {

                try {

                    await saveAgentToNotebook({

                    videoId,

                    title:
                        currentVideoTitle,

                    url:
                        currentVideoUrl,

                    agent:
                        "summary",

                    data:
                        currentSummary

                });


                saveButton.textContent =
                    "✔ Saved to Notes";

                saveButton.disabled =
                    true;


                showToast(
                    "✅ Summary added to My Notes!"
                );

            }

                catch (error) {

                    console.error(error);

                    showToast(
                        "Unable to save note.",
                        false
                    );

                }

            }
        );

    }

}


// ======================================================
// EXPLANATION AGENT
// ======================================================

explainBtn.addEventListener(
    "click",
    async () => {

        showLoading(
            "Generating AI Explanation..."
        );


        try {

            await getCurrentVideo();


            const response = await fetch(
                "http://127.0.0.1:5000/explain",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        url: currentVideoUrl
                    })

                }
            );


            if (!response.ok) {

                throw new Error(
                    `Backend returned ${response.status}`
                );

            }


            const data =
                await response.json();


            if (data.success === false) {

                throw new Error(
                    data.message
                );

            }


            const explanation =
                data.explanation;


            renderExplanation(
                explanation
            );

        }

        catch (error) {

            console.error(error);

            showError(error.message);

        }

    }
);


// ======================================================
// RENDER EXPLANATION
// ======================================================

async function renderExplanation(explanation) {

    output.innerHTML = `

        <div class="section">

            <h2>
                💡 Overview
            </h2>

            <p>
                ${explanation.overview || ""}
            </p>

        </div>


        <div class="section">

            <h2>
                📖 Concepts Explained
            </h2>

            ${
                Array.isArray(
                    explanation.concepts
                )

                ?

                explanation.concepts
                    .map(
                        concept => `

                            <div class="concept">

                                <strong>
                                    ${concept.term}
                                </strong>

                                <p>
                                    ${concept.explanation}
                                </p>


                                ${
                                    concept.example

                                    ?

                                    `

                                        <div class="example">

                                            <strong>
                                                💬 Example
                                            </strong>

                                            <p>
                                                ${concept.example}
                                            </p>

                                        </div>

                                    `

                                    :

                                    ""
                                }

                            </div>

                        `
                    )
                    .join("")

                :

                "<p>No concepts available.</p>"
            }

        </div>


        <div class="section">

            <h2>
                🧠 In Simple Words
            </h2>

            <p>
                ${explanation.simple_explanation || ""}
            </p>

        </div>


        <div class="section">

            <h2>
                🎯 Key Takeaway
            </h2>

            <p>
                ${explanation.key_takeaway || ""}
            </p>

        </div>
        <button
            id="saveExplanationBtn"
            class="save-btn"
        >
            📥 Add Explanation to Notes
        </button>

    `;
    const saveButton =
    document.getElementById("saveExplanationBtn");

const videoId =
    getVideoId(currentVideoUrl);

const alreadySaved =
    await isAgentSaved(
        videoId,
        "explanation"
    );

if (alreadySaved) {

    saveButton.textContent =
        "✔ Explanation Saved";

    saveButton.disabled = true;

}
else {

    saveButton.addEventListener(
        "click",
        async () => {

            try {

                await saveAgentToNotebook({

                    videoId,

                    title: currentVideoTitle,

                    url: currentVideoUrl,

                    agent: "explanation",

                    data: explanation

                });

                saveButton.textContent =
                    "✔ Explanation Saved";

                saveButton.disabled = true;

                showToast(
                    "✅ Explanation added to My Notes!"
                );

            }

            catch (error) {

                console.error(error);

                showToast(
                    "Unable to save explanation.",
                    false
                );

            }

        }
    );

}

}


// ======================================================
// QUIZ AGENT
// ======================================================

quizBtn.addEventListener(
    "click",
    async () => {

        showLoading(
            "Generating Quiz..."
        );


        try {

            await getCurrentVideo();


            const response = await fetch(
                "http://127.0.0.1:5000/quiz",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        url: currentVideoUrl
                    })

                }
            );


            if (!response.ok) {

                throw new Error(
                    `Backend returned ${response.status}`
                );

            }


            const data =
                await response.json();


            if (data.success === false) {

                throw new Error(
                    data.message
                );

            }


            currentQuiz =
                data.quiz;


            startQuiz(currentQuiz);

        }

        catch (error) {

            console.error(error);

            showError(error.message);

        }

    }
);


// ======================================================
// START QUIZ
// ======================================================

function startQuiz(quiz) {

    if (
        !quiz ||
        !Array.isArray(quiz.questions) ||
        quiz.questions.length === 0
    ) {

        throw new Error(
            "Invalid quiz data."
        );

    }


    let currentQuestion = 0;

    let score = 0;


    renderQuestion();


    function renderQuestion() {

        const question =
            quiz.questions[currentQuestion];


        output.innerHTML = `

            <div class="section quiz-card">

                <div class="quiz-header">

                    <h2>
                        🎯 ${quiz.title || "Video Quiz"}
                    </h2>

                    <span>
                        ${currentQuestion + 1}
                        /
                        ${quiz.questions.length}
                    </span>

                </div>


                <div class="progress-bar">

                    <div
                        class="progress"
                        style="
                            width:
                            ${
                                (
                                    (currentQuestion + 1)
                                    /
                                    quiz.questions.length
                                ) * 100
                            }%;
                        "
                    ></div>

                </div>


                <h3 class="question-text">

                    ${question.question}

                </h3>


                <div class="quiz-options">

                    ${
                        question.options
                            .map(
                                option => `

                                    <button
                                        class="quiz-option"
                                    >
                                        ${option}
                                    </button>

                                `
                            )
                            .join("")
                    }

                </div>


                <div
                    id="quizFeedback"
                    class="quiz-feedback"
                ></div>


                <button
                    id="nextQuestionBtn"
                    class="next-btn"
                    disabled
                >

                    ${
                        currentQuestion ===
                        quiz.questions.length - 1

                        ?

                        "Finish Quiz 🎉"

                        :

                        "Next Question →"
                    }

                </button>

            </div>

        `;


        const buttons =
            document.querySelectorAll(
                ".quiz-option"
            );


        const feedback =
            document.getElementById(
                "quizFeedback"
            );


        const nextButton =
            document.getElementById(
                "nextQuestionBtn"
            );


        let answered = false;


        buttons.forEach(
            (button, index) => {

                button.addEventListener(
                    "click",
                    () => {

                        if (answered) {
                            return;
                        }


                        answered = true;


                        const selected =
                            question.options[index];


                        const correct =
                            question.correct_answer;


                        buttons.forEach(
                            btn => {
                                btn.disabled = true;
                            }
                        );


                        if (
                            selected ===
                            correct
                        ) {

                            score++;


                            button.classList.add(
                                "correct"
                            );


                            feedback.innerHTML = `

                                <strong>
                                    ✅ Correct!
                                </strong>

                                <p>
                                    ${question.explanation}
                                </p>

                            `;

                        }

                        else {

                            button.classList.add(
                                "wrong"
                            );


                            buttons.forEach(
                                btn => {

                                    if (
                                        btn.textContent
                                            .trim() ===
                                        correct
                                    ) {

                                        btn.classList.add(
                                            "correct"
                                        );

                                    }

                                }
                            );


                            feedback.innerHTML = `

                                <strong>
                                    ❌ Incorrect
                                </strong>

                                <p>
                                    Correct answer:
                                    <strong>
                                        ${correct}
                                    </strong>
                                </p>

                                <p>
                                    ${question.explanation}
                                </p>

                            `;

                        }


                        nextButton.disabled =
                            false;

                    }
                );

            }
        );


        nextButton.addEventListener(
            "click",
            () => {

                if (
                    currentQuestion <
                    quiz.questions.length - 1
                ) {

                    currentQuestion++;

                    renderQuestion();

                }

                else {

                    showQuizResult();

                }

            }
        );

    }


    function showQuizResult() {

        const total =
            quiz.questions.length;


        const percentage =
            Math.round(
                (score / total) * 100
            );


        let message;


        if (percentage === 100) {

            message =
                "🏆 Perfect score! Excellent work!";

        }

        else if (percentage >= 80) {

            message =
                "🎉 Great job! You understand the topic well.";

        }

        else if (percentage >= 60) {

            message =
                "👍 Good effort! Review the topic once more.";

        }

        else {

            message =
                "📚 Keep learning! Try the Summary and Explanation again.";

        }


        output.innerHTML = `

            <div class="section quiz-result">

                <h2>
                    🎉 Quiz Complete!
                </h2>


                <div class="score">

                    ${score}/${total}

                </div>


                <div class="percentage">

                    ${percentage}%

                </div>


                <p>
                    ${message}
                </p>


                <button
                    id="retryQuizBtn"
                    class="next-btn"
                >
                    🔄 Try Again
                </button>

            </div>

        `;


        document
            .getElementById("retryQuizBtn")
            .addEventListener(
                "click",
                () => {

                    startQuiz(quiz);

                }
            );

    }

}


// ======================================================
// VOCABULARY AGENT
// ======================================================

vocabularyBtn.addEventListener(
    "click",
    async () => {

        showLoading(
            "Generating Important Vocabulary..."
        );


        try {

            await getCurrentVideo();


            const response = await fetch(
                "http://127.0.0.1:5000/vocabulary",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        url: currentVideoUrl
                    })

                }
            );


            if (!response.ok) {

                throw new Error(
                    `Backend returned ${response.status}`
                );

            }


            const data =
                await response.json();


            if (data.success === false) {

                throw new Error(
                    data.message
                );

            }


            currentVocabulary =
                data.vocabulary;


            renderVocabulary(
                currentVocabulary
            );

        }

        catch (error) {

            console.error(error);

            showError(error.message);

        }

    }
);


// ======================================================
// RENDER VOCABULARY
// ======================================================

function renderVocabulary(vocabulary) {

    if (
        !vocabulary ||
        !Array.isArray(vocabulary.words)
    ) {

        throw new Error(
            "Invalid vocabulary data."
        );

    }


    output.innerHTML = `

        <div class="section vocabulary-title">

            <h2>
                📚 ${vocabulary.title || "Important Vocabulary"}
            </h2>

            <p>
                Important terms from this video
            </p>

        </div>


        ${
            vocabulary.words
                .map(
                    word => `

                        <div class="section vocabulary-card">

                            <div class="vocabulary-header">

                                <h2>
                                    ${word.term}
                                </h2>

                                <span
                                    class="
                                        difficulty
                                        ${word.difficulty}
                                    "
                                >
                                    ${word.difficulty}
                                </span>

                            </div>


                            <div class="vocabulary-item">

                                <strong>
                                    🟢 Simple Meaning
                                </strong>

                                <p>
                                    ${word.simple_meaning}
                                </p>

                            </div>


                            <div class="vocabulary-item">

                                <strong>
                                    🎓 In This Video
                                </strong>

                                <p>
                                    ${word.contextual_meaning}
                                </p>

                            </div>


                            <div class="vocabulary-item">

                                <strong>
                                    💬 Example
                                </strong>

                                <p>
                                    ${word.example}
                                </p>

                            </div>

                        </div>

                    `
                )
                .join("")
        }

    `;

}


// ======================================================
// FLASHCARD AGENT
// ======================================================

flashcardsBtn.addEventListener(
    "click",
    async () => {

        showLoading(
            "Creating AI Flashcards..."
        );


        try {

            await getCurrentVideo();


            const response = await fetch(
                "http://127.0.0.1:5000/flashcards",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        url: currentVideoUrl
                    })

                }
            );


            if (!response.ok) {

                throw new Error(
                    `Backend returned ${response.status}`
                );

            }


            const data =
                await response.json();


            if (data.success === false) {

                throw new Error(
                    data.message
                );

            }


            currentFlashcards =
                data.flashcards;


            startFlashcards(
                currentFlashcards
            );

        }

        catch (error) {

            console.error(error);

            showError(error.message);

        }

    }
);


// ======================================================
// FLASHCARD SYSTEM
// ======================================================

function startFlashcards(data) {

    if (
        !data ||
        !Array.isArray(data.cards) ||
        data.cards.length === 0
    ) {

        throw new Error(
            "Invalid flashcard data."
        );

    }


    let currentCard = 0;

    let revealed = false;


    renderCard();


    function renderCard() {

        const card =
            data.cards[currentCard];


        revealed = false;


        output.innerHTML = `

            <div class="flashcard-container">

                <div class="flashcard-top">

                    <h2>
                        🃏 ${data.title || "Study Flashcards"}
                    </h2>

                    <span>
                        Card
                        ${currentCard + 1}
                        /
                        ${data.cards.length}
                    </span>

                </div>


                <div class="progress-bar">

                    <div
                        class="progress"
                        style="
                            width:
                            ${
                                (
                                    (currentCard + 1)
                                    /
                                    data.cards.length
                                ) * 100
                            }%;
                        "
                    ></div>

                </div>


                <div
                    id="flashcard"
                    class="flashcard"
                >

                    <div class="flashcard-content">

                        <span class="card-label">
                            QUESTION
                        </span>

                        <h3 id="cardFront">

                            ${card.front}

                        </h3>


                        <div
                            id="cardBack"
                            class="card-back hidden"
                        >

                            <span class="card-label">
                                ANSWER
                            </span>

                            <p>
                                ${card.back}
                            </p>

                        </div>

                    </div>

                </div>


                <div class="difficulty-container">

                    <span
                        class="
                            difficulty
                            ${card.difficulty}
                        "
                    >
                        ${card.difficulty}
                    </span>

                </div>


                <button
                    id="revealBtn"
                    class="reveal-btn"
                >
                    👁 Reveal Answer
                </button>


                <div class="flashcard-navigation">

                    <button
                        id="previousCardBtn"
                        class="nav-btn"
                        ${currentCard === 0 ? "disabled" : ""}
                    >
                        ← Previous
                    </button>


                    <button
                        id="nextCardBtn"
                        class="nav-btn"
                    >

                        ${
                            currentCard ===
                            data.cards.length - 1

                            ?

                            "Finish 🎉"

                            :

                            "Next →"
                        }

                    </button>

                </div>


                <button
                    id="shuffleBtn"
                    class="shuffle-btn"
                >
                    🔀 Shuffle Cards
                </button>

            </div>

        `;


        const revealBtn =
            document.getElementById(
                "revealBtn"
            );


        const back =
            document.getElementById(
                "cardBack"
            );


        const previousBtn =
            document.getElementById(
                "previousCardBtn"
            );


        const nextBtn =
            document.getElementById(
                "nextCardBtn"
            );


        const shuffleBtn =
            document.getElementById(
                "shuffleBtn"
            );


        // ----------------------------------------------
        // REVEAL
        // ----------------------------------------------

        revealBtn.addEventListener(
            "click",
            () => {

                revealed = !revealed;


                if (revealed) {

                    back.classList.remove(
                        "hidden"
                    );

                    revealBtn.textContent =
                        "🙈 Hide Answer";

                }

                else {

                    back.classList.add(
                        "hidden"
                    );

                    revealBtn.textContent =
                        "👁 Reveal Answer";

                }

            }
        );


        // ----------------------------------------------
        // PREVIOUS
        // ----------------------------------------------

        previousBtn.addEventListener(
            "click",
            () => {

                if (currentCard > 0) {

                    currentCard--;

                    renderCard();

                }

            }
        );


        // ----------------------------------------------
        // NEXT
        // ----------------------------------------------

        nextBtn.addEventListener(
            "click",
            () => {

                if (
                    currentCard <
                    data.cards.length - 1
                ) {

                    currentCard++;

                    renderCard();

                }

                else {

                    showFlashcardComplete();

                }

            }
        );


        // ----------------------------------------------
        // SHUFFLE
        // ----------------------------------------------

        shuffleBtn.addEventListener(
            "click",
            () => {

                data.cards =
                    [...data.cards]
                    .sort(
                        () => Math.random() - 0.5
                    );


                currentCard = 0;

                renderCard();

            }
        );

    }


    function showFlashcardComplete() {

        output.innerHTML = `

            <div class="section flashcard-result">

                <div class="completion-icon">
                    🎉
                </div>

                <h2>
                    Flashcards Complete!
                </h2>

                <p>
                    You reviewed all
                    ${data.cards.length}
                    flashcards.
                </p>


                <button
                    id="restartFlashcardsBtn"
                    class="next-btn"
                >
                    🔄 Review Again
                </button>

            </div>

        `;


        document
            .getElementById(
                "restartFlashcardsBtn"
            )
            .addEventListener(
                "click",
                () => {

                    currentCard = 0;

                    renderCard();

                }
            );

    }

}