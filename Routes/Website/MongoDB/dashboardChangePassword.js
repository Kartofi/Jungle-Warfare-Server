const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.post("/dashboard/changePassword", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      res.redirect("/login");
      return;
    } else {
      let newPassword = req.body.newPassword;
      let oldPassword = req.body.oldPassword;
      if (newPassword == undefined || oldPassword == undefined) {
        res.redirect("/dashboard");
        return;
      }
      let changePassReq = await mongoDB.ChangePassword(
        cookies.playerId,
        cookies.loginSessionId,
        oldPassword,
        newPassword
      );
      if (changePassReq != true) {
        webUtils.renderChangedInfo(
          res,
          "Password",
          changePassReq.error,
          "/dashboard",
          "Go back"
        );
      } else {
        webUtils.renderChangedInfo(
          res,
          "Password",
          "Successfully changed password! Now please login again.",
          "/login",
          "To login click on this text."
        );
      }
    }
  });
};
