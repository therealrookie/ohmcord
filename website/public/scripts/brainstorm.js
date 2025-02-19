// public/scripts/brainstorm.js

const socket = new WebSocket(`ws://localhost:443/brainstorm`);
const URL = "http://localhost:3000";

const canvas = document.getElementById("canvas");
const canvasContainer = document.getElementById("canvas-container");
const brainstormId = canvas.getAttribute("data-brainstorm-id");

let zoom, xPos, yPos;

let canvasGrabbed = false;

const contributions = [];

/*
const brainstormId = canvasElement.getAttribute("data-brainstorm-id");
const theme = canvasElement.textContent;
const { canvas, dpr } = setupCanvas(canvasElement);
const ctx = canvas.getContext("2d"); //  setupCanvas(canvas);
*/

function centerCanvas() {
  const constraints = canvasContainer.getBoundingClientRect();
  zoom = constraints.height / 1090;

  const scaledWidth = 1920 * zoom;
  const scaledHeight = 1080 * zoom;

  xPos = (constraints.width - scaledWidth) / 2;
  yPos = (constraints.height - scaledHeight) / 2;

  canvas.style.transformOrigin = "top left";

  positionCanvas();
}

function positionCanvas() {
  canvas.style.transform = `scale(${zoom})`;

  canvas.style.left = `${xPos}px`;
  canvas.style.top = `${yPos}px`;
}

function zoomIn() {
  if (zoom > 1.5) {
    zoom = 1.5;
  } else {
    zoom += 0.02;
    positionCanvas();
  }
}

function zoomOut() {
  if (zoom < 0.25) {
    zoom = 0.25;
  } else {
    zoom -= 0.02;
    positionCanvas();
  }
}

canvasContainer.addEventListener("wheel", (event) => {
  if (event.deltaY > 0) zoomOut();
  else zoomIn();
});

