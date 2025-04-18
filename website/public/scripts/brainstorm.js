// public/scripts/brainstorm.js

const brainstormId = canvas.getAttribute("data-brainstorm-id");
const wsUrl = canvas.getAttribute("data-ws-url");

const socket = new WebSocket(`${wsUrl}/brainstorm`);

let contributions = [];
let weightRange = [-1, 1];

window.onload = async () => {
  centerCanvas();
  contributions = await getContributions();

  determineWeightRange();

  await addExistingContribution();
};

socket.onopen = function (event) {
  console.log("WebSocket Open (client)");
};

socket.onerror = function (error) {
  console.log(error);
};

socket.onmessage = async function (event) {
  await handleWsMessage(event);
};

async function handleWsMessage(event) {
  const message = JSON.parse(event.data);
  const validBrainstormId = parseInt(message.brainstormId) === parseInt(brainstormId);
  const discordSource = message.source === "server-discord";

  if (!validBrainstormId || !discordSource) return;

  contributions = await getContributions();

  if (message.type === "contribution") {
    // message: {source, type, brainstormId, contributionId, contribution}
    const contribution = { id: message.contributionId, content: message.contribution, score: 0, xpos: null, ypos: null };

    await addContributionToCanvas(contribution);
  } else if (message.type === "score") {
    // {source, type, brainstormId, contribution: {id, score}}
    determineWeightRange();

    // Edits all cotribution fontsize, weight and opacity
    editContributionElement();
  }
}

// Determines the range of lowest and highest ranked contribution
function determineWeightRange() {
  const scores = contributions.map((con) => con.score);
  if (scores.length > 1) {
    weightRange[0] = Math.min.apply(null, scores);
    weightRange[1] = Math.max.apply(null, scores);
  } else {
    weightRange = [0, 0];
  }
}

// Adds all contributions after reload
async function addExistingContribution() {
  for (const contribution of contributions) {
    await addContributionToCanvas(contribution);
  }
}

// Returns a random position on the canvas
function getRandomPosition(xpos, ypos) {
  let xStart, yStart;
  if (xpos === null || ypos === null) {
    xStart = Math.floor(Math.random() * 1921);
    yStart = Math.floor(Math.random() * 1081);
  } else {
    xStart = xpos;
    yStart = ypos;
  }
  return { xStart, yStart };
}

// Returns true if coordinate range is outside canvas
function isOutsideCanvas({ xStart, yStart, xEnd, yEnd }) {
  return xStart < 20 || yStart < 20 || xEnd > 1900 || yEnd > 1060;
}

// Returns true if the coordinate range overlays the theme
function hitsTheme({ xStart, yStart, xEnd, yEnd }) {
  const theme = document.getElementById("theme");

  return (
    xStart < theme.offsetLeft + theme.offsetWidth &&
    xEnd > theme.offsetLeft &&
    yStart < theme.offsetTop + theme.offsetHeight &&
    yEnd > theme.offsetTop
  );
}

// Returns true if the coordinate range overlays another contribution
function hitsContribution({ xStart, yStart, xEnd, yEnd }) {
  const elements = document.querySelectorAll(".contribution");

  for (let elem of elements) {
    if (
      xStart < elem.offsetLeft + elem.offsetWidth &&
      xEnd > elem.offsetLeft &&
      yStart < elem.offsetTop + elem.offsetHeight &&
      yEnd > elem.offsetTop
    ) {
      if (elem.classList.value.includes("temp")) return false;

      return true; // Collides with other contribution
    }
  }
}

// Returns true if the element is overlaying another element or is outside canvas
function isColliding(contElemConstraints) {
  return isOutsideCanvas(contElemConstraints) || hitsTheme(contElemConstraints) || hitsContribution(contElemConstraints);
}

// Returns a random integer
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Maps x-coordinate depending on score
function mapX(minScore, maxScore, score) {
  const width = 1920;
  const step = width / (Math.abs(minScore) + Math.abs(maxScore) + 1);
  const leftOrRight = getRndInteger(0, 1);
  if (leftOrRight === 0) {
    // Left
    const min = map(0, width / 2 - step, minScore, maxScore, score);
    const max = min + step;
    return getRndInteger(min, max);
  } else {
    // Right
    const min = map(width - step, width / 2, minScore, maxScore, score);
    const max = min + step;
    return getRndInteger(min, max);
  }
}

