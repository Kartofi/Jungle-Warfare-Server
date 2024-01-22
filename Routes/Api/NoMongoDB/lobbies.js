module.exports = function (app) {
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
};
