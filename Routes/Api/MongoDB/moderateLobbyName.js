const moderate = require("../../../Utils/General/moderation");

module.exports = function (app, mongoDB) {
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
};
