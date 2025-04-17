const { brainstormRouter } = require("./routes/brainstorm");
const { questionRouter } = require("./routes/anonymous-questions");
const { quizRouter } = require("./routes/quiz");
const { pollRouter } = require("./routes/poll");
const { setupWSS, takeScreenshot } = require("./websockets");
const { addAnonymousQuestion } = require("../database/db-anon-questions");

const PORT = process.env.PORT || 3000;

var express = require("express");
var http = require("http");
const path = require("path");
var WebSocket = require("ws");
const url = require("url");
const https = require("https");
const fs = require("fs");
var app = express();

app.use(express.json());
var server = http.createServer(app);

var wss = new WebSocket.Server({ server });

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

function handleBrainstormConnection(ws) {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    await handleBrainstormMessage(data);
  });
}

function handleQuestionsConnection(ws) {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    await handleQuestionMessage(data);
  });
}

async function handleBrainstormMessage(data) {
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

    wsAnswer(data);
  }
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

function wsAnswer(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function startServer() {
  // Set EJS as the templating engine
  app.set("view engine", "ejs");
  app.set("views", path.join(process.cwd(), "/website/views")); // Set views folder

  // Serve static files (CSS, JS, images, etc.)
  app.use(express.static(path.join(process.cwd(), "/website/public")));

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
