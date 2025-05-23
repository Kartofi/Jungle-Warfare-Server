const Vectors = require("../General/Vectors");
const Basic = require("../General/Basic");
const tcp = require("../../tcp");
const crypto = require("crypto");
function randomLobby() {
  let keys = Object.keys(lobbies);
  let notFullLobbies = [];
  keys = keys.filter(
    (lobby) => lobbies[lobby].players.length < lobbies[lobby].rules.lobbySize
  );
  notFullLobbies.push(...keys);
  if (notFullLobbies.length > 0) {
    if (notFullLobbies.length == 1) {
      return notFullLobbies[0];
    } else {
      return notFullLobbies[crypto.randomInt(0, notFullLobbies.length - 1)];
    }
  } else {
    return null;
  }
}
function randomWeapon(lobby, WeaponName = null) {
  if (lobbies[lobby] == null) {
    return;
  }
  if (WeaponName == null) {
    let result = crypto.randomInt(0, 100);
    let chunkSIze = 100 / lobbies[lobby].rules.weaponsRules.length;

    if (result <= chunkSIze) {
      return lobbies[lobby].rules.weaponsRules[0];
    } else {
      return lobbies[lobby].rules.weaponsRules[1];
    }
  } else {
    if (WeaponName == "Rifle") {
      return lobbies[lobby].rules.weaponsRules[1];
    } else {
      return lobbies[lobby].rules.weaponsRules[0];
    }
  }
}
function getWeaponData(name, lobby) {
  if (lobbies[lobby] == null) {
    return;
  }

  let found = null;

  lobbies[lobby].rules.weaponsRules.forEach((item) => {
    if (item.WeaponName == name) {
      found = item;
      return;
    }
  });

  return found;
}
function getPlayerUsingName(name) {
  var keys = Object.keys(lobbies);
  let found = null;
  keys.forEach((key) => {
    let checkIfSessionIsIn = lobbies[key].players.find(
      (element) => element.name == name
    );
    if (checkIfSessionIsIn != null) {
      found = checkIfSessionIsIn;
    }
  });
  return found;
}
function getPlayerUsingId(id) {
  var keys = Object.keys(lobbies);
  let found = null;
  keys.forEach((key) => {
    let checkIfSessionIsIn = lobbies[key].players.find(
      (element) => element.id == id
    );
    if (checkIfSessionIsIn != null) {
      found = checkIfSessionIsIn;
    }
  });
  return found;
}
function checkIfSessionIsIn(sessionId) {
  var keys = Object.keys(lobbies);
  let found = null;
  keys.forEach((key) => {
    let checkIfSessionIsIn = lobbies[key].players.find(
      (element) => element.sessionId == sessionId
    );
    if (checkIfSessionIsIn != null) {
      found = key;
      return;
    }
  });
  return found;
}
function checkIfDeviceIdIsIn(deviceId) {
  var keys = Object.keys(lobbies);
  let found = null;
  keys.forEach((key) => {
    let checkIfDeviceIdIsIn = lobbies[key].players.find(
      (element) => element.deviceId == deviceId
    );
    if (checkIfDeviceIdIsIn != null) {
      found = key;
      return;
    }
  });
  return found;
}
function checkIfNameIsIn(name) {
  var keys = Object.keys(lobbies);
  let found = null;
  keys.forEach((key) => {
    let checkIfSessionIsIn = lobbies[key].players.find(
      (element) => element.name == name
    );
    if (checkIfSessionIsIn != null) {
      found = key;
      return;
    }
  });
  return found;
}
function RemovePlayerUsingId(id) {
  var keys = Object.keys(lobbies);

  keys.forEach((match) => {
    lobbies[match].players.forEach((element) => {
      if (element && element.id == id) {
        var index = lobbies[match].players.indexOf(element);
        if (index > -1) {
          lobbies[match].players.splice(index, 1);
          if (lobbies[match].players.length <= 0) {
            delete lobbies[match];
            console.log("Removed match :" + match);
          }
        }
      }
    });
  });
}
function RemovePlayerUsingName(name) {
  var keys = Object.keys(lobbies);

  keys.forEach((match) => {
    lobbies[match].players.forEach((element) => {
      if (element && element.name == name) {
        var index = lobbies[match].players.indexOf(element);
        if (index > -1) {
          lobbies[match].players.splice(index, 1);
          if (lobbies[match].players.length <= 0) {
            delete lobbies[match];
            console.log("Removed match :" + match);
          }
        }
      }
    });
  });
}

function RemoveNotUpdated(broadcastFunction) {
  let time = new Date().getTime();
  var keys = Object.keys(lobbies);

  keys.forEach((lobby) => {
    lobbies[lobby].players.forEach((element) => {
      if (element.lastUpdate && time - element.lastUpdate >= 10000) {
        var index = lobbies[lobby].players.indexOf(element);
        if (index > -1) {
          lobbies[lobby].players.splice(index, 1);
          console.log("Player: " + element.name + " lost connection!");
          broadcastFunction(
            JSON.stringify({
              type: "sendMessage",
              from: "Server",
              request: element.name + " lost connection.",
            }),
            lobby,
            null
          );
          if (lobbies[lobby].players.length <= 0) {
            delete lobbies[lobby];
            console.log("Removed lobby: " + lobby);
          }
        }
      }
    });
  });
}

module.exports = {
  randomLobby,
  randomWeapon,
  getWeaponData,
  getPlayerUsingId,
  getPlayerUsingName,
  checkIfSessionIsIn,
  checkIfDeviceIdIsIn,
  checkIfNameIsIn,
  RemovePlayerUsingName,
  RemovePlayerUsingId,
  RemoveNotUpdated,
};
