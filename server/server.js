const { brainstormRouter } = require("./routes/brainstorm");
const { questionRouter } = require("./routes/anonymous-questions");
const { quizRouter } = require("./routes/quiz");
const { pollRouter } = require("./routes/poll");
const { setupWSS } = require("./websockets");
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
      data.source = `server-website`;
      data.type = "image";
      try {
        await getImageUrl(data.hashRoute);
      } catch (e) {
        console.error("Image fetch failed:", e.message);
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

async function getImageUrl(hashRoute) {
  console.log("GET IMAGE URL FUNCTION ", hashRoute);
  console.log("API FLASH URL: ", `${process.env.URL}/brainstorm/${hashRoute}`);

  const url =
    "https://api.apiflash.com/v1/urltoimage?" +
    new URLSearchParams({
      access_key: process.env.API_FLASH_KEY,
      url: `${process.env.URL}/brainstorm/${hashRoute}`,
      element: "#canvas",
      width: 3840,
      height: 2160,
      format: "png",
    }).toString();

  const uploadDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadDir, `brainstorm-${hashRoute}.png`);

  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`API Flash returned status ${response.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close(() => {
            console.log("✅ Image saved:", filePath);
            resolve(filePath);
          });
        });
      })
      .on("error", (err) => {
        console.error("❌ HTTPS Request failed:", err.message);
        reject(err);
      });
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
