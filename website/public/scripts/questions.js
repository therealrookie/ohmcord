const questionContainer = document.getElementById("questions");
const questionSessionId = questionContainer.getAttribute("data-session-id");
const wsUrl = questionContainer.getAttribute("data-ws-url");
const socket = new WebSocket(`${wsUrl}/questions`);

const questions = getQuestions(questionSessionId);

socket.onopen = function (event) {
  console.log("WebSocket Open (client)");
};

socket.onmessage = async function (event) {
  const message = JSON.parse(event.data);

  const validQuestionSession = parseInt(message.questionSessionId) === parseInt(questionSessionId);
  const isQuestion = message.type === "question";
  const isAnswer = message.type === "answer";

  if (validQuestionSession && isQuestion) {
    addQuestionNote(message);
  } else if (validQuestionSession && isAnswer) {
    addNewAnswer(message);
  }
};

socket.onclose = function (event) {
  console.log("WebSocket Closed (client)");
};

// Listens to ENTER event on question input
const questionInput = document.getElementById("ask-question");
questionInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const question = questionInput.value.trim();
    if (question) {
      newQuestion(question);

      questionInput.value = "";
    }
  }
});

// Sends a ws-message for a new question
function newQuestion(question) {
  socket.send(JSON.stringify({ source: "website", type: "question", questionSessionId: questionSessionId, question: question }));
}

// Adds all questionnotes for existing questions
async function renderQuestionNotes(questions) {
  await questions.forEach((question) => {
    const data = { questionId: question.question_id, question: question.question };
    addQuestionNote(data);
  });
}

// Adds a single questionnote
async function addQuestionNote(message) {
  const questionNote = document.createElement("div");
  questionNote.classList.add("question-note");
  questionNote.id = message.questionId;

  const heading = document.createElement("h3");
  heading.textContent = `${message.question}`;
  questionNote.appendChild(heading);

  const line = document.createElement("div");
  line.classList.add("line");
  questionNote.appendChild(line);

  const answerContainer = document.createElement("div");
  answerContainer.classList.add("answer-container");

  const ol = document.createElement("ol");
  answerContainer.appendChild(ol);
  questionNote.appendChild(answerContainer);

  const button = document.createElement("button");
  button.textContent = "+";
  button.id = `add-btn-${message.questionId}`;
  button.addEventListener("click", () => {
    button.style.display = "none";
    addInputField(questionNote, button, message.questionId);
  });

  questionNote.appendChild(button);

  questionContainer.insertBefore(questionNote, questionContainer.firstChild);

  await addAnswers(message.questionId);
}

// Adds the input field for answers to a question note
function addInputField(parent, button, questionId) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Antwort...";

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const answer = input.value.trim();
      if (answer) {
        sendAnswer(answer, questionId);
        input.value = "";
        input.remove();
        button.style.display = "inline";
      }
    }
  });

  parent.appendChild(input);
  input.focus();
}

// Sends the answer to the Websockerserver
function sendAnswer(answer, questionId) {
  socket.send(JSON.stringify({ source: "website", type: "answer", questionSessionId: questionSessionId, questionId: questionId, answer: answer }));
}

// Adds all answers to a questionnote
async function addAnswers(questionId) {
  const answers = await getAnswers(questionId);

  answers.forEach((answerData) => {
    if (answerData.question_id) {
      answerData = { questionId: answerData.question_id, answer: answerData.answer };
    }
    addNewAnswer(answerData);
  });
}

// Adds a new answer element to a questionnote
function addNewAnswer(data) {
  const questionNote = document.getElementById(data.questionId);
  const answerList = questionNote.querySelector("ol");
  console.log(answerList);

  const li = document.createElement("li");
  li.textContent = data.answer;

  answerList.appendChild(li);
}

// Gets all questions from the database
async function getQuestions(id) {
  try {
    const response = await fetch(`/anonymous-questions/get-questions/${id}`);
    const questions = await response.json();
    renderQuestionNotes(questions);
    return questions.map((cont) => Object.values(cont)[0]);
  } catch (error) {
    console.log(error);
    return [];
  }
}

// Gets all answers from the database
async function getAnswers(questionId) {
  try {
    const response = await fetch(`/anonymous-questions/get-answers/${questionId}`);
    const answers = await response.json();

    return answers;
  } catch (error) {
    console.log(error);
    return [];
  }
}
