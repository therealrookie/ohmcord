# Quellen

## Dependencies

Liste der Node Modules:

| Node Module | Version  | Quelle                                |
| ----------- | -------- | ------------------------------------- |
| discord.js  | ^14.18.0 | https://discord.js.org                |
| dotenv      | ^16.4.5  | https://www.npmjs.com/package/dotenv  |
| ejs         | ^3.1.10  | https://www.npmjs.com/package/ejs     |
| express     | ^4.21.1  | https://expressjs.com                 |
| nodemon     | ^3.1.7   | https://www.npmjs.com/package/nodemon |
| pg          | ^8.13.1  | https://node-postgres.com             |
| ws          | ^8.18.1  | https://www.npmjs.com/package/ws      |

---

## /bot

### bot/deploy-commands.js:

https://discordjs.guide/creating-your-bot/command-deployment.html#command-registration

### bot/handleInteractions.js

https://discordjs.guide/creating-your-bot/command-handling.html#executing-commands

### bot/register-commands.js:

https://discordjs.guide/creating-your-bot/command-deployment.html#guild-commands

### bot/main-commands/poll.js

Funktion: String.fromCodePoint()

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint

### bot/utils/utils-functions.js

Funktion: crypto.createHash("md5").update(input).digest("hex")

https://gist.github.com/kitek/1579117

## /database

### /database/db.js

https://github.com/brianc/node-postgres/tree/master/packages/pg-pool

### /database/dbBrainstormFunctions.js

Query: ON CONFLICT

https://stackoverflow.com/questions/36359440/postgresql-insert-on-conflict-update-upsert-use-all-excluded-values

### /database/dbPollFunctions.js

https://node-postgres.com/features/transactions

## /website

### /website/create-poll.js

emoji-picker-element

https://github.com/nolanlawson/emoji-picker-element?tab=readme-ov-file#dark-mode

dropdown menu

https://www.w3schools.com/css/css_dropdowns.asp

calender

https://dev.to/wizdomtek/creating-a-dynamic-calendar-using-html-css-and-javascript-29m
