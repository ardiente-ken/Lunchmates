import mongoose from "mongoose";

const cutOffSchema = new mongoose.Schema({
  co_date: {
    type: String, // store as "YYYY-MM-DD" string for simplicity
    required: true,
    unique: true, // ensure one record per date
  },
  co_time: {
    type: String, // store as "HH:MM:SS"
    required: true,
  },
});

export default mongoose.model("Cutoff", cutOffSchema)

