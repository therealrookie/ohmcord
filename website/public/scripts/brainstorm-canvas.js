const canvas = document.getElementById("canvas");
const canvasContainer = document.getElementById("canvas-container");

let zoom, xPos, yPos;

let canvasGrabbed = false;

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

//window.onload = centerCanvas;
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
