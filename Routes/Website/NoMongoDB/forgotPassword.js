const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/forgotPassword", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      webUtils.renderForgotInfo(res, {
        info: "Password",
        error: undefined,
      });
    } else {
      res.redirect("/dashboard");
    }
  });
};
