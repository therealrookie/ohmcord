const crypto = require("crypto");

// Creates a 6 digit Hash-Code
// https://gist.github.com/kitek/1579117
function createHashRoute(input) {
  const hash = crypto.createHash("md5").update(input).digest("hex");
  return hash.slice(0, 6);
}

// Returns ms into {minutes, seconds}
function getTimeMinsAndSecs(timeInMillis) {
  let totalSeconds = Math.floor(timeInMillis / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds - minutes * 60;

  return { minutes, seconds };
}

module.exports = { createHashRoute, getTimeMinsAndSecs };
