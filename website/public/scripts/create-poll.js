const questionForm = document.getElementById("question-form");
const picker = document.querySelector("emoji-picker");
const background = document.getElementById("background");

// Closes the Emoji Picker
const closeEmojiMenu = () => {
  picker.style.visibility = "hidden";
  background.style.visibility = "hidden";
};

// Handles the click on an emoji
const handleEmojiClick = (event, emojiContainer) => {
  emojiContainer.innerHTML = event.detail.unicode;
  closeEmojiMenu();
};

// Opens the emoji Picker
function openEmojiMenu(emojiContainer) {
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

// Creates a container for emojiContainer, answerInput and deleteButton
function createNewAnswerContainer(answerIndex) {
  const newAnswerContainer = document.createElement("div");
  newAnswerContainer.id = `answer-container-${answerIndex}`;
  newAnswerContainer.classList = "answer-container";

  return newAnswerContainer;
}

// Creates an emojiContainer
function createEmojiContainer(emoji, answerIndex) {
  const emojiContainer = document.createElement("div");
  emojiContainer.classList.add("emoji-container");
  emojiContainer.id = `emoji-container-${answerIndex}`;

  if (emoji) {
    emojiContainer.innerHTML = emoji;
  } else {
    emojiContainer.innerHTML = "&#9786;";
  }
  emojiContainer.onclick = () => openEmojiMenu(emojiContainer);

  return emojiContainer;
}

// Creates an answer Text Input
function createAnswerTextInput(text, answerIndex) {
  const newAnswerTextInput = document.createElement("input");
  newAnswerTextInput.classList.add("answer-text-input");
  newAnswerTextInput.type = "text";
  newAnswerTextInput.setAttribute("maxlength", 55);
  if (text) {
    newAnswerTextInput.value = text;
  } else {
    newAnswerTextInput.placeholder = `${answerIndex}. Antwort`;
  }

  return newAnswerTextInput;
}

// Creates the delete Button for an answer
function createDeleteAnswerButton(newAnswerContainer) {
  const newDeleteAnswerButton = document.createElement("button");
  newDeleteAnswerButton.innerHTML = "&#10006;";
  newDeleteAnswerButton.classList.add("delete-answer-button");
  newDeleteAnswerButton.onclick = function deleteAnswer() {
    newAnswerContainer.remove();
    updateAnswerIds();
    updateAddAnswerButton();
    return false;
  };

  return newDeleteAnswerButton;
}

// Adds an answer
function addAnswer(text, emoji) {
  const addAnswerContainers = document.getElementsByClassName("answer-container");
  const answerContainerArray = Array.from(addAnswerContainers);

  if (answerContainerArray.length >= 10) return;

  const answerIndex = questionForm.children.length - 1;

  updateAddAnswerButton();

  const newAnswerContainer = createNewAnswerContainer(answerIndex);

  const emojiContainer = createEmojiContainer(emoji, answerIndex);

  const newAnswerTextInput = createAnswerTextInput(text, answerIndex);

  const newDeleteAnswerButton = createDeleteAnswerButton(newAnswerContainer);

  newAnswerContainer.appendChild(emojiContainer);
  newAnswerContainer.appendChild(newAnswerTextInput);
  newAnswerContainer.appendChild(newDeleteAnswerButton);

  questionForm.insertBefore(newAnswerContainer, questionForm.children[answerIndex]);

  updateAddAnswerButton();
}

// Removes the add-answer-button if there are 10 answers added
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

// Updates answerIds if an answer gets deleted
function updateAnswerIds() {
  const children = Array.from(questionForm.children);
  let answerIndex = 1;

  children.forEach((child) => {
    if (child.id && child.id.includes("answer-container")) {
      child.id = `answer-container-${answerIndex}`;

      const textInput = child.querySelector("input[type='text']");
      if (textInput) {
        textInput.placeholder = `${answerIndex}. Antwort`;
      }

      answerIndex++;
    }
  });
}

// Saves the Poll to the database and redirects to the next page
async function createPoll() {
  const question = getQuestionData();
  const answers = getAnswers();

  if (question && answers) {
    const hashUrl = await savePoll(question, answers);
    window.location.href = `/poll/${hashUrl}`;
  }
}

// Saves the poll to the database
async function savePoll(question, answers) {
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

// Gets question and general poll data from the html inputs
function getQuestionData() {
  const question = questionForm.querySelector("input").value;
  const multipleAnswers = document.getElementById("multiple-answers-checkbox").checked;
  const durationElement = document.getElementById("set-duration");
  const duration = durationElement.getAttribute("data-value");

  if (question === "") {
    showToast(`Frage darf nicht leer sein!`);
    return;
  }
  return { question, multipleAnswers, duration };
}

// Parses the emojicode
function getEmoji(answerContainer) {
  const emojiCode = answerContainer.querySelector("div").innerHTML.codePointAt(0);
  const skinColorCode = answerContainer.querySelector("div").innerHTML.codePointAt(1);

  if (emojiCode == "9786") return "";
  else if (skinColorCode > 127994 && skinColorCode < 128000) return `${emojiCode},${skinColorCode}`;
  else return `${emojiCode}`;
}

// Array of possible duration values
const durationArray = [
  { value: "1", text: "1 Stunde" },
  { value: "4", text: "4 Stunden" },
  { value: "8", text: "8 Stunden" },
  { value: "24", text: "24 Stunden" },
  { value: "72", text: "3 Tage" },
  { value: "168", text: "1 Woche" },
  { value: "336", text: "2 Wochen" },
];

// Fill the dropdown menu with durationoptions
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

// Get the selected duration
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

// Collects all the answers (emoji, answer-string)
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
    showToast("Frage darf nicht leer sein!");
    return;
  }
  return answers;
}
