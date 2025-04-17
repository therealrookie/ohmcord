const hashUrl = document.getElementById("hash-url");
const quizId = hashUrl.getAttribute("data-quiz-id");
const quizHashUrl = hashUrl.innerText;

let questions = [];

window.addEventListener("load", async (event) => {
  await getQuestions();
  console.log(questions);
  displayQuestions();
});

// Returns all questions from the database
async function getQuestions() {
  try {
    const response = await fetch(`/quiz/get-questions/${quizId}`);
    questions = await response.json();
  } catch (error) {
    console.error(error);
  }
}

// Displays a question and its answers
function createQuestionElements(question) {
  const questionContainer = document.createElement("div");
  questionContainer.classList.add("question-container");

  // Displays actual question text
  const questionHeading = document.createElement("h5");
  questionHeading.innerHTML = question.questionString;
  questionContainer.appendChild(questionHeading);

  // Displays each answer
  question.answers.forEach((a, index) => {
    const answerText = document.createElement("p");
    answerText.innerHTML = `${index + 1}. ${a.quizAnswer}`; // Show real answer text
    questionContainer.appendChild(answerText);
  });

  document.getElementById("questions").appendChild(questionContainer);
}

// Display all questions
function displayQuestions() {
  questions.forEach((question) => {
    createQuestionElements(question);
  });
}

// Create container for copying the 6 digit Hash code
const copyCodeContainer = document.getElementById("copy-code-field");
copyCodeContainer.addEventListener("click", () => {
  const code = document.getElementById("hash-url").innerHTML;
  navigator.clipboard.writeText(code);
  showToast(`Code <i>${code}</i> kopiert!`);
});
