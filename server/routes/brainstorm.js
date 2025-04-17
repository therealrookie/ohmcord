const express = require("express");
const brainstormRouter = express.Router();
const { getBrainstorm, getBrainstormContributions, setPosition } = require("../../database/db-brainstorm");
const path = require("path");

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
    }
  } catch (error) {
    console.log(error);
    res.render("error", { text: "Dieses Brainstorm existiert leider nicht...", url: process.env.URL });
  }
});

/*
brainstormRouter.get("/:hashroute", async (req, res) => {
  const brainstormData = await getBrainstorm(req.params.hashroute);

  res.render("brainstorm", {
    theme: brainstormData.theme,
  });
});
*/

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

brainstormRouter.param("url", async (req, res, next, url) => {
  next();
});

module.exports = { brainstormRouter };
