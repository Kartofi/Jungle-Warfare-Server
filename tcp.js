var net = require("net");

var server = net.createServer();

let connectedPlayers = [];

var moderateText = require("./Utils/moderateText");
const Basic = require("./Utils/Basic");
const lobbyManager = require("./Utils/lobbyManager");
const gzipManager = require("./Utils/GZipManager");

const reload = require("./Utils/GameLogic/reload");
function formatStringToSend(data) {
  return "\0" + data.length + "\u0007" + data;
}
server.on("connection", (socket) => {
  let name;
  let playerId;
  let deviceId;
  let sessionId;
  let lobbyId;

  socket.setKeepAlive(true, 10000);

  socket.on("data", async (receiveData) => {
    let json;
    json = receiveData.toString("base64");
    try {
      json = await gzipManager.Decompress(json);
      json = JSON.parse(json);
    } catch (e) {
      console.log(e);
      return;
    }

    if (json.type == "join") {
      if (
        connectedPlayers.find((element) => element.playerId == json.playerId)
      ) {
        console.log(123);
        let dataToSend = JSON.stringify({
          type: "ExitGame",
          request: "Account logged from another location.",
        });
        socket.write(gzipManager.Compress(formatStringToSend(dataToSend)));
        socket.destroy();
        return;
      }
      name = json.from;
      playerId = json.playerId;
      deviceId = json.deviceId;
      sessionId = json.sessionId;
      lobbyId = json.lobbyId;

      if (lobbies[json.lobbyId] == null) {
        let dataToSend = JSON.stringify({
          type: "ExitGame",
          request: "Lobby is not available : " + json.lobbyId,
        });
        socket.write(gzipManager.Compress(formatStringToSend(dataToSend)));
        socket.destroy();
        return;
      }

      connectedPlayers.push({
        name: name,
        playerId: playerId,
        deviceId: deviceId,
        sessionId: sessionId,
        lobbyId: lobbyId,
        socket: socket,
      });
    } else if (json.type == "sendMessage") {
      if (
        json.request === "\n" ||
        json.from !== name ||
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
      socket.write(
        gzipManager.Compress(
          formatStringToSend(JSON.stringify({ type: "keepAlive" }))
        )
      );
    }
  });
  socket.on("close", () => {
    removePlayer(playerId, deviceId, sessionId);
  });
  socket.on("end", () => {
    removePlayer(playerId, deviceId, sessionId);
  });
  socket.on("error", (error) => {
    removePlayer(playerId, deviceId, sessionId);
  });
});

function broadcast(message, lobbyId, senderSocket) {
  let writeData = gzipManager.Compress(formatStringToSend(message));
  connectedPlayers.forEach((client) => {
    // Don't send the message back to the sender
    if (client.socket !== senderSocket && client.lobbyId == lobbyId) {
      client.socket.write(writeData);
    }
  });
}

function removePlayer(playerId, deviceId, sessionId) {
  connectedPlayers = connectedPlayers.filter(
    (player) =>
      player.id == playerId &&
      player.deviceId == deviceId &&
      player.sessionId == sessionId
  );
}
server.listen(2222, function () {
  console.log("TCP server is listening on port ", 2222);
});

module.exports = { broadcast };
