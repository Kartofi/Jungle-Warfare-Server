const fs = require("fs");

const express = require("express");
const rateLimit = require("express-rate-limit");
var fileUpload = require("express-fileupload");

const app = express();
var bodyParser = require("body-parser");
var compression = require("compression");
const cookieParser = require("cookie-parser");

const port = process.env.httpPort | 2223;

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

const mongoDB = require("./Utils/NetworkManager/MongoDBManager");

const limiter = rateLimit({
  max: 240,
  windowMs: 60000,
  message: { status: "unSuccessful", errpr: "Rate limited!" },
});

app.set("view engine", "ejs");
app.use(limiter);
app.use(cookieParser());
app.set("trust proxy", 1);
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

require("./Routes/requireAll")(app, mongoDB);
//Wrong Url
app.get("/*", function (req, res) {
  res.send("<center>404 URL NOT FOUND</center>");
});
app.listen(port, () => {
  console.log(`HTTP server is listening on port `, port);
});
