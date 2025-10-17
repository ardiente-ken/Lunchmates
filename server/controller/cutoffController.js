import CutOff from "../model/cutoffModel.js";

/**
 * Add or update cut-off time
 * Body: { time: "HH:MM:SS" }
 */
export const setTodayCutOff = async (req, res) => {
  const { time, updatedBy } = req.body; // <-- receive username from request

  console.log("🟦 Cut-Off request received");
  console.log("➡️ Time provided:", time);
  console.log("➡️ Updated by:", updatedBy);

  if (!time) {
    console.warn("⚠️ Missing time in request");
    return res.status(400).json({ message: "Time is required" });
  }

  if (!updatedBy) {
    console.warn("⚠️ Missing updatedBy in request");
    return res.status(400).json({ message: "UpdatedBy is required" });
  }

  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  console.log("➡️ Today's date:", todayStr);

  try {
    // Find record for today
    let cutOff = await CutOff.findOne({ co_date: todayStr });

    if (cutOff) {
      // Update existing
      cutOff.co_time = time;
      cutOff.co_lastupdatedby = updatedBy;
      await cutOff.save();

      return res.status(200).json({
        message: `Cut-off time updated for today (${todayStr}) to ${time}`,
      });
    } else {
      // Create new
      cutOff = new CutOff({
        co_date: todayStr,
        co_time: time,
        co_lastupdatedby: updatedBy,
      });
      await cutOff.save();

      console.log(`✅ Cut-off set for ${todayStr} at ${time} by ${updatedBy}`);
      return res.status(201).json({
        message: `Cut-off time set for today (${todayStr}) at ${time} by ${updatedBy}`,
      });
    }
  } catch (err) {
    console.error("❌ Cut-off error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


/**
 * Get today's cut-off time
 */
export const getTodayCutOff = async (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];
  console.log("🟦 Fetch cut-off for today:", todayStr);

  try {
    const cutOff = await CutOff.findOne({ co_date: todayStr });

    if (!cutOff) {
      console.warn("⚠️ No cut-off set for today");
      return res.status(404).json({ message: "No cut-off set for today" });
    }

    console.log("✅ Cut-off fetched:", cutOff);
    return res.status(200).json({ cutOff });
  } catch (err) {
    console.error("❌ Get cut-off error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
