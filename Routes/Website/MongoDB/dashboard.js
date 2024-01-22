const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/dashboard", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      res.redirect("/login");
    } else {
      let sessionValid = await mongoDB.CheckSessionId(
        cookies.playerId,
        cookies.loginSessionId
      );
      if (sessionValid == false) {
        webUtils.deleteCookies(res);
        res.redirect("/login");
        return;
      } else {
        let playerData = await mongoDB.GetAccountData(cookies.playerId);
        if (playerData == null) {
          webUtils.deleteCookies(res);
          res.redirect("/login");
          return;
        } else {
          cookies.email = playerData.email;
          cookies.playerName = sessionValid;
          webUtils.renderDashboard(res, cookies);
        }
      }
    }
  });
};
