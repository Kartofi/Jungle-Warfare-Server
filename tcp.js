var net = require("net");

var server = net.createServer();

let connectedPlayers = [];

var moderateText = require("./Utils/moderateText");
const Basic = require("./Utils/Basic");
const lobbyManager = require("./Utils/lobbyManager");
const gzipManager = require("./Utils/GZipManager");
const validateJsonInput = require("./Utils/validateJsonInput");

const reload = require("./Utils/GameLogic/reload");
function formatStringToSend(data) {
  return "\0" + data.length + "\u0007" + data;
}
server.on("connection", (socket) => {
  let playerId;
  let deviceId;
  let sessionId;
  let lobbyId;

  socket.on("data", async (receiveData) => {
    let json;
    json = receiveData.toString("utf-8");
    try {
      json = JSON.parse(json);
    } catch (e) {
      return;
    }
    if (json.type == "join") {
      let validJson = validateJsonInput.ValidateTcpJoin(json);
      if (validJson == false) {
        let dataToSend = JSON.stringify({
          type: "ExitGame",
          request: "There was a problem, please try again later!",
        });
        socket.write(formatStringToSend(dataToSend));
        socket.destroy();
        return;
      }
      if (
        connectedPlayers.find(
          (element) =>
            element.playerId == json.playerId &&
            element.sessionId == json.sessionId
        ) != null
      ) {
        let dataToSend = JSON.stringify({
          type: "ExitGame",
          request: "Account logged from another location.",
        });
        socket.write(formatStringToSend(dataToSend));
        socket.destroy();
        return;
      }

      if (lobbyManager.getPlayerUsingId(json.playerId) == null) {
        let dataToSend = JSON.stringify({
          type: "ExitGame",
          request: "There was a problem, please try again later!",
        });
        socket.write(formatStringToSend(dataToSend));
        socket.destroy();
        return;
      }
      playerId = json.playerId;
      deviceId = json.deviceId;
      sessionId = json.sessionId;
      lobbyId = json.lobbyId;

      if (lobbies[json.lobbyId] == null) {
        let dataToSend = JSON.stringify({
          type: "ExitGame",
          request: "Lobby is not available : " + json.lobbyId,
        });
        socket.write(formatStringToSend(dataToSend));
        socket.destroy();
        return;
      }

      connectedPlayers.push({
        playerId: playerId,
        deviceId: deviceId,
        sessionId: sessionId,
        lobbyId: lobbyId,
        socket: socket,
      });
    } else if (json.type == "sendMessage") {
      let validJson = validateJsonInput.ValidateTcpJoin(json);
      if (validJson == false) {
        return;
      }
      if (
        json.request === "\n" ||
        json.fromId !== playerId ||
        json.fromId == -1 ||
        json.deviceId !== deviceId ||
        json.sessionId !== sessionId ||
        json.lobbyId !== lobbyId ||
        !sessionId ||
        !deviceId ||
        !lobbyId
      ) {
        return;
      }
      json.request = moderateText.CensorBadWords(json.request);
      broadcast(JSON.stringify(json), lobbyId, null);
    } else if (json.type == "reload") {
      reload.Reload(json, broadcast);
    } else if (json.type == "keepAlive") {
      socket.write(formatStringToSend(JSON.stringify({ type: "keepAlive" })));
    }
  });
  socket.on("close", () => {
    removePlayer(playerId, sessionId, lobbyId);
  });
  socket.on("end", () => {
    removePlayer(playerId, sessionId, lobbyId);
  });
  socket.on("error", (error) => {
    removePlayer(playerId, sessionId, lobbyId);
  });
});

function broadcast(message, lobbyId, senderSocket) {
  let writeData = formatStringToSend(message).toString("utf-8");
  connectedPlayers.forEach((client) => {
    // Don't send the message back to the sender
    if (client.socket !== senderSocket && client.lobbyId == lobbyId) {
      client.socket.write(writeData);
    }
  });
}

function removePlayer(playerId, sessionId, lobbyId) {
  connectedPlayers = connectedPlayers.filter(
    (player) =>
      player.playerId !== playerId ||
      player.sessionId !== sessionId ||
      player.lobbyId !== lobbyId
  );
}
let port = process.env.tcpPort | 2222;
server.listen(port, function () {
  console.log("TCP server is listening on port ", port);
});

module.exports = { broadcast, removePlayer };
