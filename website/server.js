// website/server.js
//const express = require("express");
//const path = require("path");

/*
const WebSocket = require("ws");
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });






const server = require("http").createServer();

const { WebSocketServer, WebSocket } = require("ws");
const url = require("url");
const WSS = new WebSocketServer({ server });

server.listen(process.env.WS_PORT, "0.0.0.0", () => {
  console.log(server);
  console.log(`WebSocket server listening on port ${process.env.WS_PORT}`);
});

WSS.on("connection", (ws, req) => {
  console.log("New client connected...");
  const path = url.parse(req.url).pathname;

  if (path === "/brainstorm") {
    handleBrainstormConnection(ws);
  } else if (path === "/questions") {
    handleQuestionsConnection(ws);
  } else {
    ws.close(4000, "Invalid WebSocket route");
  }

  ws.on("close", () => console.log("Client disconnected"));
  ws.on("error", (error) => console.error("WebSocket error:", error));
});








*/

var express = require("express");
var http = require("http");
const https = require("https");
const fs = require("fs");

var WebSocket = require("ws");

var app = express();
app.use(express.json());
var server = http.createServer(app);
var wss = new WebSocket.Server({ server });
const url = require("url");

const path = require("path");

const PORT = process.env.PORT || 3000;
const URL = process.env.URL;

const { brainstormRouter } = require("./routes/brainstorm");
const { questionRouter } = require("./routes/anonymous-questions");
const { quizRouter } = require("./routes/quiz");
const { pollRouter } = require("./routes/poll");

const { addAnonymousQuestion } = require("../database/dbAnonymousQuestionFunctions");

async function handleBrainstormMessage(data) {
  if (!data.source?.startsWith("server")) {
    data.source = `server-${data.source}`; // server-discord or server-website

    if (data.type === "image-request") {
      data.source = `server-website`;
      data.type = "image";
      data.image = await getImageUrl(data.hashRoute);
    }

    wsAnswer(data);
  }
}

async function getImageUrl(hashRoute) {
  try {
    https.get(
      "https://api.apiflash.com/v1/urltoimage?" +
        new URLSearchParams({
          access_key: process.env.API_FLASH_KEY,
          url: `${process.env.URL}/brainstorm/${hashRoute}`,
          element: "#canvas",
        }).toString(),
      async (response) => {
        console.log("API FLASH RESPONSE: ", response);

        const uploadDir = path.join(process.cwd(), "uploads");
        const filePath = path.join(uploadDir, `brainstorm-${hashRoute}.jpeg`);

        const imageSave = response.pipe(fs.createWriteStream(filePath));
        console.log("getImageUrl - filepath: ", imageSave, filePath);
        /*
        const filePath = await saveImage(response, hashRoute);
        return filePath;
        */
      }
    );
  } catch (error) {
    console.log(error);
    return null;
  }
}

function saveImage(response, hashRoute) {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadDir, `brainstorm-${hashRoute}.jpeg`);

    console.log("Paths: ", uploadDir, filePath);

    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileStream = fs.createWriteStream(filePath);
    response.pipe(fileStream);

    fileStream.on("finish", () => resolve(filePath));
    fileStream.on("error", (err) => reject(err));
  });
}

function handleBrainstormConnection(ws) {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    await handleBrainstormMessage(data);
  });
}

async function handleQuestionMessage(data) {
  if (!data.source?.startsWith("server")) {
    data.source = `server-${data.source}`; // server-discord or server-website
    console.log("DATA: ", data);
    if (data.type === "question") {
      questionId = await addAnonymousQuestion(data.questionSessionId, data.question);
      data.questionId = questionId;
    }
    wsAnswer(data);
  }
}

function handleQuestionsConnection(ws) {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    await handleQuestionMessage(data);
  });
}

function wsAnswer(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

wss.on("connection", (ws, req) => {
  const path = url.parse(req.url).pathname;
  console.log("New WebSocket connection established.", path);

  if (path === "/brainstorm") {
    handleBrainstormConnection(ws);
  } else if (path === "/questions") {
    handleQuestionsConnection(ws);
  } else {
    ws.close(4000, "Invalid WebSocket route");
  }

  ws.on("close", () => console.log("Client disconnected"));
  ws.on("error", (error) => console.error("WebSocket error:", error));
});

function startServer() {
  // Set EJS as the templating engine
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "/views")); // Set views folder

  // Serve static files (CSS, JS, images, etc.)
  app.use(express.static(path.join(__dirname, "public")));

  // Route to render index.ejs
  app.get("/", (req, res) => {
    res.render("index", {
      addBotUrl: process.env.ADD_URL,
    });
  });

  app.get("/help", (req, res) => {
    res.render("help");
  });

  app.get("/create-quiz", (req, res) => {
    res.render("create-quiz");
  });

  app.get("/poll", (req, res) => {
    res.render("create-poll");
  });

  app.use("/brainstorm", brainstormRouter);
  app.use("/anonymous-questions", questionRouter);
  app.use("/quiz", quizRouter);
  app.use("/poll", pollRouter);

  // Start server
  server.listen(PORT, function () {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { startServer };
