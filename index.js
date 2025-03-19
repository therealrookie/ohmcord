const { startBot } = require("./bot/bot");
const { startServer } = require("./website/server");

const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// Start Discord bot
//startBot();

// Start web server
//startServer();
