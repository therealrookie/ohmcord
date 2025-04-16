# Quellen

## Dependencies

Liste der Node Modules:

| Package    | Version  | Source                                |
| ---------- | -------- | ------------------------------------- |
| discord.js | ^14.18.0 | https://discord.js.org                |
| dotenv     | ^16.4.5  | https://www.npmjs.com/package/dotenv  |
| ejs        | ^3.1.10  | https://www.npmjs.com/package/ejs     |
| express    | ^4.21.1  | https://expressjs.com                 |
| fs         | ^0.0.1   | Node built-in module (shim)           |
| nodemon    | ^3.1.7   | https://www.npmjs.com/package/nodemon |
| path       | ^0.12.7  | Node built-in module (shim)           |
| pg         | ^8.13.1  | https://node-postgres.com             |
| ws         | ^8.18.1  | https://www.npmjs.com/package/ws      |

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

## 📚 HTML / CSS / JavaScript Tutorials & Snippets

### W3Schools

- Various HTML/CSS layout examples were referenced and adapted from [W3Schools.com](https://www.w3schools.com).
- Examples included: form layouts, flexbox containers, buttons, modals, and responsive navbars.
- No full templates were copied; all markup was written manually using W3Schools as a reference.

### Stack Overflow

- Small code snippets were referenced for solving isolated issues (e.g., "How to open a modal on button click", or "How to write a SQL query with Node.js").
- In cases where more than 3 lines were reused directly, comments in the code reference the original thread.

### YouTube Tutorials

If applicable — list them like this:

- **Discord Bot Setup** – YouTube Tutorial by CodeLyon  
  https://www.youtube.com/watch?v=Fsn5oV8pzUo  
  Used as a base to structure command files and event handlers.

---

## 🧩 Templates and Boilerplate

None of the code was generated or copied from full project templates. All structure was manually created and customized. Where inspiration was taken from tutorials or other GitHub repositories, this is noted in the code and listed above.

---

## 📝 Notes

- All third-party code is commented as such in the project where applicable.
- The rest of the code, unless stated otherwise, was written by the author of this thesis.
