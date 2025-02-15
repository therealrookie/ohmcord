// public/scripts/brainstorm.js

const socket = new WebSocket(`ws://localhost:443/brainstorm`);
const URL = "http://localhost:3000";

const canvasElement = document.getElementById("bs-canvas");
const brainstormId = canvasElement.getAttribute("data-brainstorm-id");
const theme = canvasElement.textContent;
const { canvas, dpr } = setupCanvas(canvasElement);
const ctx = canvas.getContext("2d"); //  setupCanvas(canvas);

const contributions = [];

setupExistingContributions();

const setupTimer = () => {
  const timer = document.getElementById("timer");

  const endTime = timer.getAttribute("data-end-time");
  const timeLeftMillis = endTime - Date.now();
  let totalSeconds = Math.floor(timeLeftMillis / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds - minutes * 60;
  timer.innerHTML = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

  if (minutes + seconds === 0) {
    clearInterval(timerInterval);
    sendcanvasToDiscord();
    timer.innerHTML = "00:00";
  }
};

let timerInterval = window.setInterval(setupTimer, 100);

async function setupExistingContributions() {
  const dbContributions = await getContributions(brainstormId);

  dbContributions.forEach((dbContribution) => {
    const alreadyOnCanvas = contributions.some((obj) => obj.contribution === dbContribution);

    if (!alreadyOnCanvas) {
      addContributionToCanvas(dbContribution);
    }
  });
}

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
