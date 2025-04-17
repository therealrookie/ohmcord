const { brainstormRouter } = require("./routes/brainstorm");
const { questionRouter } = require("./routes/anonymous-questions");
const { quizRouter } = require("./routes/quiz");
const { pollRouter } = require("./routes/poll");
const { setupWSS, takeScreenshot, handleWss } = require("./websocket-functions");
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

  handleWss(wss, ws, path);

  ws.on("close", () => console.log("Client disconnected"));
  ws.on("error", (error) => console.error("WebSocket error:", error));
});

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
