var fs = require("fs");

global.sessionTimeOut = 604800000;
global.imageTypes = ".jpg,.jpeg,png".split(",");

module.exports = function (app, mongoDB) {
  fs.readdirSync("./Routes/").forEach(function (folder) {
    if (folder == "requireAll.js") return;
    fs.readdirSync("./Routes/" + folder).forEach(function (subFolder) {
      fs.readdirSync("./Routes/" + folder + "/" + subFolder).forEach(function (
        file
      ) {
        var name = file.substr(0, file.indexOf("."));
        if (subFolder == "MongoDB") {
          require("./" + folder + "/" + subFolder + "/" + name)(app, mongoDB);
        } else {
          require("./" + folder + "/" + subFolder + "/" + name)(app);
        }
      });
    });
  });
};
