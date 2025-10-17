// models/OrderStatus.js
import mongoose from "mongoose";

const orderStatusSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  isOpen: { type: Boolean, default: false },
  cutOffTime: { type: String },           // "HH:mm:ss"
});

export default mongoose.model("OrderStatus", orderStatusSchema);
