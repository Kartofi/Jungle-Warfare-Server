module.exports = function (app, mongoDB) {
  app.get("/user/:id", async (req, res) => {
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
    let profilePictureUrl =
      req.protocol + "://" + req.headers.host + "/images/users/" + id;

    let json = { name: data.name, profilePicture: profilePictureUrl };

    res.send(json);
  });
};
