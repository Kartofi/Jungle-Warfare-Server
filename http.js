const express = require("express");
const rateLimit = require("express-rate-limit");
const fs = require("fs");

const app = express();
var bodyParser = require("body-parser");
var compression = require("compression");
const cookieParser = require("cookie-parser");

const port = process.env.httpPort | 2223;

const mongoDB = require("./Utils/MongoDBManager");
const moderate = require("./Utils/moderateText");

const limiter = rateLimit({
  max: 200,
  windowMs: 60000,
  message: { status: "unSuccessful" },
});
app.set("view engine", "ejs");
app.use(limiter);
app.use(cookieParser());
app.use(compression());
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);
app.use((err, req, res, next) => {
  if (err) {
    if (err.type == "entity.too.large") {
      res
        .status(413)
        .send({ status: "unSuccessful", error: "Payload too large!" });
    } else if (err.type == "entity.parse.failed") {
      res.status(400).send({ status: "unSuccessful", error: "Parse failed!" });
    } else {
      res.status(400).send({ status: "unSuccessful", error: err.type });
    }
  } else {
    next();
  }
});
// Api
app.get("/api/lobbies", (req, res) => {
  let dataPlayers = [];
  let keys = Object.keys(lobbies);
  keys.forEach((key) => {
    dataPlayers.push({
      name: key,
      creator: lobbies[key].creator,
      creatorId: lobbies[key].creatorId,
      players: lobbies[key].players.length,
      lobbySize: lobbies[key].rules.lobbySize,
    });
  });
  res.send({ lobbies: dataPlayers });
});
app.post("/api/login", async (req, res) => {
  let name = req.body.name;
  let password = req.body.password;
  let versionHash = req.body.versionHash;

  if (!name || !password) {
    res.send({ status: "unSuccessful" });
    return;
  }
  if (versionHash != currentVersionHash) {
    res.send({ status: "outdatedClient" });
    return;
  }

  let loginData = await mongoDB.Login(name, password);
  if (loginData == null) {
    res.send({ status: "unSuccessful" });
    return;
  }
  res.send({
    status: "Successful",
    playerId: loginData.playerId,
    loginSessionId: loginData.loginSessionId,
  });
});
app.post("/api/logout", async (req, res) => {
  let id = req.body.id;
  let loginSessionId = req.body.loginSessionId;

  if (!id || !loginSessionId) {
    res.send({ status: "unSuccessful" });
    return;
  }

  let logOutSuccessful = await mongoDB.LogOut(id, loginSessionId);
  if (logOutSuccessful == false) {
    res.send({ status: "unSuccessful" });
    return;
  }
  res.send({ status: "Successful" });
});
app.post("/api/sessionLogin", async (req, res) => {
  let id = req.body.id;
  let loginSessionId = req.body.loginSessionId;
  let versionHash = req.body.versionHash;

  if (!id || !loginSessionId) {
    res.send({ status: "unSuccessful" });
    return;
  }
  if (versionHash != currentVersionHash) {
    res.send({ status: "outdatedClient" });
    return;
  }

  let correct = await mongoDB.CheckSessionId(id, loginSessionId);
  if (correct == false) {
    res.send({ status: "unSuccessful" });
    return;
  }
  res.send({ status: "Successful", playerName: correct });
});
app.get(
  "/moderation/lobbyName/:playerId/:loginSessionId/:lobby",
  async (req, res) => {
    let lobby = req.params.lobby;
    let playerId = req.params.playerId;
    let loginSessionId = req.params.loginSessionId;

    if (!lobby || lobby.length > 20 || !loginSessionId || !playerId) {
      res.send({ status: "unSuccessful" });
      return;
    }
    let mongoDbCheck = mongoDB.CheckSessionId(playerId, loginSessionId);
    if (mongoDbCheck == false) {
      res.send({ status: "unSuccessful" });
      return;
    }
    let result = moderate.CensorBadWords(lobby) != lobby;
    if (result == true) {
      res.send({ status: "unSuccessful" });
      return;
    } else {
      res.send({ status: "Successful" });
      return;
    }
  }
);
app.get("/user/:id", async (req, res) => {
  let id = req.params.id;
  try {
    id = Number(id);
  } catch (e) {
    res.send({ status: "Invalid id!" });
    return;
  }
  if (id == null || id == undefined) {
    res.send({ status: "Invalid id!" });
    return;
  }
  let data = await mongoDB.GetAccountData(id);
  if (data == null) {
    res.send({ status: "User not found!" });
    return;
  }
  let profilePictureUrl =
    req.protocol + "://" + req.headers.host + "/images/users/" + id;

  let json = { name: data.name, profilePicture: profilePictureUrl };

  res.send(json);
});
app.get("/images/users/:id", async (req, res) => {
  let id = req.params.id;
  try {
    id = Number(id);
  } catch (e) {
    res.send({ status: "Invalid id!" });
    return;
  }
  if (id == null || id == undefined) {
    res.send({ status: "Invalid id!" });
    return;
  }
  let data = await mongoDB.GetAccountData(id);
  if (data == null) {
    res.send({ status: "User not found!" });
    return;
  }
  var img = Buffer.from(data.profilePicture.toString("base64"), "base64");

  res.contentType("image/png");
  res.send(img);
});

// Website
app.get("/", function (req, res) {
  res.render("pages/index", { data: JSON.stringify(req.cookies) });
});
app.get("/download/launcher", function (req, res) {
  res.download("./test.mp4");
});

app.get("/download/game", function (req, res) {
  res.download("./test.zip");
});
app.get("/versionHash", function (req, res) {
  res.send(currentVersionHash);
});
app.listen(port, () => {
  console.log(`HTTP server is listening on port `, port);
});
