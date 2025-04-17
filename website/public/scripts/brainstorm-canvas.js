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

window.onresize = centerCanvas;

// Makes the downloadbutton visible and the input field hidden
async function timerEnds(timer) {
  clearInterval(timerInterval);

  timer.innerHTML = "00:00";

  const downloadButton = document.getElementById("download-button");
  downloadButton.style.visibility = "visible";

  const addContribution = document.getElementById("add-contribution");
  addContribution.style.visibility = "hidden";
}

// Sets up the timer, is called every 100ms
const setupTimer = async () => {
  const timer = document.getElementById("timer");

  const endTime = timer.getAttribute("data-end-time");
  const timeLeftMillis = endTime - Date.now();

  if (timeLeftMillis <= 0) {
    await timerEnds(timer);
    return;
  }

  let totalSeconds = Math.floor(timeLeftMillis / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds - minutes * 60;

  timer.innerHTML = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
};

let timerInterval = window.setInterval(setupTimer, 100);

// Requests the canvas as Screenshot to download
async function downloadCanvas() {
  const hashRoute = document.getElementById("hash-route").innerHTML;
  try {
    const response = await fetch(`/brainstorm/download-screenshot/${hashRoute}`, {
      method: "GET",
    });

    console.log(response);

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brainstorm-${hashRoute}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    console.log(response);
  } catch (error) {
    console.error(error);
    return null;
  }
}
