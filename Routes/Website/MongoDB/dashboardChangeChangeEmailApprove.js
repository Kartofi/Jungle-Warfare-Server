const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get(
    "/dashboard/changeEmail/:id/:changeEmailId",
    async function (req, res) {
      if (!req.params.id || !req.params.changeEmailId) {
        res.redirect("/login");
        return;
      }
      let playerId = -1;
      try {
        playerId = Number(req.params.id);
      } catch (e) {
        webUtils.renderChangedInfo(res, { status: "Player id is invalid" });
        return;
      }
      let changeEmailResponse = await mongoDB.ChangeEmail(
        playerId,
        req.params.changeEmailId
      );
      if (changeEmailResponse == true) {
        webUtils.deleteCookies(res);
        webUtils.renderChangedInfo(
          res,
          "Email",
          "Successful changed email address! Now please login.",
          "/login",
          " Go to login page by clicking here."
        );
      } else {
        webUtils.renderChangedInfo(
          res,
          "Email",
          changeEmailResponse.error,
          "/login",
          " Go to homepage by clicking here."
        );
      }
    }
  );
};
