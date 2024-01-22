const webUtils = require("../../../Utils/NetworkManager/webUtils");

module.exports = function (app, mongoDB) {
  app.post("/api/logout", async (req, res) => {
    let id = req.body.id;
    let loginSessionId = req.body.loginSessionId;

    if (!id || !loginSessionId) {
      res.send({ status: "unSuccessful" });
      return;
    }

    let logOutSuccessful = await mongoDB.LogOut(id, loginSessionId);
    if (logOutSuccessful == false) {
      res.send({ status: "unSuccessful" });
      return;
    }
    res.send({ status: "Successful" });
  });
};
