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
//User info
function getUserData(req) {
  return {
    ip: req.ip.replace("::ffff:", ""),
    browser: req.headers["user-agent"],
  };
}
//Utils
function renderHome(res, data) {
  res.render("pages/homepage", data);
}
function renderLogin(res, data) {
  res.render("pages/login", data);
}

function renderSignup(res, data) {
  res.render("pages/signup", data);
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
function renderForgotInfo(res, data) {
  res.render("pages/forgotInfo", data);
}
var validator = require("validator");

async function isEmailValid(email) {
  return validator.isEmail(email);
}
module.exports = {
  deleteCookies,
  setCookies,
  getCookies,
  getUserData,
  renderHome,
  renderLogin,
  renderSignup,
  renderDashboard,
  renderChangedInfo,
  renderForgotInfo,
  isEmailValid,
};
