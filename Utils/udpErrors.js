
const outDatedClient = JSON.stringify({
    type: "ExitGame",
    reason: "Outdated client please update.",
})

const problemRejoin = JSON.stringify({
    type: "ExitGame",
    reason: "There was a problem please rejoin.",
})

const joinableLobbies = JSON.stringify({
    type: "ExitGame",
    reason: "There are no joinable lobbies, please create one.",
})
module.exports = {outDatedClient,problemRejoin,joinableLobbies}