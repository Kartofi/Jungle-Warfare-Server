var Validator = require("jsonschema").Validator;
const fs = require("fs");

var v = new Validator();

// Address, to be embedded on Person

let data = JSON.parse(fs.readFileSync("./Settings/jsonSchemas.json"));

function ValidateUpdate(json) {
  return v.validate(json, data.update).errors == 0;
}

function ValidateShootIndicator(json) {
  return v.validate(json, data.shootIndicator).errors == 0;
}
function ValidateDamageHit(json) {
  return v.validate(json, data.damageHit).errors == 0;
}
function ValidateReload(json) {
  return v.validate(json, data.reload).errors == 0;
}
function ValidateKeepAlive(json) {
  return v.validate(json, data.keepAlive).errors == 0;
}
function ValidateDisconnect(json) {
  return v.validate(json, data.disconnect).errors == 0;
}
function ValidateTcpJoin(json) {
  return v.validate(json, data.tcpJoin).errors == 0;
}
function ValidateTcpChatMessage(json) {
  return v.validate(json, data.tcpChatMessage).errors == 0;
}
function ValidateRules(json) {
  return v.validate(json, data.rules).errors == 0;
}
module.exports = {
  ValidateUpdate,
  ValidateShootIndicator,
  ValidateDamageHit,
  ValidateReload,
  ValidateKeepAlive,
  ValidateDisconnect,
  ValidateTcpJoin,
  ValidateTcpChatMessage,
  ValidateRules,
};
