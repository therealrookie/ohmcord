//const { startBot } = require("./bot/bot");
//const { startServer } = require("./website/server");

//const { WebSocketServer } = require("ws");

// Start Discord bot
//startBot();

// Start web server
//startServer();

try {
  const { WebSocketServer } = require("ws");

  const wss = new WebSocketServer({ port: 443 });

  console.log("Starting WS Server...");

  wss.on("connection", function connection(ws) {
    console.log("New client connected");

    ws.on("message", function message(data) {
      console.log("received: %s", data);
    });

    ws.send("something");
  });
} catch (error) {
  console.error("WebSocket server failed to start:", error);
}
