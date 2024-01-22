const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.post("/dashboard/changeEmail", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      res.redirect("/login");
      return;
    } else {
      let newEmail = req.body.newEmail;

      if (newEmail == undefined || webUtils.isEmailValid(newEmail) == false) {
        res.redirect("/dashboard");
        return;
      }
      let changeEmailReq = await mongoDB.ChangeEmailIdGenerate(
        cookies.playerId,
        cookies.loginSessionId,
        newEmail
      );
      if (changeEmailReq.error != undefined) {
        webUtils.renderChangedInfo(
          res,
          "Email",
          changeEmailReq.error,
          "/dashboard",
          "Go back"
        );
      } else {
        webUtils.renderChangedInfo(
          res,
          "Email",
          "Successfully sent email verification to the old email. Please check your email and click on the url in order to change your email adress to " +
            newEmail,
          "/login",
          "Go Back"
        );
      }
    }
  });
};
