const express = require("express");
const brainstormRouter = express.Router();
const { getBrainstorm, getBrainstormContributions, getContributionPositions, setPosition } = require("../../database/dbBrainstormFunctions");
const path = require("path");

/*
const { WebSocket } = require("ws");
const ws = new WebSocket(`${process.env.WS_URL}`);
*/
const https = require("https");
const fs = require("fs");

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
  console.log("HERE brainstormrouter");
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

function saveImage(response, hashRoute) {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(__dirname, "../public/uploads");
    const filePath = path.join(uploadDir, `brainstorm-${hashRoute}.jpeg`);

    console.log("Paths: ", uploadDir, filePath);

    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileStream = fs.createWriteStream(filePath);
    response.pipe(fileStream);

    fileStream.on("finish", () => resolve(filePath));
    fileStream.on("error", (err) => reject(err));
  });
}

brainstormRouter.put("/download-screenshot", async (req, res) => {
  try {
    const { url, hashRoute } = req.body;

    console.log("API FLASH URL: ", url);

    https.get(
      "https://api.apiflash.com/v1/urltoimage?" +
        new URLSearchParams({
          access_key: process.env.API_FLASH_KEY,
          url: url,
          element: "#canvas",
        }).toString(),
      async (response) => {
        try {
          const filePath = await saveImage(response, hashRoute);
          res.status(200).json({ message: "Screenshot saved successfully!", filePath });
        } catch (error) {
          console.error("File save error:", error);
          res.status(500).json({ error: "Failed to save the screenshot." });
        }

        //response.pipe(fs.createWriteStream(`../public/uploads/brainstorm-${hashRoute}.jpeg`));
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to save the screenshot." });
  }
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
