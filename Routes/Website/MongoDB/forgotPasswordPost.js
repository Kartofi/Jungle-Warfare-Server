const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.post("/forgotPassword", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      if (req.body.email == undefined) {
        webUtils.renderForgotInfo(res, {
          info: "Password",
          error: "Please type your email address.",
        });
        return;
      }
      let forgotInfo = await mongoDB.ForgotInfo(req.body.email, "Password");
      if (forgotInfo.error != undefined) {
        webUtils.renderForgotInfo(res, {
          info: "Password",
          error: forgotInfo.error,
        });
      } else {
        webUtils.deleteCookies(res);
        webUtils.renderForgotInfo(res, {
          info: "Password",
          error:
            "Email sent successfully please check your inbox. Email: " +
            req.body.email,
        });
      }
    } else {
      res.redirect("/dashboard");
    }
  });
};
