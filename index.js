const { startBot } = require("./bot/bot");
const { startServer } = require("./website/server");

// Start Discord bot
startBot();

// Start web server
startServer();

/*
// Server
function startServer2() {
    const app = express();
    const PORT = process.env.PORT || 3000;
    const URL = process.env.URL;
  
    // Middleware
    app.use(express.json());
    app.use(express.static(path.join(__dirname, "public")));
    app.use(express.urlencoded({ extended: true }));
  
    // Set up view engine
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "ejs"); // Assuming you use EJS
  
    app.get("/", (req, res) => {
      res.render("index", {
        addBotUrl: process.env.ADD_URL,
      });
    });
  
    app.get("/help", (req, res) => {
      res.render("help");
    });
  
    app.get("/create-quiz", (req, res) => {
      res.render("create-quiz");
    });
  
    app.get("/poll", (req, res) => {
      res.render("create-poll");
    });
  
    app.use("/brainstorm", brainstormRouter);
    app.use("/anonymous-questions", questionRouter);
    app.use("/quiz", quizRouter);
    app.use("/poll", pollRouter);
  
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on ${URL}:${PORT}`); 
    });
  }
    */
