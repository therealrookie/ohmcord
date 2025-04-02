const questionForm = document.getElementById("question-form");
const picker = document.querySelector("emoji-picker");
const background = document.getElementById("background");

const closeEmojiMenu = () => {
  picker.style.visibility = "hidden";
  background.style.visibility = "hidden";
  //background.removeEventListener("click", closeEmojiMenu);
};

const handleEmojiClick = (event, emojiContainer) => {
  console.log("HERE");
  emojiContainer.innerHTML = event.detail.unicode;
  closeEmojiMenu();
};

function openEmojiMenu(emojiContainer) {
  console.log(emojiContainer);

  background.style.visibility = "visible";
  picker.style.visibility = "visible";

  function handleGlobalEmojiClick(event) {
    handleEmojiClick(event, emojiContainer);
    picker.removeEventListener("emoji-click", handleGlobalEmojiClick);
  }

  picker.addEventListener("emoji-click", handleGlobalEmojiClick);
  background.addEventListener("click", closeEmojiMenu);

  return false;
}
/*

function openEmojiMenu(emojiContainer) {
  console.log(emojiContainer);

  background.style.visibility = "visible";
  picker.style.visibility = "visible";

  picker.removeEventListener("emoji-click", handleEmojiClick);

  picker.onclick = (event) => {
    console.log(event);
    handleEmojiClick(event, emojiContainer);
  };

  picker.addEventListener("emoji-click", (event) => handleEmojiClick(event, emojiContainer));
  background.addEventListener("click", closeEmojiMenu);
  return false;
}
  */
function addAnswer(text, emoji) {
  const answerIndex = questionForm.children.length - 1;

  updateAddAnswerButton();

  const newAnswerContainer = document.createElement("div");
  newAnswerContainer.id = `answer-container-${answerIndex}`;
  newAnswerContainer.classList = "answer-container";

  const emojiContainer = document.createElement("div");
  emojiContainer.classList.add("emoji-container");
  emojiContainer.id = `emoji-container-${answerIndex}`;

  if (emoji) {
    emojiContainer.innerHTML = emoji;
  } else {
    emojiContainer.innerHTML = "&#9786;";
  }
  emojiContainer.onclick = () => openEmojiMenu(emojiContainer);

  const newAnswerTextInput = document.createElement("input");
  newAnswerTextInput.classList.add("answer-text-input");
  newAnswerTextInput.type = "text";
  newAnswerTextInput.setAttribute("maxlength", 55);
  if (text) {
    newAnswerTextInput.value = text;
  } else {
    newAnswerTextInput.placeholder = `${answerIndex}. Antwort`;
  }

  const newDeleteAnswerButton = document.createElement("button");
  newDeleteAnswerButton.innerHTML = "&#10006;";
  newDeleteAnswerButton.classList.add("delete-answer-button");
  newDeleteAnswerButton.onclick = function deleteAnswer() {
    newAnswerContainer.remove();
    updateAnswerIds();
    updateAddAnswerButton();
    return false;
  };

  newAnswerContainer.appendChild(emojiContainer);
  newAnswerContainer.appendChild(newAnswerTextInput);
  newAnswerContainer.appendChild(newDeleteAnswerButton);

  questionForm.insertBefore(newAnswerContainer, questionForm.children[answerIndex]);

  updateAddAnswerButton();
}

function updateAddAnswerButton() {
  const addAnswerContainers = document.getElementsByClassName("answer-container");
  const addAnswerButton = document.getElementById("add-answer-button");

  const answerContainerArray = Array.from(addAnswerContainers);

  if (answerContainerArray.length >= 10) {
    addAnswerButton.style.display = "none";
  } else {
    addAnswerButton.style.display = "block";
  }
}

function updateAnswerIds() {
  const children = Array.from(questionForm.children); // Convert HTMLCollection to array for easier manipulation
  let answerIndex = 1; // Start indexing from 1 for consistency with placeholders

  children.forEach((child) => {
    if (child.id && child.id.includes("answer-container")) {
      child.id = `answer-container-${answerIndex}`; // Update the container ID

      // Update the placeholder text of the text input inside the container
      const textInput = child.querySelector("input[type='text']");
      if (textInput) {
        textInput.placeholder = `${answerIndex}. Antwort`;
      }

      answerIndex++; // Increment the index for the next answer
    }
  });
}

async function createPoll() {
  const question = getQuestionData();
  const answers = getAnswers();

  if (question && answers) {
    const hashUrl = await savePoll(question, answers);
    console.log(hashUrl);
    window.location.href = `/poll/${hashUrl}`;
  }
  console.log(question, answers);
}

async function savePoll(question, answers) {
  console.log("HERE: ", question, answers);
  try {
    const response = await fetch("/poll/save-poll/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, answers }),
    });

    return response.json();
  } catch (error) {
    console.error("Error saving poll to Database:", error);
    return false;
  }
}

function getQuestionData() {
  const question = questionForm.querySelector("input").value;
  const multipleAnswers = document.getElementById("multiple-answers-checkbox").checked;
  const durationElement = document.getElementById("set-duration");
  const duration = durationElement.getAttribute("data-value");

  if (question === "") {
    alert("Question can not be empty!");
    return;
  }
  return { question, multipleAnswers, duration };
}

function getEmoji(answerContainer) {
  const emojiCode = answerContainer.querySelector("div").innerHTML.codePointAt(0);
  const skinColorCode = answerContainer.querySelector("div").innerHTML.codePointAt(1);

  if (emojiCode == "9786") return "";
  else if (skinColorCode > 127994 && skinColorCode < 128000) return `${emojiCode},${skinColorCode}`;
  else return `${emojiCode}`;
}

const durationArray = [
  { value: "1", text: "1 Stunde" },
  { value: "4", text: "4 Stunden" },
  { value: "8", text: "8 Stunden" },
  { value: "24", text: "24 Stunden" },
  { value: "72", text: "3 Tage" },
  { value: "168", text: "1 Woche" },
  { value: "336", text: "2 Wochen" },
];

function setDurationOptions() {
  const durationDropdown = document.getElementById("duration-dropdown");
  const setDuration = document.getElementById("set-duration");
  durationArray.forEach((duration) => {
    const durationOption = document.createElement("div");
    durationOption.classList.add("duration-option");
    durationOption.setAttribute("data-value", duration.value);
    durationOption.innerHTML = duration.text;
    durationOption.addEventListener("click", function () {
      setDuration.setAttribute("data-value", duration.value);
      setDuration.innerHTML = `Dauer: ${duration.text}`;
    });
    durationDropdown.appendChild(durationOption);
  });
}

setDurationOptions();

function getDuration() {
  const durationOptions = Array.from(document.getElementsByClassName("duration-option"));
  const setDuration = document.getElementById("set-duration");
  durationOptions.forEach((option) => {
    option.addEventListener("click", function () {
      const duration = option.getAttribute("data-value");
      const durationString = option.innerHTML;

      setDuration.setAttribute("data-value", duration);
      setDuration.innerHTML = `Dauer: ${durationString}`;
    });
  });
}

//getDuration();

function getAnswers() {
  let answers = [];
  const answerContainers = Array.from(questionForm.getElementsByClassName("answer-container"));
  answerContainers.forEach((answerContainer) => {
    const emoji = getEmoji(answerContainer);

    const realEmoji = answerContainer.querySelector("div").innerHTML;

    const answer = answerContainer.querySelector("input").value;

    if (answer === "") return;
    answers.push({ emoji, answer });
  });
  if (answerContainers.length !== answers.length) {
    alert("Answer can not be empty!");
    return;
  }
  return answers;
}
