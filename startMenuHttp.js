const express = require("express");
const fs = require("fs")

const app = express();
const port = 2223;

const mongoDB = require("./Utils/MongoDBManager");

app.get("/lobbies", (req, res) => {
  let dataPlayers = [];
  let keys = Object.keys(lobbies);
  keys.forEach((key) => {
    dataPlayers.push({ name: key,creator:lobbies[key].creator, players: lobbies[key].players.length, lobbySize: lobbies[key].rules.lobbySize });
  });
  res.send({ lobbies: dataPlayers });
});
app.get("/login", async (req, res) => {
  let name = req.query.name;
  let password = req.query.password;
  let versionHash = req.query.versionHash;

  if (!name || !password) {
    res.send({ status: "unSuccessful" });
    return;
  }
  if (versionHash != currentVersionHash){
    res.send({ status: "outdatedClient" });
    return;
  }

  let playerCorrect = await mongoDB.CheckCredentials(name, password);
  if (playerCorrect == false) {
    res.send({ status: "unSuccessful" });
    return;
  }
  res.send({ status: "Successful" });
});
app.get("/user/:name", async (req,res) => {
  let name = req.params.name;
  if (name == null || name == undefined){
    res.send({ status: "Invalid name!" });
    return;
  }
  let data = await mongoDB.GetAccountData(name);
  if (data == null){
    res.send({ status: "User not found!" });
    return;
  }
  let json = {name: data.name, avatar: req.protocol + "://" + req.headers.host + "/images/users/" + name}

  res.send(json);
})
app.get("/images/users/:name",async (req,res) =>{
  let name = req.params.name;
  if (name == null || name == undefined){
    res.send({ status: "Invalid name!" });
    return;
  }
  let data = await mongoDB.GetAccountData(name);
  if (data == null){
    res.send({ status: "User not found!" });
    return;
  }
  var img = Buffer.from(data.avatar.toString("base64"), 'base64');

  res.contentType('image/png');
  res.send(img);
})
app.listen(port, () => {
  console.log(`HTTP server is listening on port `,port);
});
