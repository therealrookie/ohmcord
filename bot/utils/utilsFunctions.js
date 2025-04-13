const crypto = require("crypto");

function createHashRoute(input) {
  const hash = crypto.createHash("md5").update(input).digest("hex");
  return hash.slice(0, 6);
}

function getTimeMinsAndSecs(time) {
  let totalSeconds = Math.floor(time / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds - minutes * 60;

  return { minutes, seconds };
}

module.exports = { createHashRoute, getTimeMinsAndSecs };
