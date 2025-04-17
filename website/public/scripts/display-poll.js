const durationElement = document.getElementById("duration-element");
const duration = parseInt(durationElement.getAttribute("duration-data"));

// Sets the duration of the poll as a String
function setpollDuration() {
  if (duration === 1) {
    durationElement.innerHTML = `Dauer: ${duration} Stunde`;
  } else if (duration > 1 && duration < 25) {
    durationElement.innerHTML = `Dauer: ${duration} Stunden`;
  } else if (duration === 72) {
    durationElement.innerHTML = `Dauer: 3 Tage`;
  } else if (duration === 168) {
    durationElement.innerHTML = `Dauer: 1 Woche`;
  } else if (duration === 336) {
    durationElement.innerHTML = `Dauer: 2 Wochen`;
  }
}

setpollDuration();

const answersList = document.getElementById("answers-list");
const answersString = answersList.getAttribute("answers-data");

const answers = JSON.parse(answersString);

// Parses the emoji
function displayEmoji(emoji) {
  if (emoji === "") return "";
  else if (emoji.includes(",")) return `&#${emoji.split(",")[0]};&#${emoji.split(",")[1]};`;
  else return `&#${emoji};`;
}

// Displays all the answers
answers.forEach((answer) => {
  const answerElement = document.createElement("div");
  const emojiContainer = document.createElement("div");
  const answerText = document.createElement("div");

  emojiContainer.classList.add("emojiContainer");
  answerText.classList.add("answerText");
  answerElement.classList.add("answer-element");

  const emoji = displayEmoji(answer.emoji);
  emojiContainer.innerHTML = emoji;
  answerText.innerHTML = `${answer.answer}`;

  answerElement.appendChild(emojiContainer);
  answerElement.appendChild(answerText);
  answersList.appendChild(answerElement);
});

// Copies Hash code to clipboard
const copyCodeContainer = document.getElementById("copy-code-container");
copyCodeContainer.addEventListener("click", () => {
  const code = document.getElementById("hashRoute").getAttribute("data-hash-route");
  navigator.clipboard.writeText(code);
  showToast(`Code ${code} kopiert`);
});