// Maps y-coordinate depending on score
function mapY(minScore, maxScore, score) {
  const height = 1080;
  const step = height / (Math.abs(minScore) + Math.abs(maxScore) + 1);
  const upOrDown = getRndInteger(0, 1);
  if (upOrDown === 0) {
    // Up
    const min = map(0, height / 2 - step, minScore, maxScore, score);
    const max = min + step;
    return getRndInteger(min, max);
  } else {
    // Down
    const min = map(height - step, height / 2, minScore, maxScore, score);
    const max = min + step;
    return getRndInteger(min, max);
  }
}

// Maps x/y Position if they don't already exist
function mapPosition(score, xpos, ypos) {
  if (xpos && ypos) {
    return { xStart: xpos, yStart: ypos };
  }

  const minScore = weightRange[0];
  const maxScore = weightRange[1];

  let xStart, yStart;

  if (getRndInteger(0, 1) === 0) {
    xStart = mapX(minScore, maxScore, score);
    yStart = getRndInteger(20, 1060);
  } else {
    xStart = getRndInteger(20, 1900);
    yStart = mapY(minScore, maxScore, score);
  }

  return { xStart, yStart };
}

// Increases or decreases font size, weight, opacity depending on score
function setWeight(contElem, score) {
  const textLength = contElem.innerHTML.length;
  const weight = map(7, 17, weightRange[0], weightRange[1], score) / 10;
  const size = (200 - textLength) * weight;
  const fontWeigth = map(100, 900, weightRange[0], weightRange[1], score);
  const opacity = map(5, 10, weightRange[0], weightRange[1], score) / 10;

  contElem.style.fontWeight = fontWeigth;
  contElem.style.fontSize = `${size}%`;
  contElem.style.opacity = opacity;

  return contElem;
}

// Creates and styles HTML element of a contribution
function createContributionElem({ id, content, score, xpos, ypos }) {
  let contElem = document.createElement("div");
  contElem.id = id;
  contElem.classList.add("contribution");
  contElem.classList.add("temp");
  contElem.innerHTML = content;

  contElem = setWeight(contElem, score);

  const { xStart, yStart } = mapPosition(score, xpos, ypos);

  contElem.style.visibility = "hidden";
  contElem.style.left = `${xStart}px`;
  contElem.style.top = `${yStart}px`;
  canvas.appendChild(contElem);

  // Get dimensions
  const xEnd = xStart + contElem.offsetWidth;
  const yEnd = yStart + contElem.offsetHeight;

  const contElemConstraints = { xStart, yStart, xEnd, yEnd };
  return { contElem, contElemConstraints };
}

// Edits all cotribution fontsize, weight and opacity
async function editContributionElement() {
  contributions.forEach((cont) => {
    const contElem = document.getElementById(cont.id);
    setWeight(contElem, cont.score);
  });
}

// Adds contribution to the canvas
async function addContributionToCanvas(contribution) {
  const { contElem, contElemConstraints } = createContributionElem(contribution);

  if (isColliding(contElemConstraints)) {
    canvas.removeChild(contElem);
    await addContributionToCanvas(contribution);
  } else {
    contElem.classList.remove("temp");
    contElem.style.visibility = "visible";

    await setPosition(contribution.id, contElemConstraints.xStart, contElemConstraints.yStart);
  }
}

/*  
  MIN / MAX: Min / Max output value
  min / max: min / max input value
  val: value that will be mapped
*/
function map(MIN, MAX, min, max, val) {
  if (min === max) {
    return Math.round(MAX - MIN / 2);
  } else {
    return Math.round(((val - min) * (MAX - MIN)) / (max - min) + MIN);
  }
}

// Listens to new contribution sent via the input field
const contributionInput = document.getElementById("add-contribution");
contributionInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    socket.send(
      JSON.stringify({
        source: "website",
        type: "contribution",
        brainstormId: brainstormId,
        contribution: contributionInput.value,
      })
    );

    contributionInput.value = "";
  }
});

// Gets and returns all contributions from the database
async function getContributions() {
  try {
    const response = await fetch(`/brainstorm/contributions/${brainstormId}`);
    const contributions = await response.json();

    return contributions;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Saves the position values to the database
async function setPosition(contId, xPos, yPos) {
  try {
    const response = await fetch(`/brainstorm/set-position`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contId, xPos, yPos }),
    });
    await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
