const { MongoClient, ServerApiVersion } = require("mongodb");

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
async function connect() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    console.log("Connected to MongoDB");
  } catch (e) {
    console.log(e);
  }
}
connect().catch(console.dir);
function isConnected() {
  return !!client && !!client.topology && client.topology.isConnected()
}
async function CheckCredentials(name, password) {
  let collection = client.db("Accounts").collection("Accounts");
  let player = await collection.findOne({ name: name, password: password });

  if (player != null) {
    return true;
  } else {
    return false;
  }
}
async function GetAccountData(name){
  let collection = client.db("Accounts").collection("Accounts");
  let player = await collection.findOne({ name: name});

  if (player != null) {
    return player;
  } else {
    return null;
  }
}
async function CreateAccount(name,password,avatar){
  let collection = client.db("Accounts").collection("Accounts");
  collection.insertOne({name: name,password:password,avatar:avatar})
}
module.exports = { CheckCredentials, isConnected, GetAccountData,CreateAccount };
