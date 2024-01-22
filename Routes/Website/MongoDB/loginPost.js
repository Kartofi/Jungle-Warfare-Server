const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.post("/login", async function (req, res) {
    if (req.body.name == undefined || req.body.password == undefined) {
      webUtils.renderLogin(res, {
        error: "Please type your name and password.",
      });
      return;
    }
    let loginData = await mongoDB.Login(
      req.body.name,
      req.body.password,
      webUtils.getUserData(req)
    );
    if (loginData == null || loginData.error != undefined) {
      webUtils.renderLogin(res, loginData);
      return;
    } else {
      webUtils.setCookies(res, loginData.loginSessionId, loginData.playerId);
      res.redirect("/dashboard");
      return;
    }
  });
};
