const webUtils = require("../../../Utils/NetworkManager/webUtils");
var sharp = require("sharp");

module.exports = function (app, mongoDB) {
  app.post("/dashboard/changePFP", async function (req, res) {
    let cookies = webUtils.getCookies(req);
    if (cookies == null) {
      res.redirect("/login");
    } else {
      if (req.files == null || req.files.image == undefined) {
        webUtils.renderChangedInfo(
          res,
          "PFP",
          "There was a problem! Please try again later.",
          "/dashboard",
          "Go Back"
        );
      } else {
        let valid = false;
        let name = req.files.image.name.toLowerCase();
        imageTypes.forEach((ext) => {
          if (name.endsWith(ext)) {
            valid = true;
          }
        });
        if (valid == false) {
          webUtils.renderChangedInfo(
            res,
            "PFP",
            "File was not in the allowed formats : " + imageTypes.join(" , "),
            "/dashboard",
            "Go Back"
          );
          return;
        }
        try {
          let buffer = await sharp(req.files.image.data)
            .resize({ width: 128, height: 128 })
            .png()
            .toBuffer();

          let validChange = await mongoDB.ChangePFP(
            cookies.playerId,
            cookies.loginSessionId,
            buffer
          );
          if (validChange == true) {
            webUtils.renderChangedInfo(
              res,
              "PFP",
              "Successfully changed the profile picture of your account.",
              "/dashboard",
              "Go Back"
            );
          } else {
            webUtils.renderChangedInfo(
              res,
              "PFP",
              validChange.error,
              "/dashboard",
              "Go Back"
            );
          }
        } catch (e) {
          webUtils.renderChangedInfo(
            res,
            "PFP",
            "There was a problem! Please try again later.",
            "/dashboard",
            "Go Back"
          );
        }
      }
    }
  });
};
