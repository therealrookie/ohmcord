const hashUrl = document.getElementById("hash-url");
const quizId = hashUrl.getAttribute("data-quiz-id");
const quizHashUrl = hashUrl.innerText;

let questions = [];

window.addEventListener("load", async (event) => {
  await getQuestions();
  console.log(questions);
  displayQuestions();
});

async function getQuestions() {
  try {
    const response = await fetch(`/quiz/get-questions/${quizId}`);
    questions = await response.json();
  } catch (error) {
    console.error(error);
  }
}

function createQuestionElements(question) {
  const questionContainer = document.createElement("div");
  questionContainer.classList.add("question-container");

  // Display actual question text
  const questionHeading = document.createElement("h5");
  questionHeading.innerHTML = question.questionString;
  questionContainer.appendChild(questionHeading);

  // Display each answer
  question.answers.forEach((a, index) => {
    const answerText = document.createElement("p");
    answerText.innerHTML = `${index + 1}. ${a.quizAnswer}`; // Show real answer text
    questionContainer.appendChild(answerText);
  });

  document.getElementById("questions").appendChild(questionContainer);
}

function displayQuestions() {
  console.log("Here: ", questions);
  questions.forEach((question) => {
    createQuestionElements(question);
  });
}

const copyCodeContainer = document.getElementById("copy-code-field");
copyCodeContainer.addEventListener("click", () => {
  const code = document.getElementById("hash-url").innerHTML;
  navigator.clipboard.writeText(code);
  showToast(`Code <i>${code}</i> kopiert!`);
});

function showToast(text) {
  // Get the snackbar DIV
  var toast = document.getElementById("snackbar");

  toast.innerHTML = text;

  // Add the "show" class to DIV
  toast.className = "show";

  // After 3 seconds, remove the show class from DIV
  setTimeout(function () {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}
