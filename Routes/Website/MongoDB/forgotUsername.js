const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/forgotUsername", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      webUtils.renderForgotInfo(res, {
        info: "Username",
        error: undefined,
      });
    } else {
      res.redirect("/dashboard");
    }
  });
};