canvas.addEventListener("mousedown", (event) => {
  canvasGrabbed = true;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("mouseup", (event) => {
  canvasGrabbed = false;
  canvas.style.cursor = "grab";
});

canvasContainer.addEventListener("mousemove", (event) => {
  if (canvasGrabbed) {
    xPos += event.movementX;
    yPos += event.movementY;
    positionCanvas();
  }
});

window.onload = centerCanvas;
window.onresize = centerCanvas;

const setupTimer = () => {
  const timer = document.getElementById("timer");

  const endTime = timer.getAttribute("data-end-time");
  const timeLeftMillis = endTime - Date.now();
  let totalSeconds = Math.floor(timeLeftMillis / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds - minutes * 60;
  timer.innerHTML = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

  if (minutes + seconds <= 0) {
    clearInterval(timerInterval);
    timer.innerHTML = "00:00";

    //sendcanvasToDiscord();
  }
};

let timerInterval = window.setInterval(setupTimer, 100);

socket.onopen = function (event) {
  console.log("WebSocket Open (client)");
};

socket.onmessage = async function (event) {
  const message = JSON.parse(event.data);
  const validBrainstormId = parseInt(message.brainstormId) === parseInt(brainstormId);
  const isContribution = message.type === "contribution";
  const isScore = message.type === "score";

  const discordSource = message.source === "server-discord";

  if (validBrainstormId && isContribution && discordSource) {
    console.log("SUCCESS: ", message);

    const contribution = message.contribution;

    addContributionToCanvas(contribution);
  } else if (validBrainstormId && isScore && discordSource) {
    console.log(message.contribution);
  }
};

function getRandomPosition() {
  const xStart = Math.floor(Math.random() * 1921);
  const yStart = Math.floor(Math.random() * 1081);

  return { xStart, yStart };
}

function addContributionToCanvas(contribution) {
  const contElem = document.createElement("div");
  contElem.classList.add("contribution");
  contElem.innerHTML = contribution;
  const { xPos, yPos } = getRandomPosition();

  console.log(xPos, yPos);

  contElem.style.left = xPos;
  contElem.style.top = yPos;

  canvas.appendChild(contElem);
}

async function setupExistingContributions() {
  const dbContributions = await getContributions(brainstormId);

  dbContributions.forEach((dbContribution) => {
    const alreadyOnCanvas = contributions.some((obj) => obj.contribution === dbContribution);

    if (!alreadyOnCanvas) {
      addContributionToCanvas(dbContribution);
    }
  });
}

async function getContributions(id) {
  try {
    const response = await fetch(`${URL}/brainstorm/contribution/${id}`);
    const contributions = await response.json();
    return contributions.map((cont) => Object.values(cont)[0]);
  } catch (error) {
    console.log(error);
    return [];
  }
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

function createContributionElem({ id, text, score, xPos, yPos }) {
  let contElem = document.createElement("div");
  contElem.classList.add("contribution");
  contElem.classList.add("temp");
  contElem.innerHTML = text;

  contElem = setWeight(contElem, score);

  const { xStart, yStart } = mapPosition(score);

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

/*  
  MIN / MAX: Min / Max output value
  min / max: min / max input value
  val: value that will be mapped
*/
function map(MIN, MAX, min, max, val) {
  if (min === max || min === val) {
    return MAX - MIN / 2;
  } else {
    return MIN + ((MAX - MIN) / (max - min)) * (val - min);
  }
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mapX(minScore, maxScore, score) {
  const width = 1920;
  const step = width / (Math.abs(minScore) + Math.abs(maxScore));
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
  const step = height / (Math.abs(minScore) + Math.abs(maxScore));
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

function mapPosition(score) {
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

const weightRange = [1, 1];

function mapWeight(minScore, maxScore, score) {
  const minWeight = 0.7;
  const maxWeight = 1.7;
  return map(minWeight, maxWeight, minScore, maxScore, score);
}

function setWeight(contElem, score) {
  const textLength = contElem.innerHTML.length;
  const weight = map(0.7, 1.7, weightRange[0], weightRange[1], score);
  const size = (200 - textLength) * weight;
  const fontWeigth = map(100, 900, weightRange[0], weightRange[1], score);
  const opacity = map(0.5, 1, weightRange[0], weightRange[1], score);
  contElem.style.fontWeight = fontWeigth;
  contElem.style.fontSize = `${size}%`;
  contElem.style.opacity = opacity;
  console.log("HERE: ", contElem.innerHTML.length, score, weightRange[0], weightRange[1], score);

  return contElem;
}

let id = 0;

function createRandomCont() {
  const minScore = weightRange[0];
  const maxScore = weightRange[1];

  id++;

  const score = getRndInteger(minScore, maxScore);
  const text = `ID: ${id}, Hello, ${score} `;
  const xPos = 0;
  const yPos = 0;
  return { id, text, score, xPos, yPos };
}

function test() {
  const contribution = createRandomCont();
  const { contElem, contElemConstraints } = createContributionElem(contribution);

  // Collision detection before placing
  if (isColliding(contElemConstraints)) {
    console.log("Collision detected! Trying a new position...");
    canvas.removeChild(contElem);
    test(contribution);
  } else {
    // updatePosition()
    contElem.classList.remove("temp");
    contElem.style.visibility = "visible";
  }
}

/*

const contributions = [];

setupExistingContributions();





setupTheme();

//const contributions = getContributions(brainstormId);

socket.onopen = function (event) {
  console.log("WebSocket Open (client)");
};

socket.onmessage = async function (event) {
  const message = JSON.parse(event.data);
  const validBrainstormId = parseInt(message.brainstormId) === parseInt(brainstormId);
  const isContribution = message.type === "contribution";
  const isScore = message.type === "score";

  const discordSource = message.source === "server-discord";

  if (validBrainstormId && isContribution && discordSource) {
    console.log("SUCCESS: ", message);

    const contribution = message.contribution;

    addContributionToCanvas(contribution);
  } else if (validBrainstormId && isScore && discordSource) {
    console.log(message.contribution);
    console.log(contributions);
  }
};

function addContributionToCanvas(contribution) {
  ctx.font = `${Math.floor(setSize(contribution) * 0.7)}px Arial`;
  ctx.fillStyle = "#F0EDEE";
  const { xCoord, yCoord } = getPossibleCoords(contribution);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(contribution, xCoord, yCoord);
}

const getCoords = (textWidth, textHeight) => {
  let xCoord = getRndInteger(20 + textWidth / 2, canvas.width / dpr - 20 - textWidth / 2);
  let yCoord = getRndInteger(20 + textHeight / 2, canvas.height / dpr - 20 - textHeight / 2);

  let iterations = 0;

  let found = false;

  while (!found) {
    iterations++;
    contributions.forEach((contribution) => {
      const overlaps = xCoord > contribution.xStart && xCoord < contribution.xEnd && yCoord > contribution.yStart && yCoord < contribution.yEnd;
      if (overlaps) {
        xCoord = getRndInteger(20 + textWidth / 2, canvas.width / dpr - 20 - textWidth / 2);
        yCoord = getRndInteger(20 + textHeight / 2, canvas.height / dpr - 20 - textHeight / 2);
        found = false;
      } else {
        found = true;
      }
    });
  }

  return { xCoord, yCoord };
};

function getPossibleCoords(contribution) {
  const textMeasure = ctx.measureText(contribution);
  const textWidth = textMeasure.width;
  const textHeight = textMeasure.actualBoundingBoxAscent + textMeasure.actualBoundingBoxDescent;

  const { xCoord, yCoord } = getCoords(textWidth, textHeight);

  contributions.push({
    contribution: contribution,
    xStart: xCoord - textWidth / 2,
    xEnd: xCoord + textWidth / 2,
    yStart: yCoord - textHeight / 2,
    yEnd: yCoord + textHeight / 2,
  });

  return { xCoord, yCoord };
}

socket.onclose = function (event) {
  console.log("WebSocket Closed (client)");
};

function handleFormSubmit(event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Get the value from the input field
  const inputField = document.getElementById("add-contribution");
  const contribution = inputField.value;

  // Call newContribution with the value
  newContribution(contribution);

  // Optionally, clear the input field after submission
  inputField.value = "";
}

function newContribution(contribution) {
  socket.send(JSON.stringify({ source: "website", type: "contribution", brainstormId: brainstormId, contribution: contribution }));
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// source: web.dev - High DPI Canvas
function setupCanvas(canvas) {
  // Get the device pixel ratio, falling back to 1.
  var dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  var rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  var ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a090c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  return { canvas, dpr };
}

async function getContributions(id) {
  try {
    const response = await fetch(`${URL}/brainstorm/contribution/${id}`);
    const contributions = await response.json();
    return contributions.map((cont) => Object.values(cont)[0]);
  } catch (error) {
    console.log(error);
    return [];
  }
}

function downloadCanvas() {
  const image = canvasElement.toDataURL("image/png", 1.0);
  var link = document.createElement("a");
  link.download = `${theme.replace(/[<>:"/\|?*.]/g, "")}-brainstorm.png`;
  link.href = image;
  link.click();
}

const sendcanvasToDiscord = () => {
  const base64Image = canvasElement.toDataURL("image/png", 1.0);
  socket.send(JSON.stringify({ source: "website", type: "image", brainstormId: brainstormId, image: base64Image }));
};

function setupTheme() {
  const lines = getMultipleLines(theme);
  ctx.font = `bold ${setSize(lines[0])}px Arial`;

  const coordRange = { contribution: theme, xStart: canvas.width / 2, xEnd: canvas.width / 2, yStart: 0, yEnd: 0 };
  const textCoords = [];

  lines.forEach((line, index) => {
    const textMeasure = ctx.measureText(line);
    const textWidth = textMeasure.width + 20;
    const textHeight = textMeasure.actualBoundingBoxAscent + textMeasure.actualBoundingBoxDescent + 20;

    const yCoord = canvas.height / 2 + (index * textHeight + 10);
    const xCoord = canvas.width / 2;

    if (index === 0) coordRange.yStart = yCoord - textHeight / 2;
    if (index === lines.length - 1) coordRange.yEnd = yCoord + textHeight / 2;

    const currXStart = xCoord - textWidth / 2;
    const currXEnd = xCoord + textWidth / 2;

    coordRange.xStart = currXStart < coordRange.xStart && currXStart;
    coordRange.xEnd = currXEnd > coordRange.xEnd && currXEnd;

    textCoords.push({ line, xCoord, yCoord });
  });

  contributions.push(coordRange);

  ctx.fillStyle = "#07393C";
  ctx.fillRect(coordRange.xStart, coordRange.yStart, coordRange.xEnd - coordRange.xStart, coordRange.yEnd - coordRange.yStart);

  ctx.fillStyle = "#F0EDEE";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  textCoords.forEach((line) => {
    ctx.fillText(line.line, line.xCoord, line.yCoord);
  });

  ctx.scale(dpr, dpr);
}

function setSize(text) {
  return (2 - text.length / 60) * 20;
}

function getMultipleLines(text) {
  let lines = [];
  if (text.length > 60) {
    lines = getSubstrings(text, 2);
  } else if (text.length > 120) {
    lines = getSubstrings(text, 3);
  } else {
    lines.push(text);
  }
  return lines;
}

function getSubstrings(text, amount) {
  let subStrings = [];
  let startSubString = 0;
  for (let numOfCuts = 1; numOfCuts < amount; numOfCuts++) {
    for (let i = startSubString; i <= text.length / amount; i++) {
      let currPos = Math.floor(text.length / amount) * numOfCuts - i;
      if (text[currPos] === " ") {
        subStrings.push(text.slice(startSubString, currPos));
        startSubString = currPos;
        break;
      }
    }
  }
  subStrings.push(text.slice(startSubString));

  return subStrings;
}

*/
