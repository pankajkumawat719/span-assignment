// routes/auth.js
import { Router } from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post("/register", async (req, res) => {
  try {
    const { name, phoneNumber, email, password } = req.body;

    // Basic validation
    if (!name || !phoneNumber || !password) {
      return res
        .status(400)
        .json({ error: "Name, Phone Number, and Password are required." });
    }

    // Check if phone number already exists
    const existingUserByPhone = await User.findOne({ where: { phoneNumber } });
    if (existingUserByPhone) {
      return res
        .status(409)
        .json({
          error: "Phone number already registered. Please use a different one.",
        });
    }

    // Check if email already exists if provided
    if (email) {
      const existingUserByEmail = await User.findOne({ where: { email } });
      if (existingUserByEmail) {
        return res
          .status(409)
          .json({
            error: "Email already registered. Please use a different one.",
          });
      }
    }

    const newUser = await User.create({
      name,
      phoneNumber,
      email, // email can be null
      password, // Password will be hashed by the User model hook
    });

    // Exclude password from the response
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res
      .status(201)
      .json({ message: "User registered successfully", user: userResponse });
  } catch (error) {
    console.error("Error during user registration:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res
      .status(500)
      .json({ error: "Failed to register user", details: error.message });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
router.post("/login", async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res
        .status(400)
        .json({ error: "Phone Number and Password are required." });
    }

    // Find user by phone number
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Exclude password from the response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res
      .status(200)
      .json({ message: "Logged in successfully", token, user: userResponse });
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).json({ error: "Failed to login", details: error.message });
  }
});

export default router;
