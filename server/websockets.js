var WebSocket = require("ws");
const url = require("url");
const https = require("https");
const fs = require("fs");
//const path = require("path");

const { addAnonymousQuestion } = require("../database/db-anon-questions");

function setupWSS(server) {}

module.exports = { setupWSS };
