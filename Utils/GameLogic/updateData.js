const Basic = require("../Basic");
const lobbyManager = require("../lobbyManager");
const AntiCheat = require("../AntiCheat");
const Vectors = require("../Vectors");
const mongoDB = require("../MongoDBManager");
const udpErrors = require("../udpErrors");
const gzipManager = require("../GZipManager");

const idManager = require("../idManager");

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

    let sessionId = idManager.generateRandomNumberId();
    let lobby;
    if (json.lobbyId != "" && json.lobbyId != null) {
      if (json.lobbyId.length > 20) {
        lobby = json.lobbyId.slice(0, 20);
      } else {
        lobby = json.lobbyId;
      }
      let lobbiesKeys = Object.keys(lobbies);
      if (!lobbiesKeys.includes(lobby)) {
        let validJsonRules = validateJsonInput.ValidateRules(json.rules);
        if (validJsonRules == true && json.rules != null) {
          let lobbyRules = JSON.parse(JSON.stringify(defaultRulesForPlayer));
          lobbyRules.lobbySize = Basic.Clamp(
            json.rules.lobbySize,
            1,
            rules.maxLobbyPlayers
          );
          lobbyRules.respawnTime = json.rules.respawnTime;
          lobbyRules.maxHealth = json.rules.maxHealth;
          lobbyRules.jumpPowerMultiplier = json.rules.jumpPowerMultiplier;
          //Rifle
          lobbyRules.weaponsRules[0].shootCooldown =
            json.rules.rifleShootCooldown;
          lobbyRules.weaponsRules[0].walkSpeed *=
            json.rules.walkspeedMultiplier;
          lobbyRules.weaponsRules[0].reloadWalkSpeed *=
            json.rules.reloadWalkspeedMultiplier;
          lobbyRules.weaponsRules[0].reloadTime =
            json.rules.rifleReloadTime * json.rules.reloadTimeMultiplier;
          lobbyRules.weaponsRules[0].bulletsMax = json.rules.rifleBulletsMax;
          lobbyRules.weaponsRules[0].headShotMultiplier =
            json.rules.rifleHeadShotMultiplier * json.rules.headShotMultiplier;
          //Revolver
          lobbyRules.weaponsRules[1].shootCooldown =
            json.rules.revolverShootCooldown;
          lobbyRules.weaponsRules[1].walkSpeed *=
            json.rules.walkspeedMultiplier;
          lobbyRules.weaponsRules[1].reloadWalkSpeed *=
            json.rules.reloadWalkspeedMultiplier;
          lobbyRules.weaponsRules[1].reloadTime =
            json.rules.revolverReloadTime * json.rules.reloadTimeMultiplier;
          lobbyRules.weaponsRules[1].bulletsMax = json.rules.revolverBulletsMax;
          lobbyRules.weaponsRules[1].headShotMultiplier =
            json.rules.revolverHeadShotMultiplier *
            json.rules.headShotMultiplier;

          lobbies[lobby] = {
            players: [],
            creator: playerName,
            creatorId: json.id,
            rules: lobbyRules,
          };
        } else {
          lobbies[lobby] = {
            players: [],
            creator: playerName,
            creatorId: json.id,
            rules: defaultRulesForPlayer,
          };
        }

        console.log("Created lobby :" + lobby);
      }
    } else {
      lobby = lobbyManager.randomLobby();
      if (lobby == null) {
        sendData(udpErrors.joinableLobbies, server, info);
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
    let spawnPos =
      rules.spawnPos[crypto.randomInt(0, 100) < 50 ? 0 : 1].JsonObj;

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
      position: spawnPos,
      rotation: json.rotation,
      lastUpdate: time,
      lastShoot: 0,
      lastReload: 0,
      reloading: false,
      spawnDelay: true,
    });

    const players = lobbies[lobby].players.map(
      ({ ip, deviceId, sessionId, lastUpdate, lastShoot, lobbyId, ...rest }) =>
        rest
    );
    let dataToSend = JSON.stringify({
      type: "position",
      reason: "startPos",
      correctPosition: spawnPos,
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
    await Basic.Wait(rules.spawnCoolDown);
    let playerInstance = lobbyManager.getPlayerUsingId(json.id);
    if (playerInstance) {
      playerInstance.spawnDelay = false;
    }
    return;
  } else {
    if (playerInstance.isDead == false && playerInstance.spawnDelay == false) {
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
