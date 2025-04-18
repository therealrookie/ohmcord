const hashUrl = document.getElementById("hash-url");
const quizId = hashUrl.getAttribute("data-quiz-id");
const quizHashUrl = hashUrl.innerText;
const questionForm = document.getElementById("question-form");

let questions = [];
let currentQuestionIndex;

window.addEventListener("load", async (event) => {
  await getQuestions();
  currentQuestionIndex = questions.length;
});

// Saves Quiz settings on change
document.getElementById("quiz-form").addEventListener("change", async function (event) {
  await updateQuizSettings(quizId, event.target.name, event.target.value);
});

// Removes question and deletes it in the database
async function removeQuestion() {
  const questionId = document.getElementById("questions-heading").getAttribute("data-question-id");
  await deleteQuestion(questionId);
  currentQuestionIndex--;
  await nextQuestion();
}

// Shows the current question and its answers
async function loadQuestion() {
  setQuestionsHeading(`${currentQuestionIndex + 1}. Frage`, questions[currentQuestionIndex].questionId);

  const questionInput = document.getElementById("question-input");
  questionInput.value = questions[currentQuestionIndex].questionString;

  removePreviousAnswerContainers();

  questions[currentQuestionIndex].answers.forEach((answer, index) => {
    addAnswer(answer.answerId);
    const answerContainer = document.getElementById(`${answer.answerId}`);
    answerContainer.querySelector(".answer-checkbox").checked = answer.isCorrect;
    answerContainer.querySelector(".answer-text-input").value = answer.quizAnswer;
  });
}

// Shows the empty question input field
function showNewQuestionInput() {
  const addAnswerButton = document.getElementById("add-answer-button");
  addAnswerButton.style.display = "block";

  setQuestionsHeading("Neue Frage", "null");

  const questionInput = document.getElementById("question-input");
  questionInput.value = "";
  questionInput.placeholder = "Frage...";

  removePreviousAnswerContainers();
}

// Removes all answer containers
function removePreviousAnswerContainers() {
  const answerContainers = document.getElementsByClassName("answer-container");

  Array.from(answerContainers).forEach((container) => {
    container.remove();
  });
}

// Sets the heading above a question
function setQuestionsHeading(text, questionId) {
  const deleteQuestionButton = document.getElementById("delete-question-button");

  deleteQuestionButton.style.display = questionId === "null" ? "none" : "block";
  const questionsHeading = document.getElementById("questions-heading");
  questionsHeading.innerHTML = text;
  questionsHeading.setAttribute("data-question-id", questionId);
}

// Sets only one correct answer
function setCorrectAnswer(answerIndex) {
  const checkboxes = Array.from(document.getElementsByClassName("answer-checkbox"));

  checkboxes.forEach(async (checkbox, index) => {
    const isChecked = index === answerIndex - 1;
    const answerId = checkbox.parentElement.getAttribute("data-answer-id");
    checkbox.checked = isChecked;
    await updateCorrectAnswer(answerId, isChecked);
  });
}

// Creates an answer container
function createAnswerContainer(answerIndex, answerId) {
  const newAnswerContainer = document.createElement("div");
  newAnswerContainer.id = answerId; //`answer-container-${answerIndex}`;
  newAnswerContainer.setAttribute("data-answer-id", answerId);
  newAnswerContainer.classList = "answer-container";

  const newAnswerCheckbox = document.createElement("input");
  newAnswerCheckbox.classList.add("answer-checkbox");
  newAnswerCheckbox.type = "radio";
  newAnswerCheckbox.onchange = () => {
    setCorrectAnswer(answerIndex);
  };

  const newAnswerTextInput = document.createElement("input");
  newAnswerTextInput.classList.add("answer-text-input");
  newAnswerTextInput.type = "text";
  newAnswerTextInput.placeholder = `${answerIndex}. Antwort`;
  newAnswerTextInput.onkeydown = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await updateAnswerText(answerId, event.target.value);
      addAnswer();
    }
  };

  newAnswerTextInput.onchange = async (event) => {
    await updateAnswerText(answerId, event.target.value);
  };

  const newDeleteAnswerButton = document.createElement("button");
  newDeleteAnswerButton.innerHTML = "&#10006;";
  newDeleteAnswerButton.classList.add("delete-answer-button");
  newDeleteAnswerButton.onclick = async (event) => {
    newAnswerContainer.remove();
    await deleteAnswer(answerId);
    updateAddAnswerButton();
    return false;
  };

  newAnswerContainer.appendChild(newAnswerCheckbox);
  newAnswerContainer.appendChild(newAnswerTextInput);
  newAnswerContainer.appendChild(newDeleteAnswerButton);

  return newAnswerContainer;
}

