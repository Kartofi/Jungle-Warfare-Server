const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/download/game", function (req, res) {
    res.download("./test.zip");
  });
};
