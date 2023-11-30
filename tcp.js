var net = require("net");

var server = net.createServer();

let connectedPlayers = [];

server.on("connection", (socket) => {
  let name;
  let deviceId;
  let sessionId;
  let lobbyId;
  socket.on("data", (receiveData) => {
    let json;
    try {
      json = JSON.parse(receiveData.toString());
    } catch (e) {
      return;
    }

    if (json.type == "nameCheck") {
      nameCheck(socket, json);
    } else if (json.type == "join") {
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

      if (data[json.lobbyId] == null) {
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

function nameCheck(socket, json) {
  let player = data.lobby1.players.find(
    (element) => element.name == json.request
  );
  if (player) {
    socket.write(JSON.stringify({ name: "taken", type: "notSuccess" }));
    return;
  }
  socket.write(JSON.stringify({ name: "empty", type: "Success" }));
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
