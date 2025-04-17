var WebSocket = require("ws");
const url = require("url");
const https = require("https");
const fs = require("fs");
const path = require("path");

const { addAnonymousQuestion } = require("../database/db-anon-questions");

function setupWSS(server) {}

function handleWss(wss, ws, path) {
  if (path === "/brainstorm") {
    handleBrainstormConnection(ws, wss);
  } else if (path === "/questions") {
    handleQuestionsConnection(ws, wss);
  } else {
    ws.close(4000, "Invalid WebSocket route");
  }
}

function handleBrainstormConnection(ws, wss) {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    await handleBrainstormMessage(data, wss);
  });
}

function handleQuestionsConnection(ws, wss) {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    await handleQuestionMessage(data, wss);
  });
}

async function handleBrainstormMessage(data, wss) {
  if (!data.source.includes("server")) {
    data.source = `server-${data.source}`; // server-discord or server-website

    console.log("WEBSOCKET SERVER: ", data);

    if (data.type === "image-request") {
      try {
        await takeScreenshot(data.hashRoute);
        data.source = `server-website`;
        data.type = "image";
      } catch (e) {
        console.error("Image fetch failed:", e.message);
        return;
      }
    }

    wsAnswer(data, wss);
  }
}

async function handleQuestionMessage(data, wss) {
  if (!data.source?.startsWith("server")) {
    data.source = `server-${data.source}`; // server-discord or server-website
    console.log("DATA: ", data);
    if (data.type === "question") {
      questionId = await addAnonymousQuestion(data.questionSessionId, data.question);
      data.questionId = questionId;
    }
    wsAnswer(data, wss);
  }
}

function wsAnswer(message, wss) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Takes a screenshot of the Brainstorm Canvas
// https://apiflash.com/documentation
// https://stackoverflow.com/questions/39880832/how-to-return-a-promise-when-writestream-finishes
function takeScreenshot(hashRoute) {
  const uploadDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadDir, `brainstorm-${hashRoute}.png`);

  const apiFlashUrl = createApiFlashUrl(hashRoute);

  return new Promise((resolve, reject) => {
    https.get(apiFlashUrl, (response) => {
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on("error", reject);
      fileStream.on("finish", () => {
        fileStream.end();
        resolve();
      });
    });
  });
}

function createApiFlashUrl(hashRoute) {
  return (
    "https://api.apiflash.com/v1/urltoimage?" +
    new URLSearchParams({
      access_key: process.env.API_FLASH_KEY,
      url: `${process.env.URL}/brainstorm/${hashRoute}`,
      element: "#canvas",
      width: 3840,
      height: 2160,
      format: "png",
    }).toString()
  );
}

module.exports = { setupWSS, takeScreenshot, handleWss };
