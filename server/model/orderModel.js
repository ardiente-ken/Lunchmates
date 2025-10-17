import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  oh_userID: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  oh_orderDate: { type: Date, required: true },
  oh_totalAmount: { type: Number, default: 0 },
  items: [orderItemSchema],
});

export default mongoose.model("Order", orderSchema);
