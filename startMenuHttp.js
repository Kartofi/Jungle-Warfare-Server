const express = require("express");
const fs = require("fs");

const app = express();
var bodyParser = require("body-parser");
var compression = require('compression')

const port = 2223;

const mongoDB = require("./Utils/MongoDBManager");
app.use(compression())
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

app.get("/api/lobbies", (req, res) => {
  let dataPlayers = [];
  let keys = Object.keys(lobbies);
  keys.forEach((key) => {
    dataPlayers.push({
      name: key,
      creator: lobbies[key].creator,
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
  res.send({ status: "Successful", playerName:correct });
});
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
app.listen(port, () => {
  console.log(`HTTP server is listening on port `, port);
});
