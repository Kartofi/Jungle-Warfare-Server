const fs = require("fs");

const express = require("express");
const rateLimit = require("express-rate-limit");
var fileUpload = require("express-fileupload");
var sharp = require("sharp");

var validator = require("email-validator");

const app = express();
var bodyParser = require("body-parser");
var compression = require("compression");
const cookieParser = require("cookie-parser");

const port = process.env.httpPort | 2223;

let sessionTimeOut = 604800000;

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

const mongoDB = require("./Utils/MongoDBManager");
const moderate = require("./Utils/moderation");

const limiter = rateLimit({
  max: 120,
  windowMs: 60000,
  message: { status: "unSuccessful" },
});

app.set("view engine", "ejs");
app.use(limiter);
app.use(cookieParser());
app.use(compression());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use("/static", express.static("./views/src"));

app.use((err, req, res, next) => {
  if (err) {
    if (err.type == "entity.too.large") {
      res
        .status(413)
        .send({ status: "unSuccessful", error: "Payload too large!" });
    } else if (err.type == "entity.parse.failed") {
      res.status(400).send({ status: "unSuccessful", error: "Parse failed!" });
    } else {
      res.status(400).send({ status: "unSuccessful", error: err.type });
    }
  } else {
    next();
  }
});
async function isEmailValid(email) {
  return validator.validate(email);
}

// Api
app.get("/api/lobbies", (req, res) => {
  let dataPlayers = [];
  let keys = Object.keys(lobbies);
  keys.forEach((key) => {
    dataPlayers.push({
      name: key,
      creator: lobbies[key].creator,
      creatorId: lobbies[key].creatorId,
      players: lobbies[key].players.length,
      lobbySize: lobbies[key].rules.lobbySize,
    });
  });
  res.send({ lobbies: dataPlayers });
});
app.post("/api/login", async (req, res) => {
  let name = req.body.name;
  let password = req.body.password;
  let versionHash = req.body.versionHash;
  if (!name || !password) {
    res.send({ status: "unSuccessful" });
    return;
  }
  if (versionHash != currentVersionHash) {
    res.send({ status: "outdatedClient" });
    return;
  }

  let loginData = await mongoDB.Login(name, password);
  if (loginData == null || loginData.error != undefined) {
    res.send({ status: "unSuccessful" });
    return;
  }
  res.send({
    status: "Successful",
    playerId: loginData.playerId,
    loginSessionId: loginData.loginSessionId,
  });
});
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
app.post("/api/sessionLogin", async (req, res) => {
  let id = req.body.id;
  let loginSessionId = req.body.loginSessionId;
  let versionHash = req.body.versionHash;

  if (!id || !loginSessionId) {
    res.send({ status: "unSuccessful" });
    return;
  }
  if (versionHash != currentVersionHash) {
    res.send({ status: "outdatedClient" });
    return;
  }

  let correct = await mongoDB.CheckSessionId(id, loginSessionId);
  if (correct == false) {
    res.send({ status: "unSuccessful" });

    return;
  }
  res.send({ status: "Successful", playerName: correct });
});
app.get(
  "/moderation/lobbyName/:playerId/:loginSessionId/:lobby",
  async (req, res) => {
    let lobby = req.params.lobby;
    let playerId = req.params.playerId;
    let loginSessionId = req.params.loginSessionId;

    if (!lobby || lobby.length > 20 || !loginSessionId || !playerId) {
      res.send({ status: "unSuccessful" });
      return;
    }
    let mongoDbCheck = mongoDB.CheckSessionId(playerId, loginSessionId);
    if (mongoDbCheck == false) {
      res.send({ status: "unSuccessful" });
      return;
    }
    let result = moderate.CensorBadWords(lobby) != lobby;
    if (result == true) {
      res.send({ status: "unSuccessful" });
      return;
    } else {
      res.send({ status: "Successful" });
      return;
    }
  }
);
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

// Launcher
app.get("/download/launcher", function (req, res) {
  res.download("./test.mp4");
});

app.get("/download/game", function (req, res) {
  res.download("./test.zip");
});
app.get("/versionHash", function (req, res) {
  res.send(currentVersionHash);
});
//Website
//Cookies
function deleteCookies(res) {
  res.clearCookie("loginSessionId");
  res.clearCookie("playerId");
}
function setCookies(res, sessionId, playerId) {
  let expireDate = new Date(Date.now() + sessionTimeOut);
  res.cookie("loginSessionId", sessionId, {
    expires: expireDate,
  });
  res.cookie("playerId", playerId, {
    expires: expireDate,
  });
}
function getCookies(req) {
  if (
    req.cookies.loginSessionId == undefined ||
    req.cookies.playerId == undefined
  ) {
    return null;
  }
  if (
    req.cookies.loginSessionId.length <= 0 ||
    req.cookies.playerId.length <= 0
  ) {
    return null;
  }
  return req.cookies;
}
//Utils

function renderLogin(res, data) {
  res.render("pages/login", data);
}
function renderDashboard(res, data) {
  res.render("pages/dashboard", data);
}
function renderChangedInfo(res, type, result, url, urlText) {
  res.render("pages/changedInfoResult", {
    type: type,
    result: result,
    url: url,
    urlText: urlText,
  });
}
//Routes Website

