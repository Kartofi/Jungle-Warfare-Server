const outDatedClient = JSON.stringify({
  type: "ExitGame",
  reason: "Outdated client please update.",
});

const problemRejoin = JSON.stringify({
  type: "ExitGame",
  reason: "There was a problem please rejoin.",
});
const problemTryAgain = JSON.stringify({
  type: "ExitGame",
  reason: "There was a problem please try again later.",
});
const joinableLobbies = JSON.stringify({
  type: "ExitGame",
  reason: "There are no joinable lobbies, please create one.",
});
const accountLoggedFromAnotherLocation = JSON.stringify({
  type: "ExitGame",
  reason: "Account logged from another location.",
});
const nameTooShort = JSON.stringify({
  type: "ExitGame",
  reason: "Account name is too short.",
});
const nameTooLong = JSON.stringify({
  type: "ExitGame",
  reason: "Account name is too long.",
});
const loginSessionIdTooShort = JSON.stringify({
  type: "ExitGame",
  reason: "Account login session Id is too short.",
});
const wrongLoginSession = JSON.stringify({
  type: "ExitGame",
  reason: "Invalid account login session.",
});
const lobbyIsFull = JSON.stringify({
  type: "ExitGame",
  reason: "The lobby is full.",
});
module.exports = {
  outDatedClient,
  lobbyIsFull,
  loginSessionIdTooShort,
  wrongLoginSession,
  problemRejoin,
  problemTryAgain,
  joinableLobbies,
  accountLoggedFromAnotherLocation,
  nameTooShort,
  nameTooLong,
};
