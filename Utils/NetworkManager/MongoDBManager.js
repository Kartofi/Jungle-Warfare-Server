const { MongoClient, ServerApiVersion } = require("mongodb");
const crypto = require("crypto");
const moderation = require("../General/moderation");

const mailManager = require("./mailManager");
const idManager = require("../General/idManager");

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

let changeInfoMaxTime = 60000 * 2;
let changeInfoMinTime = 60000;

let forgotInfoMinTime = 60000;
let forgotInfoMaxTime = 60000 * 2;

let changePFPMinTime = 600000;
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
async function Login(name, password, userData = null) {
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

    let sessionId = idManager.generateRandomStringId();
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
    let userDataString =
      userData == null
        ? ""
        : "<br> IP: " +
          userData.ip +
          "<br>Location: " +
          userData.location +
          "<br>Browser: " +
          userData.browser;
    mailManager.SendEmail(player.email, {
      subject: "Jungle Warfare: New Login for " + player.name,
      html:
        "There was a successful login attempt for " +
        player.name +
        ".<br>" +
        userDataString +
        "<br> <br> If that was not you change your password immediately or you might lose your account.<br> <br> Best regards, Jungle Warfare. <br> <a href='https://junglewarfare.fun/'>https://junglewarfare.fun/",
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
async function GetAccountDataUsingEmail(email) {
  if (isConnected() == false) {
    return null;
  }
  if (isEmailValid(email) == false) {
    return null;
  }
  let collection = client.db("Accounts").collection("Accounts");
  let player = await collection.findOne({ email: email });

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
  if (avatar == null || avatar.length == 0) {
    avatar = noPfpImage;
  }
  let id = idManager.generateRandomNumberId(18);
  id = Number(id);
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
    loginSessionIds: [],
    changeEmailId: { time: 0, id: undefined },
    lastPFPChange: 0,
    lastForgotUsername: 0,
    forgotPassword: { time: 0, id: undefined },
  });
  return { error: undefined };
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
        error:
          "On cooldown you have " +
          date.getMinutes() +
          ":" +
          date.getSeconds() +
          " remaining.",
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
        changeEmailId: { time: time, id: undefined },
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
        "There is a cooldown of one minute please wait. Time remaining: " +
        Math.round(
          (changeInfoMinTime - time + playerData.changeEmailId.time) / 1000
        ) +
        " seconds.",
    };
  }
  let emailId = idManager.generateRandomStringId();

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
      "dashboard/changeEmail/" +
      playerData.id +
      "/" +
      emailId +
      "'>" +
      "HERE (this link will expire in 120 seconds)",
  });

  return { status: "Sent verification email to " + playerData.email };
}
//Forgot Info
async function ForgotInfo(email, info) {
  if (isConnected() == false) {
    return null;
  }
  if (isEmailValid(email) == false) {
    return { error: "Incorrect email!" };
  }
  let time = Date.now();

  let playerData = await GetAccountDataUsingEmail(email);

  if (playerData == null) {
    return { error: "This email is not associated with any account." };
  }
  let savedTime = 0;

  if (info == "Username") {
    savedTime = playerData.lastForgotUsername;
  } else {
    savedTime = playerData.forgotPassword.time;
  }
  if (time - savedTime <= forgotInfoMinTime) {
    return {
      error:
        "There is a cooldown of one minute please wait. Time remaining: " +
        Math.round((forgotInfoMinTime - time + savedTime) / 1000) +
        " seconds.",
    };
  }
  let collection = client.db("Accounts").collection("Accounts");
  if (info == "Username") {
    await collection.findOneAndUpdate(
      { email: email },
      { $set: { lastForgotUsername: time } }
    );

    mailManager.SendEmail(playerData.email, {
      subject: "Jungle Warfare: Username Remider",
      html:
        'Your Username is "' +
        playerData.name +
        '". <br> <br> Best Regards, Jungle Warfare <br> <a href="https://junglewarfare.fun/">https://junglewarfare.fun/</a>',
    });

    return { status: "Sent username to " + playerData.email };
  } else {
    let passwordId = idManager.generateRandomStringId(20);
    await collection.findOneAndUpdate(
      { email: email },
      {
        $set: {
          forgotPassword: { time: time, id: passwordId },
        },
      }
    );

    mailManager.SendEmail(playerData.email, {
      subject: "Jungle Warfare: Reset Password",
      html:
        "To reset your password click <a href=" +
        rootUrl +
        "forgotPassword/" +
        playerData.id +
        "/" +
        passwordId +
        ">HERE (this link expires in 120 seconds)" +
        '<br> <br> Best Regards, Jungle Warfare <br> <a href="https://junglewarfare.fun/">https://junglewarfare.fun/</a>',
    });

    return { status: "Sent password verification to " + playerData.email };
  }
}

async function ForgotPasswordApprove(id, changePasswordId) {
  try {
    id = Number(id);
  } catch (e) {
    return { error: "Invalid Id!" };
  }
  let time = Date.now();

  let playerData = await GetAccountData(id);
  if (playerData == null) {
    return { error: "Account does not exist!" };
  }
  if (time - playerData.forgotPassword.time > forgotInfoMaxTime) {
    return {
      error: "Link expired! Please create a new one.",
    };
  }
  if (playerData.forgotPassword.id != changePasswordId) {
    return { error: "Change Password id not valid!" };
  }
  let password = idManager.generateRandomStringId(10);
  let collection = client.db("Accounts").collection("Accounts");
  await collection.findOneAndUpdate(
    { id: id },
    {
      $set: {
        forgotPassword: { time: time, id: undefined },
        password: password,
        loginSessionIds: [],
      },
    }
  );
  mailManager.SendEmail(playerData.email, {
    subject: "Jungle Warfare: Reset Password",
    html:
      'Your new automatically generated password is "' +
      password +
      '". Use it to login and change your password. <br> <br> Best Regards, Jungle Warfare <br> <a href="https://junglewarfare.fun/">https://junglewarfare.fun/</a>',
  });
  return true;
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

  ForgotInfo,
  ForgotPasswordApprove,
};
