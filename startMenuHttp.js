const express = require("express");
const app = express();
const port = 2223;

const mongoDB = require("./Utils/MongoDBManager");

app.get("/lobbies", (req, res) => {
  let dataPlayers = [];
  let keys = Object.keys(data);
  keys.forEach((key) => {
    dataPlayers.push({ name: key,creator:data[key].creator, players: data[key].players.length, lobbySize: data[key].rules.lobbySize });
  });
  res.send({ lobbies: dataPlayers });
});
app.get("/login", async (req, res) => {
  let name = req.query.name;
  let password = req.query.password;

  if (!name || !password) {
    res.send({ status: "unSuccessful" });
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
