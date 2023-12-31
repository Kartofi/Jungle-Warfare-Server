const { MongoClient, ServerApiVersion } = require("mongodb");
const crypto = require("crypto");
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(
  "mongodb+srv://kartof:Anatoli7707@kartoffps.samchkx.mongodb.net/?retryWrites=true&w=majority",
  {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  }
);
const fs = require("fs");
let sessionTimeOut = 604800000;
let maxSessions = 5;

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
async function CreateAccount(name, password, avatar) {
  if (isConnected() == false) {
    return;
  }
  let collection = client.db("Accounts").collection("Accounts");
  collection.insertOne({
    name: name,
    password: password,
    profilePicture: avatar,
    loginSessionIds: [],
  });
}
module.exports = {
  Login,
  LogOut,
  CheckSessionId,
  isConnected,
  GetAccountData,
  CreateAccount,
};
