const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/download", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      res.render("pages/download", { pfp: null });
    } else {
      let sessionValid = await mongoDB.CheckSessionId(
        cookies.playerId,
        cookies.loginSessionId
      );
      if (sessionValid == false) {
        webUtils.deleteCookies(res);
        res.render("pages/download", { pfp: null });
        return;
      } else {
        let playerData = await mongoDB.GetAccountData(cookies.playerId);
        if (playerData == null) {
          webUtils.deleteCookies(res);
          res.render("pages/download", { pfp: null });
          return;
        } else {
          res.render("pages/download", {
            pfp: "/images/users/" + playerData.id,
          });
        }
      }
    }
  });
};
