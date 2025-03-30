// public/scripts/brainstorm.js

const brainstormId = canvas.getAttribute("data-brainstorm-id");
const wsUrl = canvas.getAttribute("data-ws-url");

/*
var conn = new WebSocket("wss://ohmcord-hyxt.onrender.com");
conn.onopen = function (e) {
  console.log("Connection established!");
};
setInterval(() => {
  conn.send("Hello server!");
}, 1000);
conn.onmessage = function (e) {
  console.log(e.data);
};
conn.onclose = function (e) {
  console.log(e.code);
  console.log(e.reason);
};
conn.onerror = function (e) {
  console.log(e);
};
*/

console.log("Websocket URL: ", wsUrl);
/*
const socket = new WebSocket(`${wsUrl}/brainstorm`);
*/

const socket = new WebSocket(`${wsUrl}/brainstorm`);

let contributions = [];
let weightRange = [-1, 1];

function determineWeightRange() {
  const scores = contributions.map((con) => con.score);
  console.log("SCORES: ", scores, contributions);
  if (scores.length > 1) {
    weightRange[0] = Math.min.apply(null, scores);
    weightRange[1] = Math.max.apply(null, scores);
  } else {
    weightRange = [0, 0];
  }

  //console.log("Scores: ", weightRange);
}

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

async function setPosition(contId, xPos, yPos) {
  //console.log("HERE:: ", contId, xPos, yPos);
  try {
    const response = await fetch(`/brainstorm/set-position`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contId, xPos, yPos }),
    });
    const newPosition = await response.json();

    //return newPosition;
  } catch (error) {
    console.error(error);
    return null;
  }
}

window.onload = async () => {
  centerCanvas();
  contributions = await getContributions();

  determineWeightRange();

  await addExistingContribution();
};

async function addExistingContribution() {
  for (const contribution of contributions) {
    await addContributionToCanvas(contribution);
  }
}

socket.onopen = function (event) {
  console.log("WebSocket Open (client)");
};

socket.onerror = function (event) {
  console.log("Error Event: ", event);
  console.log("Socket: ", socket);
};

socket.onmessage = async function (event) {
  console.log(event);
  const message = JSON.parse(event.data);
  const validBrainstormId = parseInt(message.brainstormId) === parseInt(brainstormId);
  const isContribution = message.type === "contribution";
  const isScore = message.type === "score";

  const discordSource = message.source === "server-discord";

  contributions = await getContributions();

  if (validBrainstormId && isContribution && discordSource) {
    // message: {source, type, brainstormId, contributionId, contribution}
    const contribution = { id: message.contributionId, content: message.contribution, score: 0, xpos: null, ypos: null };

    await addContributionToCanvas(contribution);
  } else if (validBrainstormId && isScore && discordSource) {
    // {source, type, brainstormId, contribution: {id, score}}
    determineWeightRange();

    editContributionElement(message.contribution.id, message.contribution.score);
  }
};

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

function isOutsideCanvas({ xStart, yStart, xEnd, yEnd }) {
  return xStart < 20 || yStart < 20 || xEnd > 1900 || yEnd > 1060;
}

function hitsTheme({ xStart, yStart, xEnd, yEnd }) {
  const theme = document.getElementById("theme");

  return (
    xStart < theme.offsetLeft + theme.offsetWidth &&
    xEnd > theme.offsetLeft &&
    yStart < theme.offsetTop + theme.offsetHeight &&
    yEnd > theme.offsetTop
  );
}

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

function isColliding(contElemConstraints) {
  return isOutsideCanvas(contElemConstraints) || hitsTheme(contElemConstraints) || hitsContribution(contElemConstraints);
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

function mapPosition(score, xpos, ypos) {
  //console.log("HERE XXX: ", score, xpos, ypos);

  if (xpos && ypos) {
    return { xStart: xpos, yStart: ypos };
  }

  const minScore = weightRange[0];
  const maxScore = weightRange[1];

  let xStart, yStart;

  if (getRndInteger(0, 1) === 0) {
    xStart = mapX(minScore, maxScore, score);
    yStart = getRndInteger(20, 1060);
    console.log("X = map: ", yStart, xStart);
  } else {
    xStart = getRndInteger(20, 1900);
    yStart = mapY(minScore, maxScore, score);

    console.log("Y = map: ", yStart, xStart);
  }

  return { xStart, yStart };
}

function mapWeight(minScore, maxScore, score) {
  const minWeight = 7;
  const maxWeight = 17;
  return map(minWeight, maxWeight, minScore, maxScore, score) / 10;
}

// Increase or decrease font size, weight, opacity depending on score
function setWeight(contElem, score) {
  const textLength = contElem.innerHTML.length;
  const weight = map(7, 17, weightRange[0], weightRange[1], score) / 10;
  const size = (200 - textLength) * weight;
  const fontWeigth = map(100, 900, weightRange[0], weightRange[1], score);
  const opacity = map(5, 10, weightRange[0], weightRange[1], score) / 10;

  console.log("Weight: ", score, weightRange, fontWeigth, size, opacity);

  contElem.style.fontWeight = fontWeigth;
  contElem.style.fontSize = `${size}%`;
  contElem.style.opacity = opacity;
  //console.log("HERE: ", opacity, score, weightRange[0], weightRange[1]);

  return contElem;
}

function createContributionElem({ id, content, score, xpos, ypos }) {
  let contElem = document.createElement("div");
  contElem.id = id;
  contElem.classList.add("contribution");
  contElem.classList.add("temp");
  contElem.innerHTML = content;

  contElem = setWeight(contElem, score);

  const { xStart, yStart } = mapPosition(score, xpos, ypos);

  //console.log("POS: ", xStart, yStart);

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

async function editContributionElement(contId, score) {
  contributions.forEach((cont) => {
    const contElem = document.getElementById(cont.id);
    setWeight(contElem, cont.score);
  });
}

async function addContributionToCanvas(contribution) {
  const { contElem, contElemConstraints } = createContributionElem(contribution);

  //console.log("Contribution:", contribution, contElemConstraints);

  // Collision detection before placing
  if (isColliding(contElemConstraints)) {
    console.log("Collision detected! Trying a new position...");
    canvas.removeChild(contElem);
    await addContributionToCanvas(contribution);
  } else {
    // updatePosition()
    contElem.classList.remove("temp");
    contElem.style.visibility = "visible";

    //console.log("VALUES: ", contribution.id, contElemConstraints.xStart, contElemConstraints.yStart);

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

function getDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1) + Math.pow(y2 - y1));
}

const contributionInput = document.getElementById("add-contribution");

contributionInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    console.log("New contribution: ", contributionInput.value);

    socket.send(
      JSON.stringify({
        source: "website",
        type: "contribution",
        brainstormId: brainstormId,
        //contributionId: contributionId,
        contribution: contributionInput.value,
      })
    );

    contributionInput.value = "";
  }
});
