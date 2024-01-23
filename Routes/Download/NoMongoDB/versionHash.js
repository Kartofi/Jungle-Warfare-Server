const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/versionHash", function (req, res) {
    res.send(currentVersionHash);
  });
};
