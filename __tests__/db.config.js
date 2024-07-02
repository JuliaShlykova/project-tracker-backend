const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo = null;

async function initializeMongoServer() {
  mongo = await MongoMemoryServer.create({
    mongodbMemoryServerOptions: {
      binary: {
        version: '6.0.6',
        skipMD5: true,
      },
      autoStart: false,
      instance: {},
    },
  });
  const mongoUri = mongo.getUri();

  // mongoose.set('debug', true); // what mongoose does under the hood

  mongoose.connect(mongoUri);

  mongoose.connection.on("error", e => {
    if (e.message.code === "ETIMEDOUT") {
      console.log(e);
      mongoose.connect(mongoUri);
    }
    console.log(e);
  });

  // mongoose.connection.once("open", () => {
  //   console.log(`MongoDB successfully connected to ${mongoUri}`);
  // });
}

const dropDB = async () => {
  if (mongo) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  }
};

const dropCollections = async () => {
  if (mongo) {
    // https://mongodb.github.io/node-mongodb-native/Next/classes/Db.html#collections
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.drop();
    }
  }
};

module.exports = {initializeMongoServer, dropDB, dropCollections};