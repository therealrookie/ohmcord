// public/scripts/brainstorm.js

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

const questionInput = document.getElementById("ask-question");

// Add event listener for 'Enter' key
questionInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const question = questionInput.value.trim();
    if (question) {
      newQuestion(question);

      questionInput.value = "";
    }
  }
});

function newQuestion(question) {
  socket.send(JSON.stringify({ source: "website", type: "question", questionSessionId: questionSessionId, question: question }));
}

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

async function renderQuestionNotes(questions) {
  console.log(questions);
  await questions.forEach((question) => {
    const data = { questionId: question.question_id, question: question.question };
    addQuestionNote(data);
  });
}

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

  //questionNote.appendChild(answersList);

  // Create and add a button
  const button = document.createElement("button");
  button.textContent = "+"; // Set button text
  button.id = `add-btn-${message.questionId}`;
  button.addEventListener("click", () => {
    button.style.display = "none"; // Hide button
    addInputField(questionNote, button, message.questionId); // Call input field function
  });

  questionNote.appendChild(button);

  questionContainer.insertBefore(questionNote, questionContainer.firstChild);

  // Fetch and render answers
  await addAnswers(message.questionId);
}

function addInputField(parent, button, questionId) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Antwort...";

  // Add event listener for 'Enter' key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const answer = input.value.trim();
      if (answer) {
        sendAnswer(answer, questionId); // Send answer to the function
        input.value = ""; // Clear the input field
        input.remove(); // Remove the input field
        button.style.display = "inline"; // Show the button again
      }
    }
  });

  parent.appendChild(input);
  input.focus(); // Automatically focus the input field
}

// Simulate sending the answer to a function
function sendAnswer(answer, questionId) {
  socket.send(JSON.stringify({ source: "website", type: "answer", questionSessionId: questionSessionId, questionId: questionId, answer: answer }));
}

async function addAnswers(questionId) {
  // Create a <ul> element to hold the answers

  // Fetch the answers using getAnswers
  const answers = await getAnswers(questionId);

  // Map over the answers and create <li> elements
  answers.forEach((answerData) => {
    if (answerData.question_id) {
      answerData = { questionId: answerData.question_id, answer: answerData.answer };
    }
    addNewAnswer(answerData);
  });
}

function addNewAnswer(data) {
  const questionNote = document.getElementById(data.questionId);
  const answerList = questionNote.querySelector("ol");
  console.log(answerList);

  const li = document.createElement("li");
  li.textContent = data.answer; // Add the answer text

  answerList.appendChild(li);
}

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
