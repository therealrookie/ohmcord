const express = require("express");
const brainstormRouter = express.Router();
const { getBrainstorm, getBrainstormContributions, getContributionPositions, setPosition } = require("../../database/dbBrainstormFunctions");

/*
const { WebSocket } = require("ws");
const ws = new WebSocket(`${process.env.WS_URL}`);
*/
const https = require("https");
const fs = require("fs");

var domtoimage = require("dom-to-image");

const selectedProduct = Math.floor(Math.random() * 3);

/*
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
*/

brainstormRouter.get("/:url", async (req, res) => {
  try {
    const brainstormData = await getBrainstorm(req.params.url);
    if (brainstormData) {
      res.render("brainstorm", {
        theme: brainstormData.theme,
        hash: req.params.url,
        id: brainstormData.brainstorm_id,
        endBrainstormAt: brainstormData.end_time_ms,
        wsUrl: process.env.WS_URL,
      });
    } else {
      res.render("error", { text: "Brainstorm couldn't be found" });
    }
  } catch (error) {
    console.log(error);
    res.render("error", { text: "An error occurred while fetching brainstorm data" });
  }
});

brainstormRouter.get("/contributions/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const contributions = await getBrainstormContributions(id);
    res.status(200).send(contributions);
  } catch (error) {
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

brainstormRouter.post("/set-position", async (req, res) => {
  try {
    const { contId, xPos, yPos } = req.body;

    const newPosition = await setPosition(contId, xPos, yPos);

    res.status(200).send(newPosition);
  } catch (error) {
    res.status(500).send("Couldn't update position.");
  }
});

brainstormRouter.put("/download-screenshot", async (req, res) => {
  try {
    const canvas = req.body.canvas;

    console.log(canvas);

    domtoimage.toPng(canvas).then(function (dataUrl) {
      console.log(dataUrl);
    });
  } catch (error) {
    console.log(error);
  }

  /*
  try {
    const { url, hashRoute } = req.body;

    console.log(url);

    https.get(
      "https://api.apiflash.com/v1/urltoimage?" +
        new URLSearchParams({
          access_key: "bc3e9711cb104410acafbcda2e2a4fcb",
          url: "https://www.example.com/",
          element: "div",
        }).toString(),
      (response) => {
        response.pipe(fs.createWriteStream(`website/public/uploads/brainstorm-${hashRoute}.jpeg`));
      }
    );
  } catch (error) {
    console.log(error);
  }
    */
});

brainstormRouter.param("url", async (req, res, next, url) => {
  next();
});
/*
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
   */

module.exports = { brainstormRouter };
