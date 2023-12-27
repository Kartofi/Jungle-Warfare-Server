const Basic = require("../Basic");
const lobbyManager = require("../lobbyManager");
const AntiCheat = require("../AntiCheat");
const Vectors = require("../Vectors");
const mongoDB = require("../MongoDBManager");
const udpErrors = require("../udpErrors");

const { v1: uuidv1, v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
function nameValidation(name, server) {
  if (name.length <= 0) {
    server.send(udpErrors.nameTooShort, info.port, info.address);
    return false;
  } else if (name.length > 20) {
    server.send(udpErrors.nameTooLong, info.port, info.address);
    return false;
  }
  return true;
}

async function Update(json, server, info, broadcastFunction) {
  let playerInstance = lobbyManager.getPlayerUsingName(json.name);

  if (
    playerInstance &&
    (playerInstance.sessionId != json.sessionId ||
      playerInstance.deviceId != json.deviceId)
  ) {
    server.send(
      udpErrors.accountLoggedFromAnotherLocation,
      info.port,
      info.address
    );
    return;
  }
  if (nameValidation(json.name, server) == false) {
    return;
  }

  if (json.loginSessionId.length <= 0) {
    server.send(udpErrors.loginSessionIdTooShort, info.port, info.address);
    return;
  }

  let playerId = 0;

  if (playerInstance == null) {
    if (mongoDB.isConnected() == false) {
      server.send(udpErrors.problemTryAgain, info.port, info.address);
      return;
    }
    let accountSessionCheck = await mongoDB.CheckSessionId(
      json.name,
      json.loginSessionId
    );
    if (accountSessionCheck == false) {
      server.send(udpErrors.wrongLoginSession, info.port, info.address);
      return;
    } else {
      playerId = accountSessionCheck;
    }
  }
  if (json.versionHash != currentVersionHash) {
    server.send(udpErrors.outDatedClient, info.port, info.address);
    return;
  }

  let time = new Date().getTime();
  if (playerInstance == null) {
    if (
      lobbyManager.checkIfSessionIsIn(json.sessionId) != null || //|| //testing
      //lobbyManager.checkIfDeviceIdIsIn(json.deviceId) != null
      json.sessionId
    ) {
      server.send(udpErrors.problemRejoin, info.port, info.address);
      return;
    }

    let sessionId = uuidv4();
    let lobby;
    if (json.lobbyId != "" && json.lobbyId != null) {
      if (json.lobbyId.length > 20) {
        lobby = json.lobbyId.slice(0, 20);
      } else {
        lobby = json.lobbyId;
      }
      let lobbiesKeys = Object.keys(lobbies);
      if (!lobbiesKeys.includes(lobby)) {
        lobbies[lobby] = {
          players: [],
          creator: json.name,
          rules:
            !json.rules ||
            json.rules.weaponsRules.length < defaultWeaponsRules.length ||
            json.rules.lobbySize <= 0 ||
            json.rules.lobbySize > rules.maxLobbyPlayers
              ? defaultRulesForPlayer
              : json.rules,
        };
        console.log("Created lobby :" + lobby);
      }
    } else {
      lobby = lobbyManager.randomLobby();
      if (lobby == null) {
        server.send(udpErrors.joinableLobbies, info.port, info.address);
        return;
      }
    }
    if (lobbies[lobby].rules.lobbySize == lobbies[lobby].players.length) {
      // check if lobby is full
      server.send(udpErrors.lobbyIsFull, info.port, info.address);
      return;
    }
    console.log("Player: " + json.name + " joined lobby:" + lobby + "!");
    let weapon = lobbyManager.randomWeapon(lobby);
    lobbies[lobby].players.push({
      name: json.name,
      id: playerId,
      deviceId: json.deviceId,
      sessionId: sessionId,
      lobbyId: lobby,
      ping: json.ping,
      ip: info.address,
      weapon: weapon == null ? "" : weapon.WeaponName,
      health: lobbies[lobby].rules.maxHealth,
      bullets: weapon == null ? 0 : weapon.bulletsMax,
      isDead: false,
      state: "idle",
      kills: 0,
      CameraData: json.CameraData
        ? json.CameraData
        : {
            position: new Vectors.Vector3(0, 0, 0).JsonObj,
            rotation: new Vectors.Vector3(0, 0, 0).JsonObj,
          },
      position: rules.spawnPos.JsonObj,
      rotation: json.rotation,
      lastUpdate: time,
      lastShoot: 0,
      lastReload: 0,
      reloading: false,
    });

    const players = lobbies[lobby].players.map(
      ({ ip, deviceId, sessionId, lastUpdate, lastShoot, lobbyId, ...rest }) =>
        rest
    );

    server.send(
      JSON.stringify({
        type: "position",
        reason: "startPos",
        correctPosition: rules.spawnPos.JsonObj,
        sessionId: sessionId,
        lobbyId: lobby,
        rules: Object.assign({}, lobbies[lobby].rules, {
          maxMoveDistance: rules.maxMoveDistance,
        }),
        players: players,
      }),
      info.port,
      info.address
    );
    broadcastFunction(
      JSON.stringify({
        type: "sendMessage",
        from: "Server",
        request: json.name + " joined the lobby.",
      }),
      lobby,
      null
    );
    return;
  } else {
    if (AntiCheat.PositionChange(server, playerInstance, json, time, info)) {
      playerInstance.position = json.position;
      playerInstance.rotation = json.rotation;
      playerInstance.lastUpdate = time;
      playerInstance.CameraData = json.CameraData;
      playerInstance.ping = Basic.Clamp(json.ping, 0, 999);
      playerInstance.state = json.state;
    } else {
      if (lobbyManager.checkIfSessionIsIn(json.sessionId) == null) {
        return;
      }
      const players = lobbies[playerInstance.lobbyId].players.map(
        ({
          ip,
          deviceId,
          sessionId,
          lastUpdate,
          lastShoot,
          lobbyId,
          ...rest
        }) => rest
      );
      server.send(
        JSON.stringify({
          type: "position",
          reason: "hacker",
          correctPosition: playerInstance.position,
          players: players,
        }),
        info.port,
        info.address
      );
      return;
    }
  }
  if (lobbyManager.checkIfSessionIsIn(json.sessionId) == null) {
    return;
  }
  const players = lobbies[playerInstance.lobbyId].players.map(
    ({ ip, deviceId, sessionId, lastUpdate, lastShoot, lobbyId, ...rest }) =>
      rest
  );
  server.send(
    JSON.stringify({
      players: players,
      rules: lobbies[playerInstance.lobbyId].rules,
    }),
    info.port,
    info.address
  );
}
module.exports = { Update };
