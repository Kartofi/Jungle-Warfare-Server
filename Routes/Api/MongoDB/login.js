const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.post("/api/login", async (req, res) => {
    let name = req.body.name;
    let password = req.body.password;
    let versionHash = req.body.versionHash;
    if (!name || !password) {
      res.send({
        status: "unSuccessful",
        error: "Username or password missing!",
      });
      return;
    }
    if (versionHash != currentVersionHash) {
      res.send({
        status: "outdatedClient",
        error: "Your game is outdated please  update using the launcher.",
      });
      return;
    }

    let loginData = await mongoDB.Login(name, password);
    if (loginData == null || loginData.error != undefined) {
      res.send({ status: "unSuccessful", error: loginData.error });
      return;
    }
    res.send({
      status: "Successful",
      playerId: loginData.playerId,
      loginSessionId: loginData.loginSessionId,
    });
  });
};
