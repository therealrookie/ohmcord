const express = require("express");
const brainstormRouter = express.Router();
const { getBrainstorm, getBrainstormContributions, setPosition } = require("../../database/db-brainstorm");
const path = require("path");

// Renders brainstorm.ejs file
brainstormRouter.get("/:hashRoute", async (req, res) => {
  try {
    const brainstormData = await getBrainstorm(req.params.hashRoute);
    if (brainstormData) {
      res.render("brainstorm", {
        theme: brainstormData.theme,
        hash: req.params.hashRoute,
        id: brainstormData.brainstorm_id,
        endBrainstormAt: brainstormData.end_time_ms,
        wsUrl: process.env.WS_URL,
      });
    }
  } catch (error) {
    console.log(error);
    res.render("error", { text: "Dieses Brainstorm existiert leider nicht...", url: process.env.URL });
  }
});

// Gets all brainstorm contributions by brainstormSessionId
brainstormRouter.get("/contributions/:brainstormSessionId", async (req, res) => {
  try {
    const brainstormSessionId = req.params.brainstormSessionId;
    const contributions = await getBrainstormContributions(brainstormSessionId);
    res.status(200).send(contributions);
  } catch (error) {
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

// Inserts or updates the position of a contribution on the Canvas
brainstormRouter.post("/set-position", async (req, res) => {
  try {
    const { contId, xPos, yPos } = req.body;

    const newPosition = await setPosition(contId, xPos, yPos);

    res.status(200).send(newPosition);
  } catch (error) {
    res.status(500).send("Couldn't update position.");
  }
});

// Sends the Screenshot to the client to download
brainstormRouter.get("/download-screenshot/:hashroute", async (req, res) => {
  try {
    const hashRoute = req.params.hashroute;

    const uploadDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadDir, `brainstorm-${hashRoute}.png`);

    res.download(filePath);
  } catch (error) {
    console.log("Error inside /download-canvas : ", error);
    res.status(500).json({ error: "Failed to get the data from the server." });
  }
});

module.exports = { brainstormRouter };
