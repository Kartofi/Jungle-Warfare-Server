const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/download/launcher", function (req, res) {
    res.redirect(process.env.launcherDownload);
  });
};
