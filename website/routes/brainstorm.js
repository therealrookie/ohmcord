const express = require("express");
const brainstormRouter = express.Router();
const { getBrainstorm, getBrainstormContributions } = require("../../database/dbBrainstormFunctions");

const { WebSocket } = require("ws");
const ws = new WebSocket(`ws://${process.env.WS_URL}:${process.env.WS_PORT}`);

const selectedProduct = Math.floor(Math.random() * 3);

brainstormRouter.get("/:url", async (req, res) => {
  try {
    const brainstormData = await getBrainstorm(req.params.url);
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Product Page</title>
        </head>
        <body>
            <h1>${brainstormData.theme}</h1>
            <h3>${brainstormData.brainstorm_id}, ${brainstormData.end_time_ms}</h3>
            <p>${selectedProduct}</p>
        </body>
        </html>
    `;
    res.send(html);
  } catch (error) {
    console.log(error);
    res.render("error", { text: "An error occurred while fetching brainstorm data" });
  }
});

/*
brainstormRouter.get("/:url", async (req, res) => {
  try {
    const brainstormData = await getBrainstorm(req.params.url);
    if (brainstormData) {
      res.render("brainstorm", {
        theme: brainstormData.theme,
        hash: req.params.url,
        id: brainstormData.brainstorm_id,
        endBrainstormAt: brainstormData.end_time_ms,
      });
    } else {
      res.render("error", { text: "Brainstorm couldn't be found" });
    }
  } catch (error) {
    console.log(error);
    res.render("error", { text: "An error occurred while fetching brainstorm data" });
  }
});
*/

brainstormRouter.get("/contribution/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const contributions = await getBrainstormContributions(id);
    res.status(200).send(contributions);
  } catch (error) {
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

brainstormRouter.param("url", async (req, res, next, url) => {
  next();
});

async function handleBrainstormMessage(message, ws, wss) {
  const { brainstormId, contribution } = message;

  // Save the contribution to the database
  //await saveContribution(brainstormId, contribution);

  // Broadcast the new contribution to all connected clients

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "newContribution", data: { brainstormId, contribution } }));
    }
  });
}

module.exports = { brainstormRouter, handleBrainstormMessage };
