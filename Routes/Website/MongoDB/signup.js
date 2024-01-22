const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/signup", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      webUtils.renderSignup(res, { error: "" });
    } else {
      let sessionValid = await mongoDB.CheckSessionId(
        cookies.playerId,
        cookies.loginSessionId
      );
      if (sessionValid == false) {
        webUtils.deleteCookies(res);
        webUtils.renderSignup(res, { error: "" });
      } else {
        res.redirect("/dashboard");
      }
    }
  });
};
