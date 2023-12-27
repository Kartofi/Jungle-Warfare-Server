const predefinedKeys = {
  playerData: [
    {
      name: "string",
      id: "number",
      deviceId: "string",
      sessionId: "string",
      lobbyId: "string",
      ping: "number",
      ip: "string",
      weapon: "string",
      health: "number",
      bullets: "number",
      isDead: "boolean",
      state: "string",
      kills: "number",
      CameraData: {
        position: { x: "number", y: "number", z: "number" },
        rotation: { x: "number", y: "number", z: "number" },
      },
      position: { x: "number", y: "number", z: "number" },
      rotation: { x: "number", y: "number", z: "number" },
      lastUpdate: "number",
      lastShoot: "number",
      lastReload: "number",
      reloading: "boolean",
    },
  ],
  updateFirst: {
    name: "test",
    id: 0,
    versionHash: "47cd76e43f74bbc2e1baaf194d07e1fa",
    loginSessionId: "f2aeb9d59a6be3c13de7ccd70e06dbf1",
    deviceId: "a2587ec31a9bf6121dfea60da1c5904b779ccd50",
    sessionId: "",
    lobbyId: "123",
    rules: {
      jumpCooldown: 1,
      lobbySize: 20,
      maxHealth: 100,
      respawnTime: 5000,
      weaponsRules: [],
    },
    ping: 999,
    bullets: 0,
    weapon: "",
    health: 100,
    state: 0,
    kills: 0,
    isDead: false,
    reloading: false,
    CameraData: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  update: {
    name: "test",
    id: 0,
    versionHash: "47cd76e43f74bbc2e1baaf194d07e1fa",
    loginSessionId: "f2aeb9d59a6be3c13de7ccd70e06dbf1",
    deviceId: "a2587ec31a9bf6121dfea60da1c5904b779ccd50",
    sessionId: "f324938c-ccec-495b-bbe7-9b755878d755",
    lobbyId: "123",
    rules: {
      jumpCooldown: 0,
      lobbySize: 0,
      maxHealth: 0,
      respawnTime: 0,
      weaponsRules: [],
    },
    ping: 999,
    bullets: 0,
    weapon: "",
    health: 100,
    state: 0,
    kills: 0,
    isDead: false,
    reloading: false,
    CameraData: {
      position: { x: 0, y: 2.00990891456604, z: 8.954601328186408e-19 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    position: { x: 0, y: 1.0099999904632568, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  },
};

function containsEveryKeyInArray(json, keys) {
  let jsonKeys = Object.keys(json);
  if (jsonKeys.length != keys.length) {
    return false;
  }
}
module.exports = {
  containsEveryKeyInArray,
};
