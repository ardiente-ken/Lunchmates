import mongoose from "mongoose";

const dailyMenuSchema = new mongoose.Schema({
  dm_date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  dm_itemName: {
    type: String,
    required: true,
  },
  dm_itemPrice: {
    type: Number,
    required: true,
  },
});

// Prevent duplicates on the same day for the same item
dailyMenuSchema.index({ dm_date: 1, dm_itemName: 1 }, { unique: true });

export default mongoose.model("DailyMenu", dailyMenuSchema);
