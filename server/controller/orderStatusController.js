import OrderStatus from "../model/orderStatus.js";
import Cutoff from "../model/cutoffModel.js";

// 🕐 Helper — Schedule automatic close at cut-off time
async function scheduleAutoClose(date, cutOffTime) {
  try {
    const [h, m, s] = cutOffTime.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, s || 0, 0);

    const delay = target - now;
    if (delay <= 0) {
      console.log("⚠️ Cut-off time already passed. No auto-close scheduled.");
      return;
    }

    console.log(`⏰ Scheduling order close in ${(delay / 1000 / 60).toFixed(1)} mins`);

    setTimeout(async () => {
      await OrderStatus.findOneAndUpdate({ date }, { isOpen: false });
      console.log(`🚫 Order automatically closed for ${date}`);
    }, delay);
  } catch (err) {
    console.error("❌ Error scheduling auto close:", err);
  }
}

// ✅ Get current order status (for today)
export const getOrderStatus = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const status = (await OrderStatus.findOne({ date: today })) || { isOpen: false };
    res.json(status);
  } catch (err) {
    console.error("❌ Error fetching order status:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🚀 Toggle/set order status and schedule auto-close
export const setOrderStatus = async (req, res) => {
  try {
    const { isOpen } = req.body;
    const today = new Date().toISOString().split("T")[0];

    let status = await OrderStatus.findOne({ date: today });
    if (!status) {
      status = new OrderStatus({ date: today, isOpen });
    } else {
      status.isOpen = isOpen;
    }

    // ✅ If opening orders, require today's cutoff
    if (isOpen) {
      const existingCutoff = await Cutoff.findOne({ co_date: today }).sort({ createdAt: -1 });

      if (!existingCutoff) {
        return res.status(400).json({
          message: "Please set cutoff time first before opening orders.",
        });
      }

      const cutOffTime = existingCutoff.co_time || "12:00:00";
      status.cutOffTime = cutOffTime;

      scheduleAutoClose(today, cutOffTime);
    }

    await status.save();
    res.json({ message: "Order status updated successfully", status });
  } catch (err) {
    console.error("❌ Error setting order status:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