app.get("/login", async function (req, res) {
  let cookies = getCookies(req);
  if (cookies == null) {
    renderLogin(res, { error: "" });
  } else {
    let sessionValid = await mongoDB.CheckSessionId(
      cookies.playerId,
      cookies.loginSessionId
    );
    if (sessionValid == false) {
      deleteCookies(res);
      renderLogin(res, { error: "" });
    } else {
      res.redirect("/dashboard");
    }
  }
});
app.post("/login", async function (req, res) {
  if (req.body.name == undefined || req.body.password == undefined) {
    renderLogin(res, { error: "Please type your name and password." });
    return;
  }
  let loginData = await mongoDB.Login(req.body.name, req.body.password);
  if (loginData == null || loginData.error != undefined) {
    renderLogin(res, loginData);
    return;
  } else {
    setCookies(res, loginData.loginSessionId, loginData.playerId);
    res.redirect("/dashboard");
    return;
  }
});

app.get("/dashboard", async function (req, res) {
  let cookies = getCookies(req);
  if (cookies == null) {
    res.redirect("/login");
  } else {
    let sessionValid = await mongoDB.CheckSessionId(
      cookies.playerId,
      cookies.loginSessionId
    );
    if (sessionValid == false) {
      deleteCookies(res);
      res.redirect("/login");
      return;
    } else {
      let playerData = await mongoDB.GetAccountData(cookies.playerId);
      if (playerData == null) {
        deleteCookies(res);
        res.redirect("/login");
        return;
      } else {
        cookies.email = playerData.email;
        cookies.playerName = sessionValid;
        renderDashboard(res, cookies);
      }
    }
  }
});
app.post("/logout", async function (req, res) {
  let cookies = getCookies(req);
  if (cookies == null) {
    res.redirect("/login");
  } else {
    deleteCookies(res);
    let result = await mongoDB.LogOut(cookies.playerId, cookies.loginSessionId);
    if (result == true) {
      renderChangedInfo(
        res,
        "Logout",
        "Successfully logged out.",
        "/",
        "Go to homepage"
      );
    } else {
      renderChangedInfo(
        res,
        "Logout",
        "There was an error! Please try again later.",
        "/",
        "Go to homepage"
      );
    }
  }
});
//Change PFP
let imageTypes = ".jpg,.jpeg,png".split(",");
app.post("/dashboard/changePFP", async function (req, res) {
  let cookies = getCookies(req);
  if (cookies == null) {
    res.redirect("/login");
  } else {
    if (req.files == null || req.files.image == undefined) {
      renderChangedInfo(
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
        renderChangedInfo(
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
          renderChangedInfo(
            res,
            "PFP",
            "Successfully changed the profile picture of your account.",
            "/dashboard",
            "Go Back"
          );
        } else {
          renderChangedInfo(
            res,
            "PFP",
            validChange.error,
            "/dashboard",
            "Go Back"
          );
        }
      } catch (e) {
        renderChangedInfo(
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

// Password Change
app.post("/dashboard/changePassword", async function (req, res) {
  let cookies = getCookies(req);
  if (cookies == null) {
    res.redirect("/login");
    return;
  } else {
    let newPassword = req.body.newPassword;
    let oldPassword = req.body.oldPassword;
    if (newPassword == undefined || oldPassword == undefined) {
      res.redirect("/dashboard");
      return;
    }
    let changePassReq = await mongoDB.ChangePassword(
      cookies.playerId,
      cookies.loginSessionId,
      oldPassword,
      newPassword
    );
    if (changePassReq != true) {
      renderChangedInfo(
        res,
        "Password",
        changePassReq.error,
        "/dashboard",
        "Go back"
      );
    } else {
      renderChangedInfo(
        res,
        "Password",
        "Successfully changed password! Now please login again.",
        "/login",
        "To login click on this text."
      );
    }
  }
});
// Email change
app.post("/dashboard/changeEmail", async function (req, res) {
  let cookies = getCookies(req);
  if (cookies == null) {
    res.redirect("/login");
    return;
  } else {
    let newEmail = req.body.newEmail;

    if (newEmail == undefined || isEmailValid(newEmail) == false) {
      res.redirect("/dashboard");
      return;
    }
    let changePassReq = await mongoDB.ChangeEmailIdGenerate(
      cookies.playerId,
      cookies.loginSessionId,
      newEmail
    );
    if (changePassReq.error != undefined) {
      renderChangedInfo(
        res,
        "Email",
        changePassReq.error,
        "/dashboard",
        "Go back"
      );
    } else {
      renderChangedInfo(
        res,
        "Email",
        "Successfully sent email verification to the old email. Please check your email and click on the url in order to change your email adress to " +
          newEmail,
        "/login",
        "To login click on this text."
      );
    }
  }
});
app.get(
  "/api/approveChangeEmail/:id/:changeEmailId",
  async function (req, res) {
    if (!req.params.id || !req.params.changeEmailId) {
      res.redirect("/login");
      return;
    }
    let playerId = -1;
    try {
      playerId = Number(req.params.id);
    } catch (e) {
      renderChangedInfo(res, { status: "Player id is invalid" });
      return;
    }
    let changeEmailResponse = await mongoDB.ChangeEmail(
      playerId,
      req.params.changeEmailId
    );
    if (changeEmailResponse == true) {
      deleteCookies(res);
      renderChangedInfo(
        res,
        "Email",
        "Successful changed email address! Now please login.",
        "/login",
        " Go to login page by clicking here."
      );
    } else {
      renderChangedInfo(
        res,
        "Email",
        changeEmailResponse.error,
        "/login",
        " Go to homepage by clicking here."
      );
    }
  }
);

//Wrong Url
app.get("/*", function (req, res) {
  res.send("Wrong URL");
});
app.listen(port, () => {
  console.log(`HTTP server is listening on port `, port);
});
