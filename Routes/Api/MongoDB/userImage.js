const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.get("/images/users/:id", async (req, res) => {
    let id = req.params.id;
    try {
      id = Number(id);
    } catch (e) {
      res.send({ status: "Invalid id!" });
      return;
    }
    if (id == null || id == undefined) {
      res.send({ status: "Invalid id!" });
      return;
    }
    let data = await mongoDB.GetAccountData(id);
    if (data == null) {
      res.send({ status: "User not found!" });
      return;
    }
    var img = Buffer.from(data.profilePicture.toString("base64"), "base64");

    res.contentType("image/png");
    res.send(img);
  });
};
