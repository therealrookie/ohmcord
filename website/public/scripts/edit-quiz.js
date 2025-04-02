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

// Save Quiz settings when changed
document.getElementById("quiz-form").addEventListener("change", async function (event) {
  await updateQuizSettings(quizId, event.target.name, event.target.value);
});

async function removeQuestion() {
  const questionId = document.getElementById("questions-heading").getAttribute("data-question-id");
  await deleteQuestion(questionId);
  currentQuestionIndex--;
  await nextQuestion();
}

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

function showNewQuestionInput() {
  const addAnswerButton = document.getElementById("add-answer-button");
  addAnswerButton.style.display = "block";

  setQuestionsHeading("Neue Frage", "null");

  const questionInput = document.getElementById("question-input");
  questionInput.value = "";
  questionInput.placeholder = "Frage...";

  removePreviousAnswerContainers();
}

function removePreviousAnswerContainers() {
  const answerContainers = document.getElementsByClassName("answer-container");

  Array.from(answerContainers).forEach((container) => {
    container.remove();
  });
}

function setQuestionsHeading(text, questionId) {
  const deleteQuestionButton = document.getElementById("delete-question-button");

  deleteQuestionButton.style.display = questionId === "null" ? "none" : "block";
  const questionsHeading = document.getElementById("questions-heading");
  questionsHeading.innerHTML = text;
  questionsHeading.setAttribute("data-question-id", questionId);
}

function setCorrectAnswer(answerIndex) {
  const checkboxes = Array.from(document.getElementsByClassName("answer-checkbox"));

  checkboxes.forEach(async (checkbox, index) => {
    const isChecked = index === answerIndex - 1;
    const answerId = checkbox.parentElement.getAttribute("data-answer-id");
    checkbox.checked = isChecked;
    await updateCorrectAnswer(answerId, isChecked);
  });
}

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
    console.log("HERE");
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

// Add an answer-container with checkbox, input and answer-delete-button
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

function getQuestionString() {
  return document.getElementById("question-input").value;
}

function getAnswers() {
  let answers = [];
  const children = Array.from(questionForm.children); // Convert HTMLCollection to array for easier manipulation

  children.forEach((child) => {
    if (child.id && child.id.includes("answer-container")) {
      const isCorrectAnswer = child.getElementsByClassName("answer-checkbox")[0];
      const answerString = child.getElementsByClassName("answer-text-input")[0];
      answers.push({ answerString: answerString.value, isCorrect: isCorrectAnswer.checked });
    }
  });
  return answers;
}

// Update ID and placeholders of answers
function updateAnswerIds() {
  const answerContainerArray = Array.from(document.getElementsByClassName("answer-container"));
  answerContainerArray.forEach((answerContainer, index) => {
    //answerContainer.id = `answer-container-${index + 1}`;
    answerContainer.querySelector(".answer-text-input").placeholder = `${index + 1}. Antwort`;
  });
}

// Remove the addAnswerButton after 5 answers have been added
function updateAddAnswerButton() {
  const answerContainerArray = Array.from(document.getElementsByClassName("answer-container"));
  const addAnswerButton = document.getElementById("add-answer-button");

  if (answerContainerArray.length >= 5) addAnswerButton.style.display = "none";
  else addAnswerButton.style.display = "block";

  updateAnswerIds();
}

async function newQuestionEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addAnswer();
  }
}

async function newQuestionInput(event) {
  event.preventDefault();
  console.log(event.key);
  const questionId = document.getElementById("questions-heading").getAttribute("data-question-id");
  if (questionId === "null") {
    await newQuestion(event.target.value);
  } else {
    await updateQuestionText(event.target.value, questionId);
  }
  return false;
}

async function newQuestion(question) {
  const questionId = await createQuestion(question);
  await getQuestions();
  checkButtonAbility();
  setQuestionsHeading(`${currentQuestionIndex + 1}. Frage`, questionId);
  addAnswer();
}

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
      showToast("Jede Frage muss mindestens eine richtige Antwort haben");
      isValid = false;
    }
  }

  return isValid;
}

async function saveAndFinish() {
  await getQuestions();
  const validQuiz = checkForValidQuiz();

  if (validQuiz) {
    console.log("Quiz is valid!");
    window.location.href = `/quiz/fin/${quizHashUrl}`;
  }

  console.log(questions);
}

async function nextQuestion() {
  await getQuestions();
  currentQuestionIndex++;
  checkButtonAbility();
  console.log(currentQuestionIndex, questions.length);
  currentQuestionIndex >= questions.length ? showNewQuestionInput() : await loadQuestion();
}

async function showPreviousQuestion() {
  await getQuestions();
  currentQuestionIndex--;
  checkButtonAbility();
  await loadQuestion();
}

function checkButtonAbility() {
  const previousQuestionButton = document.getElementById("previous-question-button");
  const nextQuestionButton = document.getElementById("next-question-button");

  previousQuestionButton.disabled = currentQuestionIndex === 0 ? true : false;
  nextQuestionButton.disabled = currentQuestionIndex === questions.length ? true : false;
}

async function getQuestions() {
  try {
    const response = await fetch(`/quiz/get-questions/${quizId}`);
    questions = await response.json();
  } catch (error) {
    console.error(error);
  }
}

async function updateQuizSettings(quizId, name, value) {
  try {
    await fetch("/quiz/update-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quizId: quizId, column: name, value: value }),
    });
  } catch (error) {
    console.error("Error updating settings in Database:", error);
  }
}

async function createQuestion(questionString) {
  try {
    const response = await fetch("/quiz/create-question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quizId: quizId, question: questionString }),
    });

    const result = await response.json();
    return result.quizQuestionId;
  } catch (error) {
    console.error("Error saving question to Database:", error);
  }
}

async function updateQuestionText(questionString, questionId) {
  try {
    const response = await fetch("/quiz/update-question", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId, question: questionString }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error in updateQuestionText:", error);
    return false;
  }
}

async function updateAnswerInDataBase(questionId, answers, checkboxes) {
  try {
    const response = await fetch("/quiz/update-answers", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId, answers, checkboxes }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error in updateAnswerInDataBase:", error);
    return false;
  }
}

async function createAnswer(questionId) {
  try {
    const response = await fetch("/quiz/create-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in createAnswer:", error);
    return false;
  }
}

async function updateCorrectAnswer(answerId, isChecked) {
  try {
    const response = await fetch("/quiz/update-correct-answer", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answerId, isChecked }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in updateCorrectAnswer:", error);
    return false;
  }
}

async function updateAnswerText(answerId, text) {
  try {
    const response = await fetch("/quiz/update-answer-text", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answerId, text }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in updateAnswerText:", error);
    return false;
  }
}

async function deleteAnswer(answerId) {
  try {
    const response = await fetch("/quiz/answer", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answerId }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in deleteAnswer:", error);
    return false;
  }
}

async function deleteQuestion(questionId) {
  try {
    const response = await fetch("/quiz/question", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in deleteQuestion:", error);
    return false;
  }
}

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
