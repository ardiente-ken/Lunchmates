import User from "../model/userModel.js";
import bcrypt from "bcryptjs";

/**
 * Create a new user
 */
export const create = async (req, res) => {
  try {
    console.log("🟢 Received request to create user:", req.body);

    const { um_firstName, um_lastName, um_userType, um_username, um_userPassword } = req.body;

    // Check if a user with the same first+last name or username already exists
    const userExist = await User.findOne({
      $or: [
        { um_username },
        { um_firstName, um_lastName }
      ]
    });

    if (userExist) {
      console.log("⚠️ User already exists:", userExist);
      return res.status(400).json({ message: "User Already Exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(um_userPassword, 10);

    // Create new user
    const newUser = new User({
      um_firstName,
      um_lastName,
      um_userType,
      um_username,
      um_userPassword: hashedPassword
    });

    const savedData = await newUser.save();
    console.log("✅ User created successfully:", savedData);

    res.status(201).json({
      message: "User created successfully",
      user: {
        um_firstName: savedData.um_firstName,
        um_lastName: savedData.um_lastName,
        um_userType: savedData.um_userType,
        um_username: savedData.um_username
      }
    });

  } catch (error) {
    console.error("❌ Error while creating user:", error);
    res.status(500).json({ errorMessage: error.message });
  }
};

/**
 * User login
 */
export const login = async (req, res) => {
  try {
    const { um_username, um_userPassword } = req.body;

    if (!um_username || !um_userPassword) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user by username
    const user = await User.findOne({ um_username });
    if (!user) {
      console.warn("⚠️ User not found:", um_username);
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(um_userPassword, user.um_userPassword);
    if (!isMatch) {
      console.warn("⚠️ Invalid password for:", um_username);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("✅ Login successful for:", um_username);

    res.status(200).json({
      message: "Login successful",
      user: {
        um_firstName: user.um_firstName,
        um_lastName: user.um_lastName,
        um_userType: user.um_userType,
        um_username: user.um_username
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
