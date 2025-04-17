var WebSocket = require("ws");
const url = require("url");
const https = require("https");
const fs = require("fs");
const path = require("path");

const { addAnonymousQuestion } = require("../database/db-anon-questions");

function setupWSS(server) {}

function createApiFlashUrl(hashRoute) {
  return (
    "https://api.apiflash.com/v1/urltoimage?" +
    new URLSearchParams({
      access_key: process.env.API_FLASH_KEY,
      url: `${process.env.URL}/brainstorm/${hashRoute}`,
      element: "#canvas",
      width: 3840,
      height: 2160,
      format: "png",
    }).toString()
  );
}

// Takes a screenshot of the Brainstorm Canvas
// https://apiflash.com/documentation
// https://stackoverflow.com/questions/39880832/how-to-return-a-promise-when-writestream-finishes
function takeScreenshot(hashRoute) {
  const uploadDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadDir, `brainstorm-${hashRoute}.png`);

  const apiFlashUrl = createApiFlashUrl(hashRoute);

  return new Promise((resolve, reject) => {
    https.get(apiFlashUrl, (response) => {
      //if (response.statusCode !== 200) reject();

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on("error", reject);
      fileStream.on("finish", () => {
        fileStream.end();
        resolve();
      });
    });
  });

  return new Promise((resolve, reject) => {
    const apiFlashUrl = createApiFlashUrl(hashRoute);

    https
      .get(apiFlashUrl, async (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`API Flash returned status ${response.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close(() => {
            console.log("Image saved:", filePath);
            resolve(filePath);
          });
        });
      })
      .on("error", (error) => {
        console.error("HTTPS Request failed:", error.message);
        reject(error);
      });
  });

  return new Promise((resolve, reject) => {
    https
      .get(apiFlashUrl, (response) => {
        console.log("API FLASH RES: ", response);

        //if (response.statusCode !== 200) reject();

        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.end();
        fileStream.on("error", reject);
        fileStream.on("finish", () => {
          resolve();
        });
      })
      .on("error", (error) => {
        console.log(error);
      });
  });

  return new Promise((resolve, reject) => {
    https
      .get(apiFlashUrl, (response) => {
        console.log("API FLASH RES: ", response);

        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close(() => {
            console.log("Image saved:", filePath);
            resolve(filePath);
          });
        });
      })
      .on("error", (error) => {
        console.error("HTTPS Request failed:", error.message);
        reject(error);
      });
  });

  /*
  try {
    https.get(apiFlashUrl, (response) => {
      if (response.statusCode !== 200) throw new Error("Screenshot failed!");

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on("finish", () => {
        console.log("Screenshot upload finished!");
      });
    });
  } catch (error) {
    console.error(error);
  }

  
  return new Promise((resolve, reject) => {
    https
      .get(apiFlashUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`API Flash returned status ${response.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close(() => {
            console.log("Image saved:", filePath);
            resolve(filePath);
          });
        });
      })
      .on("error", (error) => {
        console.error("HTTPS Request failed:", error.message);
        reject(error);
      });
  });
  */
}

module.exports = { setupWSS, takeScreenshot };
