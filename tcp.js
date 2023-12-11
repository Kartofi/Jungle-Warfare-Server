var net = require("net");

var server = net.createServer();

let connectedPlayers = [];

var moderateText = require("./Utils/moderateText")

server.on("connection", (socket) => {
  let name;
  let deviceId;
  let sessionId;
  let lobbyId;

  socket.setKeepAlive(true,10000);

  socket.on("data", (receiveData) => {
    let json;
    try {
      json = JSON.parse(receiveData.toString());
    } catch (e) {
      return;
    }

    if (json.type == "join") {
      if (connectedPlayers.find((element) => element.name == json.name)) {
        socket.write(
          JSON.stringify({
            type: "ExitGame",
            request: "Account logged from another location.",
          })
        );
        socket.destroy();
        return;
      }
      name = json.request;
      deviceId = json.deviceId;
      sessionId = json.sessionId;
      lobbyId = json.lobbyId;

      if (lobbies[json.lobbyId] == null) {
        let dataToSend = JSON.stringify({
          type: "ExitGame",
          request: "Lobby is not available : " + json.lobbyId,
        });
        socket.write(dataToSend.length + "@" + dataToSend);
        socket.destroy();
        return;
      }

      connectedPlayers.push({
        name: name,
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
    }
  });
  socket.on("close", () => {
    removePlayer(name, deviceId, sessionId);
  });
  socket.on("end", () => {
    removePlayer(name, deviceId, sessionId);
  });
  socket.on("error", (error) => {
    console.log(error)
    removePlayer(name, deviceId, sessionId);
  });
});

function broadcast(message, lobbyId, senderSocket) {
  connectedPlayers.forEach((client) => {
    // Don't send the message back to the sender
    if (client.socket !== senderSocket && client.lobbyId == lobbyId) {
      client.socket.write("\0" + message.length + "\u0007" + message);
    }
  });
}



function removePlayer(name, deviceId, sessionId) {
  const playerInstance = connectedPlayers.find(
    (element) =>
      element.name == name &&
      element.deviceId == deviceId &&
      element.sessionId == sessionId
  );
  const indexPlayer = connectedPlayers.indexOf(playerInstance);
  if (indexPlayer !== -1) {
    connectedPlayers.splice(indexPlayer, 1);
  }
}
server.listen(2222, function () {
  console.log("TCP server is listening on port ", 2222 );
});

module.exports = { broadcast };
