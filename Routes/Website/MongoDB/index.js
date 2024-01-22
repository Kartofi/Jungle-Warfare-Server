const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      webUtils.renderHome(res, { pfp: null });
    } else {
      let sessionValid = await mongoDB.CheckSessionId(
        cookies.playerId,
        cookies.loginSessionId
      );
      if (sessionValid == false) {
        webUtils.deleteCookies(res);
        webUtils.renderHome(res, { pfp: null });
      } else {
        webUtils.renderHome(res, { pfp: "/images/users/" + cookies.playerId });
      }
    }
  });
};
