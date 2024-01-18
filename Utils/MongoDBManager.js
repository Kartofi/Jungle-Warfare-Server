const { MongoClient, ServerApiVersion } = require("mongodb");
const crypto = require("crypto");
const moderation = require("./moderation");

const mailManager = require("./mailManager");

var validator = require("email-validator");

const client = new MongoClient(process.env.mongodb, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const fs = require("fs");
let sessionTimeOut = 604800000;

let changeInfoMaxTime = 86400000;
let changeInfoMinTime = 60000;

let changePFPMinTime = 8640000000;
let loginMinTime = 10000;

let maxSessions = 50;
let noPfpImage = Buffer.from(
  fs.readFileSync("./Images/playerUnknown.png"),
  "base64"
);
async function connect() {
  try {
    // Connect the client to the server
    await client.connect();

    console.log("Connected to MongoDB");
    let result = await CreateAccount(
      "123",
      "anatoli7707@gmail.com",
      "123123",
      null
    );
    console.log(result);
  } catch (e) {
    console.log(e);
  }
}
connect().catch(console.dir);
function isConnected() {
  return !!client && !!client.topology && client.topology.isConnected();
}
async function isEmailValid(email) {
  return validator.validate(email);
}
async function Login(name, password) {
  if (isConnected() == false) {
    return false;
  }
  let collection = client.db("Accounts").collection("Accounts");
  let player = await collection.findOne({ name: name });
  let passwordValid = false;
  if (player != null) {
    passwordValid = player.password == password;
  }

  if (player != null && passwordValid == true) {
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
    if (sessions.length > 1 && time - sessions[1].time <= loginMinTime) {
      return { error: "There is a login cooldown please wait." };
    }
    if (sessions.length > maxSessions) {
      for (let i = 0; i < sessions.length - maxSessions; i++) {
        sessions.pop();
      }
    }
    await collection.updateOne(
      { name: name, password: password },
      { $set: { loginSessionIds: sessions } }
    );
    mailManager.SendEmail(player.email, {
      subject: "Jungle Warfare: New Login for " + player.name,
      html:
        "There was a successful login attempt for " +
        player.name +
        ".<br> If this is not you change your password immediately or you might lose your account.<br> <br> Best regards, Jungle Warfare. <br> <a href='https://junglewarfare.fun/'>https://junglewarfare.fun/",
    });
    return { loginSessionId: sessionId, playerId: player.id };
  } else {
    if (player == null) {
      return { error: "Player not found!" };
    } else if (passwordValid == false) {
      return { error: "Wrong Password!" };
    }
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
  try {
    id = Number(id);
  } catch (e) {
    return false;
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
    return { error: "Email or name already in use!" };
  }
  let result = moderation.CensorBadWords(name) != name;
  if (result == true) {
    return { error: "Name is inappropriate!" };
  }
  if ((await isEmailValid(email)) == false) {
    return { error: "Invalid Email!" };
  }
  if (password.length < 5 || password.length > 50) {
    return { error: "Password must be between 5 and 50 characters!" };
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
  mailManager.SendEmail(email, {
    subject: "Welcome to Jungle Warfare " + name,
    html: "Thanks for joining us. <br> If you have any questions feel free to reply to this email! <br> <br> Best regards, Jungle Warfare  <br> <a href='https://junglewarfare.fun/'>https://junglewarfare.fun/",
  });
  collection.insertOne({
    id: id,
    email: email,
    name: name,
    password: password,
    profilePicture: avatar,
    loginSessionIds: [{ sessionId: sessionId, time: time }],
    changeEmailId: {},
    lastPFPChange: 0,
  });
  return { sessionId: sessionId };
}
//Website
async function ChangePassword(id, loginSessionId, oldPassword, newPassword) {
  if (oldPassword == newPassword) {
    return { error: "The new password can't be the same one as the old one." };
  }
  if (isConnected() == false) {
    return { error: "There was an error please try again later." };
  }
  try {
    id = Number(id);
  } catch (e) {
    return { error: "Invalid id please try again later." };
  }
  let collection = client.db("Accounts").collection("Accounts");
  let player = await collection.findOne({ id: id });

  if (player == null) {
    return { error: "Player not found." };
  } else {
    let sessionCheck = await CheckSessionId(id, loginSessionId);
    if (sessionCheck == false) {
      return { error: "Invalid session id!" };
    }
    if (newPassword.length > 50 || newPassword.length < 5) {
      return { error: "Password must be in the range 5-50 characters." };
    }
    if (player.password != oldPassword) {
      return { error: "Invalid old password." };
    }
    await collection.findOneAndUpdate(
      { id: id },
      { $set: { password: newPassword, loginSessionIds: [] } }
    );
    mailManager.SendEmail(player.email, {
      subject: "Jungle Warfare: Password Changed",
      html:
        "Changed password successfully!" +
        ". <br> If this was not you reply to this email immediately and our support will help you. <br> <br> Best regards, Jungle Warfare.  <br> <a href='https://junglewarfare.fun/'>https://junglewarfare.fun/",
    });
    return true;
  }
}

async function ChangePFP(id, loginSessionId, newPFP) {
  if (isConnected() == false) {
    return { error: "There was an error please try again later." };
  }
  try {
    id = Number(id);
  } catch (e) {
    return { error: "Invalid id please try again later." };
  }
  let collection = client.db("Accounts").collection("Accounts");
  let player = await collection.findOne({ id: id });

  if (player == null) {
    return { error: "Player not found." };
  } else {
    let sessionCheck = await CheckSessionId(id, loginSessionId);
    if (sessionCheck == false) {
      return { error: "Invalid session id!" };
    }
    let time = Date.now();
    let sub = time - player.lastPFPChange;
    if (sub < changePFPMinTime) {
      let date = new Date(changePFPMinTime - sub);
      return {
        error: "On Cooldown you have " + date.toISOString() + " remaining.",
      };
    }
    await collection.findOneAndUpdate(
      { id: id },
      { $set: { profilePicture: newPFP, lastPFPChange: time } }
    );
    return true;
  }
}
//Change Email
let rootUrl = "http://localhost:2223/";

async function ChangeEmail(id, changeEmailId) {
  if (isConnected() == false) {
    return null;
  }
  try {
    id = Number(id);
  } catch (e) {
    return false;
  }
  let time = Date.now();

  let collection = client.db("Accounts").collection("Accounts");

  let playerData = await GetAccountData(id);
  if (
    playerData == null ||
    playerData.changeEmailId.id != changeEmailId ||
    time - playerData.changeEmailId.time >= changeInfoMaxTime
  ) {
    return {
      error:
        "Invalid data! If you belive this is an error reply to the email and our support will handle the rest.",
    };
  }

  await collection.findOneAndUpdate(
    { id: id },
    {
      $set: {
        email: playerData.changeEmailId.email,
        loginSessionIds: [],
        changeEmailId: {},
      },
    }
  );
  mailManager.SendEmail(playerData.email, {
    subject: "Jungle Warfare: Email Changed",
    html:
      "Changed email adress from " +
      playerData.email +
      " to " +
      playerData.changeEmailId.email +
      ". <br> If this was not you reply to this email immediately and our support will help you. <br> <br> Best regards, Jungle Warfare.  <br> <a href='https://junglewarfare.fun/'>https://junglewarfare.fun/",
  });

  mailManager.SendEmail(playerData.changeEmailId.email, {
    subject: "Jungle Warfare: Email Changed",
    html: "Succesuly changed email adress. <br> If there is a problem or this was not you reply to this email and our support wil help you. <br> <br> Best regards, Jungle Warfare.  <br> <a href='https://junglewarfare.fun/'>https://junglewarfare.fun/",
  });
  return true;
}
async function ChangeEmailIdGenerate(id, loginSessionId, newEmail) {
  if (isConnected() == false) {
    return null;
  }
  try {
    id = Number(id);
  } catch (e) {
    return false;
  }
  let time = Date.now();

  let playerData = await GetAccountData(id);
  let validSessionId = await CheckSessionId(id, loginSessionId);
  let validEmail = await isEmailValid(newEmail);

  if (playerData == null || validEmail == false || validSessionId == false) {
    return { error: "There was an error." };
  }
  if (newEmail == playerData.email) {
    return { error: "The new email can`t be the same as the old one." };
  }
  if (time - playerData.changeEmailId.time <= changeInfoMinTime) {
    return {
      error:
        "There is a timout of one minute please wait. Time remaining: " +
        Math.round(
          (changeInfoMinTime - time + playerData.changeEmailId.time) / 1000
        ) +
        " seconds.",
    };
  } else if (time - playerData.changeEmailId.time >= changeInfoMaxTime) {
    return {
      error: "Url expired, please create a new one.",
    };
  }
  let emailId = crypto
    .createHash("md5")
    .update(newEmail + "-" + time * crypto.randomInt(100))
    .digest("hex");

  let collection = client.db("Accounts").collection("Accounts");

  await collection.findOneAndUpdate(
    { id: id },
    { $set: { changeEmailId: { id: emailId, time: time, email: newEmail } } }
  );

  mailManager.SendEmail(playerData.email, {
    subject: "Jungle Warfare: Email Change Confirmation",
    html:
      "Change email request. <br> If you wish to change the email to " +
      newEmail +
      " then click <a href='" +
      rootUrl +
      "api/approveChangeEmail/" +
      playerData.id +
      "/" +
      emailId +
      "'>" +
      "HERE",
  });

  return { status: "Sent verification email to " + playerData.email };
}

module.exports = {
  Login,
  LogOut,
  CheckSessionId,
  isConnected,
  GetAccountData,

  CreateAccount,

  ChangePFP,

  ChangeEmail,
  ChangeEmailIdGenerate,

  ChangePassword,
};
