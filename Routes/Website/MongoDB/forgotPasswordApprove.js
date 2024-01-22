const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/forgotPassword/:playerId/:passwordId", async function (req, res) {
    if (!req.params.playerId || !req.params.passwordId) {
      res.redirect("/login");
      return;
    }
    let playerId = -1;
    try {
      playerId = Number(req.params.playerId);
    } catch (e) {
      webUtils.renderChangedInfo(res, { status: "Player id is invalid" });
      return;
    }
    let resetPasswordResponse = await mongoDB.ForgotPasswordApprove(
      playerId,
      req.params.passwordId
    );
    if (resetPasswordResponse == true) {
      webUtils.deleteCookies(res);
      webUtils.renderChangedInfo(
        res,
        "Password",
        "Successful reset your password! The new automatically generated one was sent to you by email.",
        "/login",
        " Go to login page by clicking here."
      );
    } else {
      webUtils.renderChangedInfo(
        res,
        "Password",
        resetPasswordResponse.error,
        "/login",
        " Go to login page by clicking here."
      );
    }
  });
};
