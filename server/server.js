const { brainstormRouter } = require("./routes/brainstorm");
const { questionRouter } = require("./routes/anonymous-questions");
const { quizRouter } = require("./routes/quiz");
const { pollRouter } = require("./routes/poll");
const { handleWss } = require("./websocket-functions");

const PORT = process.env.PORT || 3000;

var express = require("express");
var http = require("http");
const path = require("path");
var WebSocket = require("ws");
var app = express();

app.use(express.json());

var server = http.createServer(app);
var wss = new WebSocket.Server({ server });

// Handles Websocket Server connection
wss.on("connection", (ws, req) => {
  console.log("New WebSocket connection established.");

  handleWss(wss, ws, req);

  ws.on("close", () => console.log("Client disconnected"));
  ws.on("error", (error) => console.error("WebSocket error:", error));
});

function startServer() {
  // Sets EJS as the templating engine
  app.set("view engine", "ejs");

  // Sets views folder
  app.set("views", path.join(process.cwd(), "/website/views"));

  // Serves static files (CSS, JS, images, etc.)
  app.use(express.static(path.join(process.cwd(), "/website/public")));

  // Renders index.ejs
  app.get("/", (req, res) => {
    res.render("index", {
      addBotUrl: process.env.ADD_URL,
    });
  });

  // Renders help.ejs
  app.get("/help", (req, res) => {
    res.render("help");
  });

  // Renders create-quiz.ejs
  app.get("/create-quiz", (req, res) => {
    res.render("create-quiz");
  });

  // Renders poll.ejs
  app.get("/poll", (req, res) => {
    res.render("create-poll");
  });

  // Uses express routers
  app.use("/brainstorm", brainstormRouter);
  app.use("/anonymous-questions", questionRouter);
  app.use("/quiz", quizRouter);
  app.use("/poll", pollRouter);

  // Starts server
  server.listen(PORT, function () {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { startServer };
