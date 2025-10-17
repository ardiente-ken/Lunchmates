// cleanup.js
const mongoose = require("mongoose");
const cron = require("node-cron");

// --- CONFIG ---
const MONGO_URI = process.env.MONGO_URL;
const DAYS_TO_KEEP = 7;

// --- CONNECT ---
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- CLEANUP FUNCTION ---
async function cleanupOldData(days = DAYS_TO_KEEP) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const collections = [
      { name: "orders", dateField: "oh_orderDate" },
      { name: "cutoffs", dateField: "co_date" },
      { name: "dailymenus", dateField: "dm_date" },
      { name: "orderstatuses", dateField: "date" },
    ];

    for (const { name, dateField } of collections) {
      const col = mongoose.connection.db.collection(name);
      const result = await col.deleteMany({ [dateField]: { $lt: cutoffDate } });
      console.log(`🗑️ Deleted ${result.deletedCount} documents from '${name}'`);
    }

    console.log("✅ Cleanup complete.");
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
  }
}

// --- RUN ONCE ---
cleanupOldData();

// --- OPTIONAL: AUTO RUN DAILY AT 2 AM ---
// cron.schedule("0 2 * * *", () => {
//   console.log("🧹 Running daily cleanup...");
//   cleanupOldData();
// });
