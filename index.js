const UDP = require("dgram");

const server = UDP.createSocket("udp4");

const Vectors = require("./Utils/Vectors");
const Basic = require("./Utils/Basic");
const AntiCheat = require("./Utils/AntiCheat");
const mongoDB = require("./Utils/MongoDBManager");
const udpErrors = require("./Utils/udpErrors");
const gzipManager = require("./Utils/GZipManager");
const validate = require("./Utils/validateJsonInput");

const { v1: uuidv1, v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const tcp = require("./tcp");
const startMenuTcp = require("./http");

const port = 2222;
server.on("listening", () => {
  const address = server.address();
  console.log("UDP server is listening on port ", address.port);
});

const fs = require("fs");

global.version = "1.0.0";

global.currentVersionHash = "47cd76e43f74bbc2e1baaf194d07e1fa";
//crypto.createHash('md5').update(version).digest('hex');;

global.defaultWeaponsRules = [
  {
    WeaponName: "Rifle",
    shootCooldown: 0.1,
    walkSpeed: 7,
    reloadWalkSpeed: 5,
    recoilMultiplier: 1,
    shootMaxDistance: 50,
    shootIndicatorDistance: 50,
    bulletsMax: 30,
    reloadTime: 1,
    damage: 10,
    headShotMultiplier: 1.5,
  },
  {
    WeaponName: "Revolver",
    shootCooldown: 0.5,
    walkSpeed: 7,
    reloadWalkSpeed: 6,
    recoilMultiplier: 5,
    shootMaxDistance: 100,
    shootIndicatorDistance: 100,
    bulletsMax: 6,
    reloadTime: 1,
    damage: 34,
    headShotMultiplier: 2,
  },
];

global.defaultRulesForPlayer = {
  maxHealth: 100,

  jumpPowerMultiplier: 1,

  respawnTime: 5 * 1000,

  lobbySize: 20,

  weaponsRules: defaultWeaponsRules,
};
global.lobbies = {};

//Game AntiCheat Properties
global.rules = {
  updateDelay: 50,
  maxMoveDistance: 4,

  headRadius: 0.62,

  jumpCooldown: 1,

  spawnPos: [new Vectors.Vector3(0, 2, 0), new Vectors.Vector3(5, 2, 5)],

  maxLobbyPlayers: 50,
};

const lobbyManager = require("./Utils/lobbyManager");

const disconnect = require("./Utils/GameLogic/disconnect");
const shootIndicator = require("./Utils/GameLogic/shootIndicator");
const DamageHit = require("./Utils/GameLogic/damageHit");
const bullets = require("./Utils/GameLogic/bullets");
const updateData = require("./Utils/GameLogic/updateData");
const keepAlive = require("./Utils/GameLogic/keepAlive");

function RemoveNotUpdatedCall() {
  lobbyManager.RemoveNotUpdated(tcp.broadcast);
}
function SendCompress(json, port, ip) {
  server.send(gzipManager.Compress(json), port, ip);
}
setInterval(RemoveNotUpdatedCall, 10000);

server.on("message", async (message, info) => {
  let json;
  json = message.toString("base64");
  try {
    json = await gzipManager.Decompress(json);
    json = JSON.parse(json);
  } catch (e) {
    console.log(e);
    return;
  }
  if (json.type == "disconnect") {
    disconnect.Disconnect(json, info, tcp.broadcast);
  } else if (json.type == "shoot") {
    if (json.shootType == "shootIndicator") {
      if (json.playerHit == false) {
        bullets.Handle(json, info);
      }
      shootIndicator.Handle(json, info, tcp.broadcast);
    } else if (json.shootType == "damageHit") {
      DamageHit.Handle(json, tcp.broadcast);
      bullets.Handle(json, info);
    }
  } else if (json.type == "keepAlive") {
    keepAlive.Handle(json, info, server);
  } else if (json.type == "ping") {
    if (lobbyManager.checkIfSessionIsIn(json.sessionId) == false) {
      return;
    }
    let dataToSend = JSON.stringify({
      type: "pong",
    });
    SendCompress(dataToSend, info.port, info.address);
  } else {
    updateData.Update(json, server, info, tcp.broadcast);
  }
});

server.bind(port);
