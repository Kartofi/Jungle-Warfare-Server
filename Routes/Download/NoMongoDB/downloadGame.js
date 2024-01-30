module.exports = function (app, mongoDB) {
  app.get("/download/game/64x", function (req, res) {
    res.redirect(process.env.gameDownload64Bit);
  });
  app.get("/download/game/32x", function (req, res) {
    res.redirect(process.env.gameDownload32Bit);
  });
};
