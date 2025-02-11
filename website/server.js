// website/server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const { brainstormRouter } = require("./routes/brainstorm");
const { questionRouter } = require("./routes/anonymous-questions");
const { quizRouter } = require("./routes/quiz");
const { pollRouter } = require("./routes/poll");

const { addAnonymousQuestion } = require("../database/dbAnonymousQuestionFunctions");

const { WebSocketServer, WebSocket } = require("ws");
const url = require("url");
const WSS = new WebSocketServer({ port: process.env.WS_PORT });

WSS.on("connection", (ws, req) => {
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

// Server
function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const URL = process.env.URL;

  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));
  app.use(express.urlencoded({ extended: true }));

  // Set up view engine
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs"); // Assuming you use EJS

  app.get("/", (req, res) => {
    res.render("index");
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

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on ${URL}:${PORT}`);
  });
}

module.exports = { startServer };
