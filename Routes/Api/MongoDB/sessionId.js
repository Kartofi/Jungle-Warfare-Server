const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.post("/api/sessionLogin", async (req, res) => {
    let id = req.body.id;
    let loginSessionId = req.body.loginSessionId;
    let versionHash = req.body.versionHash;

    if (!id || !loginSessionId) {
      res.send({
        status: "unSuccessful",
        error: "No id or login session provided.",
      });
      return;
    }
    if (versionHash != currentVersionHash) {
      res.send({
        status: "outdatedClient",
        error: "Your game is outdated please update using the launcher.",
      });
      return;
    }

    let correct = await mongoDB.CheckSessionId(id, loginSessionId);
    if (correct == false) {
      res.send({
        status: "unSuccessful",
        error: "Invalid login session please login again!",
      });

      return;
    }
    res.send({ status: "Successful", playerName: correct });
  });
};
