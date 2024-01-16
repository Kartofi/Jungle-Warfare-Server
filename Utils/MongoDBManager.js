const { MongoClient, ServerApiVersion } = require("mongodb");
const crypto = require("crypto");
const moderation = require("./moderateText");

const client = new MongoClient(process.env.mongodb, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const fs = require("fs");
let sessionTimeOut = 604800000;
let maxSessions = 5;
let noPfpImage = Buffer.from(
  fs.readFileSync("./Images/playerUnknown.png"),
  "base64"
);
async function connect() {
  try {
    // Connect the client to the server
    await client.connect();

    console.log("Connected to MongoDB");
  } catch (e) {
    console.log(e);
  }
}
connect().catch(console.dir);
function isConnected() {
  return !!client && !!client.topology && client.topology.isConnected();
}
async function Login(name, password) {
  if (isConnected() == false) {
    return false;
  }
  let collection = client.db("Accounts").collection("Accounts");
  let player = await collection.findOne({ name: name, password: password });
  if (player != null) {
    let time = Date.now();

    let sessionId = crypto
      .createHash("md5")
      .update(player.id + "-" + time * crypto.randomInt(100))
      .digest("hex");
    let sessions = player.loginSessionIds == null ? [] : player.loginSessionIds;
    sessions.push({
      id: sessionId,
      time: time,
    });
    sessions = sessions.filter(
      (session) => session.time > time - sessionTimeOut
    );

    sessions.sort((item) => item.time);
    sessions.reverse();

    if (sessions.length > maxSessions) {
      for (let i = 0; i < sessions.length - maxSessions; i++) {
        sessions.pop();
      }
    }
    await collection.updateOne(
      { name: name, password: password },
      { $set: { loginSessionIds: sessions } }
    );
    return { loginSessionId: sessionId, playerId: player.id };
  } else {
    return null;
  }
}
async function CheckSessionId(id, sessionId) {
  if (isConnected() == false) {
    return false;
  }
  try {
    id = Number(id);
  } catch (e) {
    return false;
  }
  let collection = client.db("Accounts").collection("Accounts");
  let player = await collection.findOne({ id: id });

  if (player != null) {
    let sessionIdData = player.loginSessionIds.find(
      (item) => item.id == sessionId
    );
    if (
      sessionIdData != null &&
      Date.now() - sessionIdData.time < sessionTimeOut
    ) {
      return player.name;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
async function LogOut(id, sessionId) {
  if (isConnected() == false) {
    return false;
  }
  try {
    id = Number(id);
  } catch (e) {
    return false;
  }
  let collection = client.db("Accounts").collection("Accounts");
  let player = await collection.findOne({ id: id });

  if (player != null) {
    let sessionIdData = player.loginSessionIds.find(
      (item) => item.id == sessionId
    );
    if (sessionIdData != null) {
      await collection.updateOne(
        { id: id },
        { $pull: { loginSessionIds: { id: sessionId } } }
      );
    }
    return true;
  } else {
    return false;
  }
}
async function GetAccountData(id) {
  if (isConnected() == false) {
    return null;
  }
  let collection = client.db("Accounts").collection("Accounts");
  let player = await collection.findOne({ id: id });

  if (player != null) {
    return player;
  } else {
    return null;
  }
}
async function CreateAccount(name, email, password, avatar) {
  if (isConnected() == false) {
    return;
  }
  let collection = client.db("Accounts").collection("Accounts");
  let playerName = await collection.findOne({ name: name });
  let playerEmail = await collection.findOne({ email: email });

  if (playerName != null || playerEmail != null) {
    return { status: "Email or name already in use!" };
  }
  let result = moderation.CensorBadWords(name) != name;
  if (result == true) {
    return { status: "Name is inappropriate!" };
  }
  if (avatar == null) {
    avatar = noPfpImage;
  }

  let time = Date.now();
  let id = time + "" * crypto.randomInt(1000) * crypto.randomInt(1000);
  id = Number(id);
  let sessionId = crypto
    .createHash("md5")
    .update(id + "-" + time * crypto.randomInt(100))
    .digest("hex");

  collection.insertOne({
    id: id,
    name: name,
    password: password,
    profilePicture: avatar,
    loginSessionIds: [sessionId],
  });
  return sessionId;
}
module.exports = {
  Login,
  LogOut,
  CheckSessionId,
  isConnected,
  GetAccountData,
  CreateAccount,
};
