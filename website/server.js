// website/server.js
//const express = require("express");
//const path = require("path");
const { brainstormRouter } = require("./routes/brainstorm");
const { questionRouter } = require("./routes/anonymous-questions");
const { quizRouter } = require("./routes/quiz");
const { pollRouter } = require("./routes/poll");

const fs = require("fs");
const { addAnonymousQuestion } = require("../database/dbAnonymousQuestionFunctions");

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

function wsAnswer(message) {
  WSS.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

async function getImageUrl(parsedMessage) {
  const base64Data = parsedMessage.image.replace("data:image/png;base64,", "");
  const fileName = `brainstorm-${Date.now()}.png`;
  const imagePath = path.join(__dirname, "public", "uploads", fileName);

  await fs.writeFile(imagePath, base64Data, "base64", (error) => {
    if (error) console.log("Error writing file: ", error);
  });
  console.log("Image saved successfully:", imagePath);

  return `${process.env.URL}:${process.env.PORT}/uploads/${fileName}`;
}

function handleBrainstormConnection(ws) {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);

    if (!data.source?.startsWith("server")) {
      data.source = `server-${data.source}`; // server-discord or server-website

      if (data.type === "image") {
        data.image = await getImageUrl(data);
      } else if (data.type === "contribution") {
      }
      wsAnswer(data);
    }
  });
}

function handleQuestionsConnection(ws) {
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    if (!data.source?.startsWith("server")) {
      data.source = `server-${data.source}`; // server-discord or server-website
      console.log("DATA: ", data);
      if (data.type === "question") {
        questionId = await addAnonymousQuestion(data.questionSessionId, data.question);
        data.questionId = questionId;
      }
      wsAnswer(data);
    }
  });
}

*/

var express = require("express");
var http = require("http");
var WebSocket = require("ws");

var app = express();
var server = http.createServer(app);
var wss = new WebSocket.Server({ server });

const path = require("path");

const PORT = process.env.PORT || 3000;
const URL = process.env.URL;

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

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established.");

    ws.on("message", (message) => {
      console.log(`Received message => ${message}`);
    });
    ws.send(JSON.stringify({ data: "Hello! Message From Server!!" }));
  });

  // Start server
  server.listen(PORT, function () {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { startServer };
