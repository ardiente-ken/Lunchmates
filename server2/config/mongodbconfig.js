require('dotenv').config({ path: '../.env' });
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
console.log("🔍 Loaded URI:", uri); // optional debug

if (!uri) {
  console.error("❌ MONGODB_URI is undefined. Check your .env path or variable name.");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
  } catch (err) {
    console.error("❌ Connection failed:", err);
  } finally {
    await client.close();
  }
}

run();
