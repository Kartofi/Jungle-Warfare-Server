const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/logout", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      res.redirect("/login");
    } else {
      webUtils.deleteCookies(res);
      let result = await mongoDB.LogOut(
        cookies.playerId,
        cookies.loginSessionId
      );
      if (result == true) {
        webUtils.renderChangedInfo(
          res,
          "Logout",
          "Successfully logged out.",
          "/",
          "Go to homepage."
        );
      } else {
        webUtils.renderChangedInfo(
          res,
          "Logout",
          "There was an error! Please try again later.",
          "/login",
          "Go to login page."
        );
      }
    }
  });
};
