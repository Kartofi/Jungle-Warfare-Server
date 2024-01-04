const Basic = require("../Basic");
const lobbyManager = require("../lobbyManager");
const AntiCheat = require("../AntiCheat");
const Vectors = require("../Vectors");
const mongoDB = require("../MongoDBManager");
const udpErrors = require("../udpErrors");
const gzipManager = require("../GZipManager");

const validateJsonInput = require("../validateJsonInput");

const { v1: uuidv1, v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
function sendData(json, server, info) {
  server.send(gzipManager.Compress(json), info.port, info.address);
}
async function Update(json, server, info, broadcastFunction) {
  let validJson = validateJsonInput.ValidateUpdate(json);
  if (validJson == false) {
    sendData(udpErrors.invalidJson, server, info);
    return;
  }

  let playerInstance = lobbyManager.getPlayerUsingId(json.id);
  if (
    playerInstance &&
    (playerInstance.sessionId != json.sessionId ||
      playerInstance.deviceId != json.deviceId)
  ) {
    sendData(udpErrors.accountLoggedFromAnotherLocation, server, info);

    return;
  }
  let playerName = "";
  if (playerInstance == null) {
    if (mongoDB.isConnected() == false) {
      sendData(udpErrors.problemTryAgain, server, info);
      return;
    }
    let accountSessionCheck = await mongoDB.CheckSessionId(
      json.id,
      json.loginSessionId
    );
    if (accountSessionCheck == false) {
      sendData(udpErrors.wrongLoginSession, server, info);
      return;
    } else {
      playerName = accountSessionCheck;
    }
  }
  if (json.versionHash != currentVersionHash) {
    sendData(udpErrors.outDatedClient, server, info);
    return;
  }

  let time = new Date().getTime();
  if (playerInstance == null) {
    if (
      lobbyManager.checkIfSessionIsIn(json.sessionId) != null || //|| //testing
      //lobbyManager.checkIfDeviceIdIsIn(json.deviceId) != null
      json.sessionId
    ) {
      sendData(udpErrors.problemRejoin, server, info);
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
          creator: playerName,
          creatorId: json.id,
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
      sendData(udpErrors.lobbyIsFull, server, info);
      return;
    }
    console.log("Player: " + playerName + " joined lobby:" + lobby + "!");
    let weapon = lobbyManager.randomWeapon(lobby);
    lobbies[lobby].players.push({
      name: playerName,
      id: json.id,
      deviceId: json.deviceId,
      sessionId: sessionId,
      lobbyId: lobby,
      ping: json.ping,
      ip: info.address,
      weapon: weapon == null ? "" : weapon.WeaponName,
      health: lobbies[lobby].rules.maxHealth,
      bullets: weapon == null ? 0 : weapon.bulletsMax,
      isDead: false,
      state: 0,
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
    let dataToSend = JSON.stringify({
      type: "position",
      reason: "startPos",
      correctPosition: rules.spawnPos.JsonObj,
      sessionId: sessionId,
      lobbyId: lobby,
      creator: lobbies[lobby].creator,
      creatorId: lobbies[lobby].creatorId,
      rules: Object.assign({}, lobbies[lobby].rules, {
        maxMoveDistance: rules.maxMoveDistance,
      }),
      players: players,
    });
    sendData(dataToSend, server, info);

    broadcastFunction(
      JSON.stringify({
        type: "sendMessage",
        from: "Server",
        request: playerName + " joined the lobby.",
      }),
      lobby,
      null
    );
    return;
  } else {
    if (playerInstance.isDead == false) {
      if (AntiCheat.PositionChange(playerInstance, json, time, info)) {
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
        let dataToSend = JSON.stringify({
          type: "position",
          reason: "hacker",
          correctPosition: playerInstance.position,
          players: players,
        });
        sendData(dataToSend, server, info);

        return;
      }
    }
  }
  if (lobbyManager.checkIfSessionIsIn(json.sessionId) == null) {
    return;
  }
  const players = lobbies[playerInstance.lobbyId].players.map(
    ({ ip, deviceId, sessionId, lastUpdate, lastShoot, lobbyId, ...rest }) =>
      rest
  );
  let dataToSend = JSON.stringify({
    players: players,
    creator: lobbies[playerInstance.lobbyId].creator,
    creatorId: lobbies[playerInstance.lobbyId].creatorId,
    rules: lobbies[playerInstance.lobbyId].rules,
  });
  sendData(dataToSend, server, info);
}
module.exports = { Update };