// Adds an answer-container with checkbox, input and answer-delete-button
async function addAnswer(answerId) {
  const answerIndex = questionForm.children.length - 1;
  const questionId = document.getElementById("questions-heading").getAttribute("data-question-id");

  if (answerIndex > 5 || questionId === "null") return;
  if (!answerId) {
    answerId = await createAnswer(questionId);
  }
  const newAnswerContainer = createAnswerContainer(answerIndex, answerId);

  questionForm.insertBefore(newAnswerContainer, questionForm.children[answerIndex]);

  newAnswerContainer.querySelector(".answer-text-input").focus();

  updateAddAnswerButton();
}

// Returns the String of the question input
function getQuestionString() {
  return document.getElementById("question-input").value;
}

// Returns an array of all answer inputs [{answerString, isCorrect}, {...}]
function getAnswers() {
  let answers = [];
  const children = Array.from(questionForm.children);

  children.forEach((child) => {
    if (child.id && child.id.includes("answer-container")) {
      const isCorrectAnswer = child.getElementsByClassName("answer-checkbox")[0];
      const answerString = child.getElementsByClassName("answer-text-input")[0];
      answers.push({ answerString: answerString.value, isCorrect: isCorrectAnswer.checked });
    }
  });
  return answers;
}

// Updates ID and placeholders of answers
function updateAnswerIds() {
  const answerContainerArray = Array.from(document.getElementsByClassName("answer-container"));
  answerContainerArray.forEach((answerContainer, index) => {
    //answerContainer.id = `answer-container-${index + 1}`;
    answerContainer.querySelector(".answer-text-input").placeholder = `${index + 1}. Antwort`;
  });
}

// Removes the addAnswerButton after 5 answers have been added
function updateAddAnswerButton() {
  const answerContainerArray = Array.from(document.getElementsByClassName("answer-container"));
  const addAnswerButton = document.getElementById("add-answer-button");

  if (answerContainerArray.length >= 5) addAnswerButton.style.display = "none";
  else addAnswerButton.style.display = "block";

  updateAnswerIds();
}

// OnEnter event of question input
async function newQuestionEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addAnswer();
  }
}

// Onchange event of question input
async function newQuestionInput(event) {
  event.preventDefault();
  const questionId = document.getElementById("questions-heading").getAttribute("data-question-id");
  if (questionId === "null") {
    await newQuestion(event.target.value);
  } else {
    await updateQuestionText(event.target.value, questionId);
  }
  return false;
}

// Adds a new question to the database, updates questions array
async function newQuestion(question) {
  const questionId = await createQuestion(question);
  await getQuestions();
  checkButtonAbility();
  setQuestionsHeading(`${currentQuestionIndex + 1}. Frage`, questionId);
  addAnswer();
}

// Checks if all inputs are valid
function checkForValidQuiz() {
  let isValid = true;

  for (const q of questions) {
    if (q.questionString.trim() === "") {
      showToast("Fragen dürfen nicht leer bleiben");
      isValid = false;
    }

    if (q.answers.length < 2) {
      showToast("Fragen brauchen mindestens zwei Antwortmöglichkeiten");
      isValid = false;
    }

    let hasCorrectAnswer = false;
    for (const a of q.answers) {
      if (a.quizAnswer === null || a.quizAnswer.trim() === "") {
        showToast("Antworten dürfen nicht leer bleiben");
        isValid = false;
      }
      if (a.isCorrect === true) {
        hasCorrectAnswer = true;
      }
    }

    if (!hasCorrectAnswer) {
      showToast("Jede Frage muss eine richtige Antwort haben");
      isValid = false;
    }
  }

  return isValid;
}

// Checks for valid quiz and directs to the next page
async function saveAndFinish() {
  await getQuestions();
  const validQuiz = checkForValidQuiz();

  if (validQuiz) {
    window.location.href = `/quiz/fin/${quizHashUrl}`;
  }
}

// Shows next or new question
async function nextQuestion() {
  await getQuestions();
  currentQuestionIndex++;
  checkButtonAbility();
  currentQuestionIndex >= questions.length ? showNewQuestionInput() : await loadQuestion();
}

// Shows the previous question
async function showPreviousQuestion() {
  await getQuestions();
  currentQuestionIndex--;
  checkButtonAbility();
  await loadQuestion();
}

// Disables button if previous or next quiz is not "reachable"
function checkButtonAbility() {
  const previousQuestionButton = document.getElementById("previous-question-button");
  const nextQuestionButton = document.getElementById("next-question-button");

  previousQuestionButton.disabled = currentQuestionIndex === 0 ? true : false;
  nextQuestionButton.disabled = currentQuestionIndex === questions.length ? true : false;
}
