const express = require("express");
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
app.listen(port, () => {
  console.log(`HTTP server is listening on port `,port);
});
