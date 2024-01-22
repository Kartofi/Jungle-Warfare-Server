const webUtils = require("../../../Utils/NetworkManager/webUtils");
var sharp = require("sharp");

module.exports = function (app, mongoDB) {
  app.post("/signup", async function (req, res) {
    if (
      req.body.name == undefined ||
      req.body.password == undefined ||
      req.body.email == undefined
    ) {
      webUtils.renderLogin(res, {
        error: "Please type your name,password and email.",
      });
      return;
    }

    if (!webUtils.isEmailValid(req.body.email)) {
      webUtils.renderSignup(res, { error: "Please type valid email address." });
      return;
    }
    let image = null;
    if (req.files != null && req.files.image != undefined) {
      let name = req.files.image.name.toLowerCase();
      let valid = false;
      imageTypes.forEach((ext) => {
        if (name.endsWith(ext)) {
          valid = true;
        }
      });
      if (valid == false) {
        image = null;
      } else {
        try {
          let buffer = await sharp(req.files.image.data)
            .resize({ width: 128, height: 128 })
            .png()
            .toBuffer();
          image = buffer;
        } catch (e) {
          image = null;
        }
      }
    }

    let loginData = await mongoDB.CreateAccount(
      req.body.name,
      req.body.email,
      req.body.password,
      image
    );
    if (loginData == null || loginData.error != undefined) {
      webUtils.renderSignup(res, loginData);
      return;
    } else {
      webUtils.setCookies(res, loginData.loginSessionId, loginData.playerId);
      res.redirect("/dashboard");
      return;
    }
  });
};
